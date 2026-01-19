import { useState } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Upload, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";

// Mock Data - Transações
const transacoes = [
  {
    id: "1",
    data: "2024-06-15",
    descricao: "Supermercado Extra",
    estabelecimento: "Supermercado Extra",
    categoria: "Alimentação",
    valor: -345.80,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "2",
    data: "2024-06-14",
    descricao: "Salário",
    estabelecimento: "Empresa XYZ Ltda",
    categoria: "Receita",
    valor: 15420.50,
    tipo: "crédito",
    parcelas: null,
  },
  {
    id: "3",
    data: "2024-06-13",
    descricao: "Uber",
    estabelecimento: "Uber",
    categoria: "Transporte",
    valor: -28.50,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "4",
    data: "2024-06-13",
    descricao: "Netflix",
    estabelecimento: "Netflix",
    categoria: "Assinaturas",
    valor: -55.90,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "5",
    data: "2024-06-12",
    descricao: "Restaurante Japonês",
    estabelecimento: "Sushi House",
    categoria: "Alimentação",
    valor: -185.00,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "6",
    data: "2024-06-11",
    descricao: "Academia",
    estabelecimento: "Smart Fit",
    categoria: "Saúde",
    valor: -99.90,
    tipo: "débito",
    parcelas: { atual: 3, total: 12 },
  },
  {
    id: "7",
    data: "2024-06-10",
    descricao: "Farmácia",
    estabelecimento: "Drogasil",
    categoria: "Saúde",
    valor: -67.50,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "8",
    data: "2024-06-09",
    descricao: "iFood",
    estabelecimento: "iFood",
    categoria: "Alimentação",
    valor: -78.90,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "9",
    data: "2024-06-08",
    descricao: "Gasolina",
    estabelecimento: "Posto Shell",
    categoria: "Transporte",
    valor: -250.00,
    tipo: "débito",
    parcelas: null,
  },
  {
    id: "10",
    data: "2024-06-07",
    descricao: "Freelance",
    estabelecimento: "Cliente ABC",
    categoria: "Receita",
    valor: 2500.00,
    tipo: "crédito",
    parcelas: null,
  },
  {
    id: "11",
    data: "2024-06-06",
    descricao: "Notebook Dell",
    estabelecimento: "Dell",
    categoria: "Lazer",
    valor: -450.00,
    tipo: "débito",
    parcelas: { atual: 5, total: 10 },
  },
  {
    id: "12",
    data: "2024-06-05",
    descricao: "Spotify",
    estabelecimento: "Spotify",
    categoria: "Assinaturas",
    valor: -19.90,
    tipo: "débito",
    parcelas: null,
  },
];

const categorias = [
  { nome: "Todas", cor: "#71717a" },
  { nome: "Alimentação", cor: "#f59e0b" },
  { nome: "Transporte", cor: "#3b82f6" },
  { nome: "Saúde", cor: "#10b981" },
  { nome: "Lazer", cor: "#8b5cf6" },
  { nome: "Assinaturas", cor: "#ef4444" },
];

const bancos = [
  { id: "nubank", nome: "Nubank" },
  { id: "inter", nome: "Banco Inter" },
  { id: "itau", nome: "Itaú" },
  { id: "bradesco", nome: "Bradesco" },
  { id: "santander", nome: "Santander" },
  { id: "bb", nome: "Banco do Brasil" },
  { id: "caixa", nome: "Caixa" },
];

