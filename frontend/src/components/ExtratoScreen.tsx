import { useState, useEffect } from "react";
import { Search, ArrowUpRight, ArrowDownRight, Upload, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { transactionsService, Transaction } from "../services/transactions.service";
import { categoriesService, Category } from "../services/categories.service";

export default function ExtratoScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);
  const { theme } = useTheme();

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        transactionsService.getAll(),
        categoriesService.getAll(),
      ]);

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar transações
  const transacoesFiltradas = transactions.filter((t) => {
    const matchSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.descriptionRaw && t.descriptionRaw.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = selectedCategory === "Todas" || t.category?.name === selectedCategory;
    return matchSearch && matchCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  // Agrupar por data
  const transacoesPorData = transacoesFiltradas.reduce((acc, t) => {
    const date = t.date.split('T')[0]; // Garantir formato YYYY-MM-DD
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const handleTransactionClick = (transacao: Transaction) => {
    setSelectedTransaction(transacao);
    setNewCategory(transacao.category?.id?.toString() || "");
    setShowTransactionModal(true);
  };

  const handleCategoryChange = async () => {
    if (!newCategory || !selectedTransaction) {
      toast.error("Selecione uma categoria.");
      return;
    }

    setSavingCategory(true);
    try {
      const response = await transactionsService.update(selectedTransaction.id, {
        categoryId: newCategory,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      // Atualizar a transação na lista local
      const foundCategory = categories.find(c => c.id.toString() === newCategory);
      setTransactions(prev => 
        prev.map(t => 
          t.id === selectedTransaction.id 
            ? { 
                ...t, 
                category: foundCategory 
                  ? { id: foundCategory.id.toString(), name: foundCategory.name, color: foundCategory.color } 
                  : undefined, 
                categoryId: newCategory 
              }
            : t
        )
      );

      setShowTransactionModal(false);
      toast.success("Categoria alterada com sucesso!");
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Erro ao alterar categoria:", error);
      toast.error("Erro ao alterar categoria");
    } finally {
      setSavingCategory(false);
    }
  };

  // Obter categorias únicas para o filtro
  const categoriasUnicas = [
    { nome: "Todas", cor: "#71717a" },
    ...categories.map(c => ({ nome: c.name, cor: c.color || "#71717a" }))
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">Extrato</h1>
          {/* Botão de importação desativado - em desenvolvimento */}
          <button 
            disabled
            className={`p-2 ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"} rounded-full opacity-50 cursor-not-allowed`}
            title="Em desenvolvimento"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`} />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${
              theme === "dark" 
                ? "bg-zinc-900 text-white border-zinc-800 focus:border-emerald-500" 
                : "bg-zinc-50 text-black border-zinc-200 focus:border-emerald-500"
            } pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors`}
          />
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categoriasUnicas.map((cat) => (
            <button
              key={cat.nome}
              onClick={() => setSelectedCategory(cat.nome)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.nome
                  ? "bg-emerald-600 text-white"
                  : theme === "dark" 
                    ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 pb-4">
        {Object.keys(transacoesPorData).length === 0 ? (
          <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-8 text-center`}>
            <p className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(transacoesPorData)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([data, transacoesData]) => (
                <div key={data}>
                  <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm mb-3 px-2`}>
                    {formatDate(data)}
                  </p>
                  <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl overflow-hidden`}>
                    {transacoesData.map((transacao, index) => (
                      <div
                        key={transacao.id}
                        onClick={() => handleTransactionClick(transacao)}
                        className={`p-4 flex items-center justify-between cursor-pointer ${
                          theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                        } transition-colors ${
                          index !== transacoesData.length - 1 
                            ? theme === "dark" ? "border-b border-zinc-800" : "border-b border-zinc-200"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              transacao.type === "income"
                                ? "bg-emerald-900/30"
                                : "bg-red-900/30"
                            }`}
                          >
                            {transacao.type === "income" ? (
                              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className={theme === "dark" ? "text-white" : "text-black"}>{transacao.description}</p>
                            <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>
                              {transacao.category?.name || "Sem categoria"}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`${
                            transacao.type === "income"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {transacao.type === "income" ? "+" : "-"}
                          {formatCurrency(transacao.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className={theme === "dark" ? "bg-zinc-900 text-white border-zinc-800" : "bg-white text-black"}>
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  {selectedTransaction.description}
                </p>
              </div>
              {selectedTransaction.descriptionRaw && selectedTransaction.descriptionRaw !== selectedTransaction.description && (
                <div className="space-y-2">
                  <Label>Descrição Original</Label>
                  <p className={`p-3 rounded-lg text-sm ${theme === "dark" ? "bg-zinc-800 text-zinc-400" : "bg-zinc-50 text-zinc-500"}`}>
                    {selectedTransaction.descriptionRaw}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Data</Label>
                <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  {new Date(selectedTransaction.date.split('T')[0] + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"} ${
                  selectedTransaction.type === "income" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {selectedTransaction.type === "income" ? "+" : "-"}
                  {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger id="categoria" className={theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white"}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className={theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white"}>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTransaction.account && (
                <div className="space-y-2">
                  <Label>Conta</Label>
                  <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"}`}>
                    {selectedTransaction.account.name}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setShowTransactionModal(false)}
              className={`px-4 py-2 rounded-lg ${theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200"} transition-colors`}
            >
              Fechar
            </button>
            <button
              onClick={handleCategoryChange}
              disabled={savingCategory}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {savingCategory ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}