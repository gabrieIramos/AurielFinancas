import { useState } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

// Mock Data - Ativos
const ativosIniciais = [
  {
    id: "1",
    ticker: "ITUB4",
    nome: "Itaú Unibanco",
    tipo: "Ação",
    quantidade: 200,
    precoMedio: 28.50,
    precoAtual: 32.10,
    setor: "Financeiro",
  },
  {
    id: "2",
    ticker: "PETR4",
    nome: "Petrobras",
    tipo: "Ação",
    quantidade: 150,
    precoMedio: 35.20,
    precoAtual: 38.75,
    setor: "Energia",
  },
  {
    id: "3",
    ticker: "VALE3",
    nome: "Vale",
    tipo: "Ação",
    quantidade: 100,
    precoMedio: 68.90,
    precoAtual: 65.40,
    setor: "Mineração",
  },
  {
    id: "4",
    ticker: "HGLG11",
    nome: "CSHG Logística",
    tipo: "FII",
    quantidade: 80,
    precoMedio: 165.00,
    precoAtual: 172.50,
    setor: "Logística",
  },
  {
    id: "5",
    ticker: "MXRF11",
    nome: "Maxi Renda",
    tipo: "FII",
    quantidade: 120,
    precoMedio: 10.20,
    precoAtual: 10.85,
    setor: "Tijolo",
  },
  {
    id: "6",
    ticker: "BBDC4",
    nome: "Bradesco",
    tipo: "Ação",
    quantidade: 180,
    precoMedio: 14.80,
    precoAtual: 13.90,
    setor: "Financeiro",
  },
];

type Ativo = typeof ativosIniciais[0];

export default function CarteiraScreen() {
  const [ativos, setAtivos] = useState<Ativo[]>(ativosIniciais);
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | "Ação" | "FII">("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form states
  const [novoTicker, setNovoTicker] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<"Ação" | "FII">("Ação");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [novoSetor, setNovoSetor] = useState("");

  const ativosFiltrados = ativos.filter(
    (ativo) => filtroTipo === "Todos" || ativo.tipo === filtroTipo
  );

  const calcularLucro = (ativo: Ativo) => {
    return (ativo.precoAtual - ativo.precoMedio) * ativo.quantidade;
  };

  const calcularRentabilidade = (ativo: Ativo) => {
    return ((ativo.precoAtual - ativo.precoMedio) / ativo.precoMedio) * 100;
  };

  const valorTotal = ativos.reduce(
    (acc, ativo) => acc + ativo.precoAtual * ativo.quantidade,
    0
  );

  const lucroTotal = ativos.reduce((acc, ativo) => acc + calcularLucro(ativo), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleAdicionarAtivo = () => {
    if (!novoTicker || !novoNome || !novaQuantidade || !novoPreco) {
      return;
    }

    const novoAtivo: Ativo = {
      id: Date.now().toString(),
      ticker: novoTicker.toUpperCase(),
      nome: novoNome,
      tipo: novoTipo,
      quantidade: parseInt(novaQuantidade),
      precoMedio: parseFloat(novoPreco),
      precoAtual: parseFloat(novoPreco) * (1 + (Math.random() * 0.2 - 0.1)), // Mock random price
      setor: novoSetor || "Outros",
    };

    setAtivos([...ativos, novoAtivo]);
    
    // Reset form
    setNovoTicker("");
    setNovoNome("");
    setNovaQuantidade("");
    setNovoPreco("");
    setNovoSetor("");
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-4">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl">Carteira</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-2 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[380px]">
              <DialogHeader>
                <DialogTitle>Adicionar Ativo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="ticker">Ticker</Label>
                  <Input
                    id="ticker"
                    placeholder="Ex: ITUB4"
                    value={novoTicker}
                    onChange={(e) => setNovoTicker(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Itaú Unibanco"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    value={novoTipo}
                    onChange={(e) => setNovoTipo(e.target.value as "Ação" | "FII")}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
                  >
                    <option value="Ação">Ação</option>
                    <option value="FII">FII</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    placeholder="100"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="preco">Preço Médio</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    placeholder="28.50"
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="setor">Setor</Label>
                  <Input
                    id="setor"
                    placeholder="Ex: Financeiro"
                    value={novoSetor}
                    onChange={(e) => setNovoSetor(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-1"
                  />
                </div>
                <Button
                  onClick={handleAdicionarAtivo}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Resumo */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-6">
          <p className="text-blue-100 text-sm mb-2">Valor Total da Carteira</p>
          <h2 className="text-3xl mb-3">{formatCurrency(valorTotal)}</h2>
          <div className="flex items-center gap-2">
            {lucroTotal >= 0 ? (
              <TrendingUp className="w-4 h-4 text-blue-200" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-300" />
            )}
            <span className={`text-sm ${lucroTotal >= 0 ? "text-blue-200" : "text-red-300"}`}>
              {lucroTotal >= 0 ? "+" : ""}
              {formatCurrency(lucroTotal)} de lucro
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {["Todos", "Ação", "FII"].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo as typeof filtroTipo)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                filtroTipo === tipo
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Ativos */}
      <div className="px-4 space-y-3">
        {ativosFiltrados.map((ativo) => {
          const lucro = calcularLucro(ativo);
          const rentabilidade = calcularRentabilidade(ativo);
          const valorPosicao = ativo.precoAtual * ativo.quantidade;
          const peso = (valorPosicao / valorTotal) * 100;

          return (
            <div key={ativo.id} className="bg-zinc-900 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3>{ativo.ticker}</h3>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded">
                      {ativo.tipo}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">{ativo.nome}</p>
                  <p className="text-zinc-500 text-xs mt-1">{ativo.setor}</p>
                </div>
                <div className="text-right">
                  <p className={`${lucro >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {rentabilidade >= 0 ? "+" : ""}
                    {rentabilidade.toFixed(2)}%
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{peso.toFixed(1)}% da carteira</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Quantidade</p>
                  <p className="text-sm">{ativo.quantidade}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Preço Médio</p>
                  <p className="text-sm">{formatCurrency(ativo.precoMedio)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Preço Atual</p>
                  <p className="text-sm">{formatCurrency(ativo.precoAtual)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Valor da Posição</p>
                  <p>{formatCurrency(valorPosicao)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Lucro/Prejuízo</p>
                  <p className={lucro >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {lucro >= 0 ? "+" : ""}
                    {formatCurrency(lucro)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
