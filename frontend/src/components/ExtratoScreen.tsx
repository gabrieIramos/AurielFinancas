import { useRef, useState } from "react";
import { Search, ArrowUpRight, ArrowDownRight, Download, Upload } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

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
  { nome: "Educação", cor: "#8b5cf6" },
  { nome: "Assinaturas", cor: "#f97316" },
  { nome: "Receita", cor: "#22c55e" },
  { nome: "Compras", cor: "#22c55e" },
  { nome: "Investimentos", cor: "#22c55e" },
  { nome: "Taxas", cor: "#22c55e" },

];

export default function ExtratoScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { theme } = useTheme();

  const allowedExtensions = [".ofx", ".csv"];

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const accepted = Array.from(fileList)
      .map((file) => file.name)
      .filter((name) =>
        allowedExtensions.some((ext) => name.toLowerCase().endsWith(ext))
      );

    if (accepted.length) {
      setUploadedFiles((prev) => {
        const merged = [...prev, ...accepted];
        const unique = Array.from(new Set(merged));
        return unique;
      });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">Extrato</h1>
          <button
            type="button"
            onClick={triggerFileSelect}
            className={`${theme === "dark"
                ? "bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-100"
                : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
              } px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ofx,.csv"
          className="hidden"
          style={{ display: "none" }}
          tabIndex={-1}
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploadedFiles.length > 0 && (
          <div
            className={`${theme === "dark" ? "bg-emerald-950/40 border border-emerald-900/60" : "bg-emerald-50 border border-emerald-100"
              } rounded-xl p-3 mb-4`}
          >
            <p className={`text-xs font-semibold ${theme === "dark" ? "text-emerald-100" : "text-emerald-900"}`}>
              Arquivos selecionados
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {uploadedFiles.map((name) => (
                <span
                  key={name}
                  className={`${theme === "dark"
                      ? "bg-emerald-950/80 text-emerald-100 border border-emerald-800/70"
                      : "bg-white text-emerald-900 border border-emerald-200/70"
                    } rounded-full px-3 py-1 text-xs`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`} />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${theme === "dark"
                ? "bg-zinc-900 text-white border-zinc-800 focus:border-emerald-500"
                : "bg-zinc-50 text-black border-zinc-200 focus:border-emerald-500"
              } pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors`}
          />
        </div>

        {/* Categories Filter - Otimizado para Mobile */}
        <div className="mb-4 -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex flex-nowrap gap-2 pb-2">
            {categorias.map((cat) => {
              const isSelected = selectedCategory === cat.nome;
              return (
                <button
                  key={cat.nome}
                  type="button"
                  onClick={() => setSelectedCategory(cat.nome)}
                  className={`
            whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all
            ${isSelected
                      ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500/20 scale-105 active:scale-95"
                      : theme === "dark"
                        ? "bg-zinc-900 text-zinc-400 border border-zinc-800 active:bg-zinc-800"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200 active:bg-zinc-200"
                    }
          `}
                >
                  {cat.nome}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 pb-24">
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
                        className={`p-4 flex items-center justify-between ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                          } transition-colors ${index !== transacoesData.length - 1
                            ? theme === "dark" ? "border-b border-zinc-800" : "border-b border-zinc-200"
                            : ""
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${transacao.tipo === "crédito"
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
                          className={`${transacao.tipo === "crédito"
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