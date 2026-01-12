import { useState } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";

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
  },
  {
    id: "2",
    data: "2024-06-14",
    descricao: "Salário",
    estabelecimento: "Empresa XYZ Ltda",
    categoria: "Receita",
    valor: 15420.50,
    tipo: "crédito",
  },
  {
    id: "3",
    data: "2024-06-13",
    descricao: "Uber",
    estabelecimento: "Uber",
    categoria: "Transporte",
    valor: -28.50,
    tipo: "débito",
  },
  {
    id: "4",
    data: "2024-06-13",
    descricao: "Netflix",
    estabelecimento: "Netflix",
    categoria: "Assinaturas",
    valor: -55.90,
    tipo: "débito",
  },
  {
    id: "5",
    data: "2024-06-12",
    descricao: "Restaurante Japonês",
    estabelecimento: "Sushi House",
    categoria: "Alimentação",
    valor: -185.00,
    tipo: "débito",
  },
  {
    id: "6",
    data: "2024-06-11",
    descricao: "Academia",
    estabelecimento: "Smart Fit",
    categoria: "Saúde",
    valor: -99.90,
    tipo: "débito",
  },
  {
    id: "7",
    data: "2024-06-10",
    descricao: "Farmácia",
    estabelecimento: "Drogasil",
    categoria: "Saúde",
    valor: -67.50,
    tipo: "débito",
  },
  {
    id: "8",
    data: "2024-06-09",
    descricao: "iFood",
    estabelecimento: "iFood",
    categoria: "Alimentação",
    valor: -78.90,
    tipo: "débito",
  },
  {
    id: "9",
    data: "2024-06-08",
    descricao: "Gasolina",
    estabelecimento: "Posto Shell",
    categoria: "Transporte",
    valor: -250.00,
    tipo: "débito",
  },
  {
    id: "10",
    data: "2024-06-07",
    descricao: "Freelance",
    estabelecimento: "Cliente ABC",
    categoria: "Receita",
    valor: 2500.00,
    tipo: "crédito",
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

export default function ExtratoScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">Extrato</h1>
          <button className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 text-white pl-10 pr-4 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categorias.map((cat) => (
            <button
              key={cat.nome}
              onClick={() => setSelectedCategory(cat.nome)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat.nome
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
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
          <div className="bg-zinc-900 rounded-xl p-8 text-center">
            <p className="text-zinc-400">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(transacoesPorData)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([data, transacoesData]) => (
                <div key={data}>
                  <p className="text-zinc-400 text-sm mb-3 px-2">
                    {formatDate(data)}
                  </p>
                  <div className="bg-zinc-900 rounded-xl overflow-hidden">
                    {transacoesData.map((transacao, index) => (
                      <div
                        key={transacao.id}
                        className={`p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors ${
                          index !== transacoesData.length - 1 ? "border-b border-zinc-800" : ""
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
                            <p className="text-white">{transacao.estabelecimento}</p>
                            <p className="text-zinc-400 text-sm">{transacao.categoria}</p>
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
    </div>
  );
}