export default function ExtratoScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transacoes[0] | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const { theme } = useTheme();

  const transacoesFiltradas = transacoes.filter((t) => {
    const matchSearch = 
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.estabelecimento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "Todas" || t.categoria === selectedCategory;
    return matchSearch && matchCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  // Agrupar por data
  const transacoesPorData = transacoesFiltradas.reduce((acc, t) => {
    const date = t.data;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(t);
    return acc;
  }, {} as Record<string, typeof transacoes>);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'ofx') {
        setSelectedFile(file);
        setShowImportModal(true);
      } else {
        toast.error("Formato de arquivo inválido. Use CSV ou OFX.");
      }
    }
  };

  const handleImportConfirm = () => {
    if (!selectedBank) {
      toast.error("Selecione um banco para importar as transações.");
      return;
    }
    
    // Simulação de importação
    setShowImportModal(false);
    toast.success(`Arquivo importado com sucesso para ${bancos.find(b => b.id === selectedBank)?.nome}!`);
    setSelectedFile(null);
    setSelectedBank("");
  };

  const handleTransactionClick = (transacao: typeof transacoes[0]) => {
    setSelectedTransaction(transacao);
    setNewCategory(transacao.categoria);
    setShowTransactionModal(true);
  };

  const handleCategoryChange = () => {
    if (!newCategory) {
      toast.error("Selecione uma categoria.");
      return;
    }
    
    setShowTransactionModal(false);
    toast.success("Categoria alterada com sucesso!");
    setSelectedTransaction(null);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">Extrato</h1>
          <label htmlFor="file-upload" className={`p-2 cursor-pointer ${theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800" : "bg-zinc-100 hover:bg-zinc-200"} rounded-full transition-colors`}>
            <Upload className="w-5 h-5" />
            <input
              id="file-upload"
              type="file"
              accept=".csv,.ofx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
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
          {categorias.map((cat) => (
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
                              transacao.tipo === "crédito"
                                ? "bg-emerald-900/30"
                                : "bg-red-900/30"
                            }`}
                          >
                            {transacao.tipo === "crédito" ? (
                              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className={theme === "dark" ? "text-white" : "text-black"}>{transacao.estabelecimento}</p>
                            <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>{transacao.categoria}</p>
                          </div>
                        </div>
                        <p
                          className={`${
                            transacao.tipo === "crédito"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {transacao.tipo === "crédito" ? "+" : "-"}
                          {formatCurrency(transacao.valor)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className={theme === "dark" ? "bg-zinc-900 text-white border-zinc-800" : "bg-white text-black"}>
          <DialogHeader>
            <DialogTitle>Importar Extrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Arquivo selecionado</Label>
              <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"} flex items-center justify-between`}>
                <span className="text-sm truncate">{selectedFile?.name}</span>
                <button onClick={() => setShowImportModal(false)} className="ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="banco">Selecione o banco</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger id="banco" className={theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white"}>
                  <SelectValue placeholder="Escolha o banco" />
                </SelectTrigger>
                <SelectContent className={theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white"}>
                  {bancos.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id} className={theme === "dark" ? "text-zinc-100" : "text-zinc-900"}>
                      {banco.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowImportModal(false)}
              className={`px-4 py-2 rounded-lg ${theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-100 hover:bg-zinc-200"} transition-colors`}
            >
              Cancelar
            </button>
            <button
              onClick={handleImportConfirm}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Importar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Modal */}
      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className={theme === "dark" ? "bg-zinc-900 text-white border-zinc-800" : "bg-white text-black"}>
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Estabelecimento</Label>
                <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  {selectedTransaction.estabelecimento}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"}`}>
                  {new Date(selectedTransaction.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"} ${
                  selectedTransaction.tipo === "crédito" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {selectedTransaction.tipo === "crédito" ? "+" : "-"}
                  {formatCurrency(selectedTransaction.valor)}
                </p>
              </div>
              {selectedTransaction.parcelas && (
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <p className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-50"}`}>
                    {selectedTransaction.parcelas.atual} de {selectedTransaction.parcelas.total}
                  </p>
                </div>
              )}
              {selectedTransaction.tipo === "débito" && (
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger id="categoria" className={theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white"}>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent className={theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white"}>
                      {categorias.filter(c => c.nome !== "Todas").map((cat) => (
                        <SelectItem key={cat.nome} value={cat.nome}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            {selectedTransaction?.tipo === "débito" && (
              <button
                onClick={handleCategoryChange}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Salvar
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}