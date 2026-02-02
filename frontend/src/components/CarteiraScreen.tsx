import { useState, useEffect, useRef } from "react";
import { Plus, TrendingUp, TrendingDown, Trash2, Loader2, Search, X, Calendar, Landmark, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useTheme } from "../contexts/ThemeContext";
import {
  investmentsService,
  Ativo,
  PortfolioItem,
  PortfolioSummary,
  FixedIncomeInvestment,
  FixedIncomePortfolioSummary,
  FixedIncomeTypeOption,
  IndexerOption,
  FixedIncomeType,
  IndexerType,
} from "../services/investments.service";

export default function CarteiraScreen() {
  // Tab de navegação principal
  const [activeTab, setActiveTab] = useState<"variavel" | "fixa">("variavel");
  
  // Estados para Renda Variável
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [ativosDisponiveis, setAtivosDisponiveis] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | "Ação" | "FII">("Todos");
  const [filtroSearch, setFiltroSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ativoToDelete, setAtivoToDelete] = useState<PortfolioItem | null>(null);
  const { theme } = useTheme();

  // Form states para Renda Variável
  const [tipoTransacao, setTipoTransacao] = useState<"compra" | "venda">("compra");
  const [tipoAtivo, setTipoAtivo] = useState<"Ação" | "FII">("Ação");
  const [searchTicker, setSearchTicker] = useState("");
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [dataTransacao, setDataTransacao] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Estados para Renda Fixa
  const [fixedIncomePortfolio, setFixedIncomePortfolio] = useState<FixedIncomeInvestment[]>([]);
  const [fixedIncomeSummary, setFixedIncomeSummary] = useState<FixedIncomePortfolioSummary | null>(null);
  const [fixedIncomeTypes, setFixedIncomeTypes] = useState<FixedIncomeTypeOption[]>([]);
  const [indexerOptions, setIndexerOptions] = useState<IndexerOption[]>([]);
  const [currentRates, setCurrentRates] = useState<{ cdi: number; selic: number; ipca: number; poupanca: number } | null>(null);
  const [fixedIncomeDialogOpen, setFixedIncomeDialogOpen] = useState(false);
  const [fixedIncomeToDelete, setFixedIncomeToDelete] = useState<FixedIncomeInvestment | null>(null);
  const [deleteFixedIncomeConfirmOpen, setDeleteFixedIncomeConfirmOpen] = useState(false);
  const [filtroTipoFixa, setFiltroTipoFixa] = useState<string>("Todos");

  // Form states para Renda Fixa
  const [fixedIncomeName, setFixedIncomeName] = useState("");
  const [fixedIncomeType, setFixedIncomeType] = useState<FixedIncomeType>("CDB");
  const [fixedIncomeInstitution, setFixedIncomeInstitution] = useState("");
  const [fixedIncomeAmount, setFixedIncomeAmount] = useState("");
  const [fixedIncomeRate, setFixedIncomeRate] = useState("");
  const [fixedIncomeIndexer, setFixedIncomeIndexer] = useState<IndexerType>("CDI");
  const [fixedIncomePurchaseDate, setFixedIncomePurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fixedIncomeMaturityDate, setFixedIncomeMaturityDate] = useState("");
  const [fixedIncomeNotes, setFixedIncomeNotes] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, ativosRes, fixedIncomePortfolioRes, typesRes, indexersRes] = await Promise.all([
        investmentsService.getPortfolio(),
        investmentsService.getAtivos(),
        investmentsService.getFixedIncomePortfolio(),
        investmentsService.getFixedIncomeTypes(),
        investmentsService.getFixedIncomeIndexers(),
      ]);

      if (portfolioRes.data) {
        setPortfolio(portfolioRes.data.items);
        setSummary(portfolioRes.data.summary);
      }

      if (ativosRes.data) {
        setAtivosDisponiveis(ativosRes.data);
      }

      if (fixedIncomePortfolioRes.data) {
        setFixedIncomePortfolio(fixedIncomePortfolioRes.data.items);
        setFixedIncomeSummary(fixedIncomePortfolioRes.data.summary);
        setCurrentRates(fixedIncomePortfolioRes.data.rates);
      }

      if (typesRes.data) {
        setFixedIncomeTypes(typesRes.data);
      }

      if (indexersRes.data) {
        setIndexerOptions(indexersRes.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ativos baseado na busca e tipo
  const ativosFiltrados = ativosDisponiveis.filter(ativo => {
    const matchTipo = ativo.tipo === tipoAtivo;
    const matchSearch = searchTicker.length >= 2 && (
      ativo.ticker.toLowerCase().includes(searchTicker.toLowerCase()) ||
      ativo.nome.toLowerCase().includes(searchTicker.toLowerCase())
    );
    
    // Se for venda, mostrar apenas ativos que o usuário possui na carteira
    if (tipoTransacao === "venda") {
      const possuiAtivo = portfolio.some(item => item.ativo.id === ativo.id);
      return matchTipo && matchSearch && possuiAtivo;
    }
    
    return matchTipo && matchSearch;
  }).slice(0, 10); // Limitar a 10 resultados

  // Atualizar preço sugerido quando selecionar ativo
  useEffect(() => {
    if (selectedAtivo) {
      setNovoPreco(selectedAtivo.precoAtual.toString());
    }
  }, [selectedAtivo]);

  const handleSelectAtivo = (ativo: Ativo) => {
    setSelectedAtivo(ativo);
    setSearchTicker(ativo.ticker);
    setShowSuggestions(false);
  };

  const handleClearAtivo = () => {
    setSelectedAtivo(null);
    setSearchTicker("");
    setNovoPreco("");
  };

  const portfolioFiltrado = portfolio.filter((item) => {
    const matchTipo = filtroTipo === "Todos" || item.ativo.tipo === filtroTipo;
    const matchSearch = filtroSearch === "" || 
      item.ativo.ticker.toLowerCase().includes(filtroSearch.toLowerCase()) ||
      item.ativo.nome.toLowerCase().includes(filtroSearch.toLowerCase());
    return matchTipo && matchSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleAdicionarTransacao = async () => {
    if (!selectedAtivo || !novaQuantidade || !novoPreco || !dataTransacao) {
      return;
    }

    setSaving(true);
    try {
      const response = await investmentsService.create({
        ativoId: selectedAtivo.id,
        quantity: tipoTransacao === "venda" ? -parseFloat(novaQuantidade) : parseFloat(novaQuantidade),
        purchasePrice: parseFloat(novoPreco),
        purchaseDate: dataTransacao,
      });

      if (response.data) {
        await loadData();
      }

      // Reset form
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTipoTransacao("compra");
    setTipoAtivo("Ação");
    setSelectedAtivo(null);
    setSearchTicker("");
    setNovaQuantidade("");
    setNovoPreco("");
    setDataTransacao(new Date().toISOString().split('T')[0]);
  };

  const handleOpenDeleteConfirm = (item: PortfolioItem) => {
    setAtivoToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleRemoverTransacoes = async () => {
    if (!ativoToDelete) return;
    
    try {
      const response = await investmentsService.getAll();
      if (response.data) {
        const transacoes = response.data.filter(t => t.ativoId === ativoToDelete.ativo.id);
        for (const transacao of transacoes) {
          await investmentsService.delete(transacao.id);
        }
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao remover transações:", error);
    } finally {
      setDeleteConfirmOpen(false);
      setAtivoToDelete(null);
    }
  };

  // ========== FUNÇÕES RENDA FIXA ==========

  const resetFixedIncomeForm = () => {
    setFixedIncomeName("");
    setFixedIncomeType("CDB");
    setFixedIncomeInstitution("");
    setFixedIncomeAmount("");
    setFixedIncomeRate("");
    setFixedIncomeIndexer("CDI");
    setFixedIncomePurchaseDate(new Date().toISOString().split('T')[0]);
    setFixedIncomeMaturityDate("");
    setFixedIncomeNotes("");
  };

  const handleAdicionarRendaFixa = async () => {
    if (!fixedIncomeName || !fixedIncomeAmount || !fixedIncomeRate || !fixedIncomePurchaseDate) {
      return;
    }

    setSaving(true);
    try {
      const response = await investmentsService.createFixedIncome({
        name: fixedIncomeName,
        type: fixedIncomeType,
        institution: fixedIncomeInstitution || undefined,
        investedAmount: parseFloat(fixedIncomeAmount),
        interestRate: parseFloat(fixedIncomeRate),
        indexer: fixedIncomeIndexer,
        purchaseDate: fixedIncomePurchaseDate,
        maturityDate: fixedIncomeMaturityDate || undefined,
        notes: fixedIncomeNotes || undefined,
      });

      if (response.data) {
        await loadData();
      }

      resetFixedIncomeForm();
      setFixedIncomeDialogOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar renda fixa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteFixedIncomeConfirm = (item: FixedIncomeInvestment) => {
    setFixedIncomeToDelete(item);
    setDeleteFixedIncomeConfirmOpen(true);
  };

  const handleRemoverRendaFixa = async () => {
    if (!fixedIncomeToDelete) return;
    
    try {
      await investmentsService.deleteFixedIncome(fixedIncomeToDelete.id);
      await loadData();
    } catch (error) {
      console.error("Erro ao remover renda fixa:", error);
    } finally {
      setDeleteFixedIncomeConfirmOpen(false);
      setFixedIncomeToDelete(null);
    }
  };

  const getIndexerLabel = (indexer: IndexerType, rate: number) => {
    switch (indexer) {
      case 'CDI':
        return `${rate}% do CDI`;
      case 'SELIC':
        return `${rate}% da Selic`;
      case 'IPCA':
        return `IPCA + ${rate}%`;
      case 'PREFIXADO':
        return `${rate}% a.a.`;
      case 'POUPANCA':
        return 'Poupança';
      default:
        return `${rate}%`;
    }
  };

  const getTypeLabel = (type: FixedIncomeType) => {
    const found = fixedIncomeTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const fixedIncomeFilteredPortfolio = fixedIncomePortfolio.filter((item) => {
    return filtroTipoFixa === "Todos" || item.type === filtroTipoFixa;
  });

  // Calcular totais combinados
  const totalCarteiraValue = (summary?.totalValue || 0) + (fixedIncomeSummary?.totalCurrentValue || 0);
  const totalCarteiraCost = (summary?.totalCost || 0) + (fixedIncomeSummary?.totalInvested || 0);
  const totalCarteiraProfitLoss = totalCarteiraValue - totalCarteiraCost;

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} pb-4`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl">Carteira</h1>
          {activeTab === "variavel" ? (
            <Dialog open={dialogOpen} onOpenChange={(open: boolean) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <button className="p-2 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </DialogTrigger>
              <DialogContent className={`${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"} !w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] max-h-[90vh] overflow-y-auto`}>
                <DialogHeader>
                  <DialogTitle className="text-lg">Nova Transação</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Toggle Compra/Venda */}
                  <div className={`flex rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'}`}>
                    <button
                      type="button"
                      onClick={() => { setTipoTransacao("compra"); handleClearAtivo(); }}
                      style={{
                        backgroundColor: tipoTransacao === "compra" 
                          ? "#059669" 
                          : theme === "dark" ? "#27272a" : "#f4f4f5"
                      }}
                      className={`flex-1 py-4 text-base font-medium transition-colors ${
                        tipoTransacao === "compra"
                          ? "text-white"
                          : theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      Compra
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipoTransacao("venda"); handleClearAtivo(); }}
                      style={{
                        backgroundColor: tipoTransacao === "venda" 
                          ? "#dc2626" 
                          : theme === "dark" ? "#27272a" : "#f4f4f5"
                      }}
                      className={`flex-1 py-4 text-base font-medium transition-colors ${
                        tipoTransacao === "venda"
                          ? "text-white"
                          : theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      Venda
                    </button>
                  </div>

                  {/* Toggle Ação/FII */}
                  <div>
                    <Label className="text-xs mb-2 block">Tipo de Ativo</Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setTipoAtivo("Ação"); handleClearAtivo(); }}
                        style={{
                          backgroundColor: tipoAtivo === "Ação" 
                          ? "#2563eb" 
                          : theme === "dark" ? "#27272a" : "#f4f4f5"
                      }}
                      className={`flex-1 py-3 text-sm rounded-lg transition-colors ${
                        tipoAtivo === "Ação"
                          ? "text-white"
                          : theme === "dark" ? "text-zinc-400 border border-zinc-700" : "text-zinc-600 border border-zinc-200"
                      }`}
                    >
                      Ação
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipoAtivo("FII"); handleClearAtivo(); }}
                      style={{
                        backgroundColor: tipoAtivo === "FII" 
                          ? "#9333ea" 
                          : theme === "dark" ? "#27272a" : "#f4f4f5"
                      }}
                      className={`flex-1 py-3 text-sm rounded-lg transition-colors ${
                        tipoAtivo === "FII"
                          ? "text-white"
                          : theme === "dark" ? "text-zinc-400 border border-zinc-700" : "text-zinc-600 border border-zinc-200"
                      }`}
                    >
                      FII
                    </button>
                  </div>
                </div>

                {/* Campo de Busca com Autocomplete */}
                <div ref={searchRef} className="relative">
                  <Label htmlFor="ticker" className="text-xs">Buscar Ticker</Label>
                  <div className="relative mt-1">
                    {!searchTicker && <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />}
                    <Input
                      id="ticker"
                      placeholder={`Digite o ticker (ex: ${tipoAtivo === "Ação" ? "PETR4" : "HGLG11"})`}
                      value={searchTicker}
                      onChange={(e) => {
                        setSearchTicker(e.target.value);
                        setShowSuggestions(true);
                        if (selectedAtivo && e.target.value !== selectedAtivo.ticker) {
                          setSelectedAtivo(null);
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className={`pl-9 pr-9 text-center ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                    />
                    {searchTicker && (
                      <button
                        type="button"
                        onClick={handleClearAtivo}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      >
                        <X className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                      </button>
                    )}
                  </div>

                  {/* Lista de Sugestões */}
                  {showSuggestions && ativosFiltrados.length > 0 && (
                    <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto ${theme === "dark" ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-zinc-200"
                      }`}>
                      {ativosFiltrados.map((ativo) => (
                        <button
                          key={ativo.id}
                          type="button"
                          onClick={() => handleSelectAtivo(ativo)}
                          className={`w-full px-3 py-2.5 text-left flex items-center justify-between ${theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-zinc-50"
                            } ${selectedAtivo?.id === ativo.id ? (theme === "dark" ? "bg-zinc-700" : "bg-zinc-100") : ""}`}
                        >
                          <div>
                            <span className="font-medium text-sm">{ativo.ticker}</span>
                            <span className={`text-xs ml-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                              {ativo.nome.length > 20 ? ativo.nome.substring(0, 20) + "..." : ativo.nome}
                            </span>
                          </div>
                          <span className="text-xs text-emerald-500">{formatCurrency(Number(ativo.precoAtual))}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showSuggestions && searchTicker.length >= 2 && ativosFiltrados.length === 0 && (
                    <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg p-3 text-center text-sm ${theme === "dark" ? "bg-zinc-800 border border-zinc-700 text-zinc-400" : "bg-white border border-zinc-200 text-zinc-500"
                      }`}>
                      Nenhum {tipoAtivo} encontrado
                    </div>
                  )}
                </div>

                {/* Campo Nome (preenchido automaticamente) */}
                <div>
                  <Label htmlFor="nome" className="text-xs">Nome do Ativo</Label>
                  <Input
                    id="nome"
                    value={selectedAtivo?.nome || ""}
                    disabled
                    placeholder="Selecione um ativo acima"
                    className={`mt-1 ${theme === "dark" ? "bg-zinc-800/50 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"}`}
                  />
                </div>

                {/* Info do Ativo Selecionado */}
                {selectedAtivo && (
                  <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                        {selectedAtivo.categoria || "Sem categoria"}
                      </span>
                      <span className="text-sm font-medium text-emerald-500">
                        {formatCurrency(Number(selectedAtivo.precoAtual))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Data da Transação */}
                <div>
                  <Label htmlFor="dataTransacao" className="text-xs">Data da {tipoTransacao === "compra" ? "Compra" : "Venda"}</Label>
                  <div className="relative mt-1">
                    <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                    <Input
                      id="dataTransacao"
                      type="date"
                      value={dataTransacao}
                      onChange={(e) => setDataTransacao(e.target.value)}
                      className={`pl-10 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                    />
                  </div>
                </div>

                {/* Quantidade e Preço em linha */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="quantidade" className="text-xs">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      placeholder="100"
                      value={novaQuantidade}
                      onChange={(e) => setNovaQuantidade(e.target.value)}
                      className={`mt-1 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preco" className="text-xs">Preço Unitário</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      placeholder="28.50"
                      value={novoPreco}
                      onChange={(e) => setNovoPreco(e.target.value)}
                      className={`mt-1 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                    />
                  </div>
                </div>

                {/* Valor Total */}
                {novaQuantidade && novoPreco && (
                  <div className={`p-3 rounded-lg ${tipoTransacao === "compra"
                      ? (theme === "dark" ? "bg-emerald-900/30" : "bg-emerald-50")
                      : (theme === "dark" ? "bg-red-900/30" : "bg-red-50")
                    }`}>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                      Valor total da {tipoTransacao}
                    </p>
                    <p className={`text-xl font-semibold ${tipoTransacao === "compra" ? "text-emerald-500" : "text-red-500"}`}>
                      {formatCurrency(parseFloat(novaQuantidade) * parseFloat(novoPreco))}
                    </p>
                  </div>
                )}

                {/* Botão de Confirmar */}
                <Button
                  onClick={handleAdicionarTransacao}
                  disabled={saving || !selectedAtivo || !novaQuantidade || !novoPreco}
                  style={{
                    backgroundColor: tipoTransacao === "compra" ? "#059669" : "#dc2626"
                  }}
                  className="w-full py-3 text-white hover:opacity-90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Confirmar {tipoTransacao === "compra" ? "Compra" : "Venda"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          ) : (
            <Dialog open={fixedIncomeDialogOpen} onOpenChange={(open: boolean) => { setFixedIncomeDialogOpen(open); if (!open) resetFixedIncomeForm(); }}>
              <DialogTrigger asChild>
                <button className="p-2 bg-amber-600 rounded-full hover:bg-amber-700 transition-colors">
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </DialogTrigger>
              <DialogContent className={`${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"} !w-[95vw] !max-w-md max-h-[85vh] overflow-y-auto p-4`}>
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base">Novo Investimento</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  {/* Nome e Tipo na mesma linha */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="fixedIncomeName" className="text-[10px] text-zinc-500">Nome</Label>
                      <Input
                        id="fixedIncomeName"
                        placeholder="CDB XP 120% CDI"
                        value={fixedIncomeName}
                        onChange={(e) => setFixedIncomeName(e.target.value)}
                        className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-zinc-500">Tipo</Label>
                      <select
                        value={fixedIncomeType}
                        onChange={(e) => setFixedIncomeType(e.target.value as FixedIncomeType)}
                        className={`w-full h-9 text-sm rounded-md border px-2 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      >
                        {fixedIncomeTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Valor e Instituição */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="fixedIncomeAmount" className="text-[10px] text-zinc-500">Valor (R$)</Label>
                      <Input
                        id="fixedIncomeAmount"
                        type="number"
                        step="0.01"
                        placeholder="10000"
                        value={fixedIncomeAmount}
                        onChange={(e) => setFixedIncomeAmount(e.target.value)}
                        className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fixedIncomeInstitution" className="text-[10px] text-zinc-500">Instituição</Label>
                      <Input
                        id="fixedIncomeInstitution"
                        placeholder="XP, Nubank..."
                        value={fixedIncomeInstitution}
                        onChange={(e) => setFixedIncomeInstitution(e.target.value)}
                        className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      />
                    </div>
                  </div>

                  {/* Indexador e Taxa */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-zinc-500">Indexador</Label>
                      <select
                        value={fixedIncomeIndexer}
                        onChange={(e) => setFixedIncomeIndexer(e.target.value as IndexerType)}
                        className={`w-full h-9 text-sm rounded-md border px-2 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      >
                        {indexerOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} {opt.rate ? `(${opt.rate}%)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="fixedIncomeRate" className="text-[10px] text-zinc-500">
                        {fixedIncomeIndexer === 'IPCA' ? 'IPCA +' : fixedIncomeIndexer === 'PREFIXADO' ? '% a.a.' : `% do ${fixedIncomeIndexer}`}
                      </Label>
                      <Input
                        id="fixedIncomeRate"
                        type="number"
                        step="0.01"
                        placeholder={fixedIncomeIndexer === 'CDI' ? "120" : "12.5"}
                        value={fixedIncomeRate}
                        onChange={(e) => setFixedIncomeRate(e.target.value)}
                        className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      />
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="fixedIncomePurchaseDate" className="text-[10px] text-zinc-500">Aplicação</Label>
                      <Input
                        id="fixedIncomePurchaseDate"
                        type="date"
                        value={fixedIncomePurchaseDate}
                        onChange={(e) => setFixedIncomePurchaseDate(e.target.value)}
                        className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fixedIncomeMaturityDate" className="text-[10px] text-zinc-500">Vencimento</Label>
                      <Input
                        id="fixedIncomeMaturityDate"
                        type="date"
                        value={fixedIncomeMaturityDate}
                        onChange={(e) => setFixedIncomeMaturityDate(e.target.value)}
                        className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}
                      />
                    </div>
                  </div>

                  {/* Preview do Rendimento - Compacto */}
                  {fixedIncomeAmount && fixedIncomeRate && (
                    <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-amber-900/20 border border-amber-800/30" : "bg-amber-50 border border-amber-200"}`}>
                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          <p className={`text-[10px] ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Rend. Mensal</p>
                          <p className="text-sm font-semibold text-amber-500">
                            +{formatCurrency(
                              (() => {
                                const amount = parseFloat(fixedIncomeAmount);
                                const rate = parseFloat(fixedIncomeRate);
                                let annualRate: number;
                                if (fixedIncomeIndexer === 'CDI') {
                                  annualRate = (rate / 100) * (currentRates?.cdi || 12.15);
                                } else if (fixedIncomeIndexer === 'SELIC') {
                                  annualRate = (rate / 100) * (currentRates?.selic || 12.25);
                                } else if (fixedIncomeIndexer === 'IPCA') {
                                  annualRate = (currentRates?.ipca || 4.5) + rate;
                                } else {
                                  annualRate = rate;
                                }
                                const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
                                return amount * monthlyRate;
                              })()
                            )}
                          </p>
                        </div>
                        <div className={`w-px h-8 ${theme === "dark" ? "bg-zinc-700" : "bg-zinc-300"}`} />
                        <div className="text-center flex-1">
                          <p className={`text-[10px] ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Rend. Anual</p>
                          <p className="text-sm font-semibold text-amber-500">
                            +{formatCurrency(
                              (() => {
                                const amount = parseFloat(fixedIncomeAmount);
                                const rate = parseFloat(fixedIncomeRate);
                                let annualRate: number;
                                if (fixedIncomeIndexer === 'CDI') {
                                  annualRate = (rate / 100) * (currentRates?.cdi || 12.15);
                                } else if (fixedIncomeIndexer === 'SELIC') {
                                  annualRate = (rate / 100) * (currentRates?.selic || 12.25);
                                } else if (fixedIncomeIndexer === 'IPCA') {
                                  annualRate = (currentRates?.ipca || 4.5) + rate;
                                } else {
                                  annualRate = rate;
                                }
                                return amount * (annualRate / 100);
                              })()
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botão de Confirmar */}
                  <Button
                    onClick={handleAdicionarRendaFixa}
                    disabled={saving || !fixedIncomeName || !fixedIncomeAmount || !fixedIncomeRate}
                    className="w-full h-10 bg-amber-600 text-white hover:bg-amber-700 text-sm"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Adicionar Investimento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Resumo Total da Carteira */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-4">
          <p className="text-blue-100 text-sm mb-2">Valor Total da Carteira</p>
          <h2 className="text-3xl mb-3 text-white">{formatCurrency(totalCarteiraValue)}</h2>
          <div className="flex items-center gap-2">
            {totalCarteiraProfitLoss >= 0 ? (
              <TrendingUp className="w-4 h-4 text-blue-200" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-300" />
            )}
            <span className={`text-sm ${totalCarteiraProfitLoss >= 0 ? "text-blue-200" : "text-red-300"}`}>
              {totalCarteiraProfitLoss >= 0 ? "+" : ""}
              {formatCurrency(totalCarteiraProfitLoss)} ({totalCarteiraCost > 0 ? ((totalCarteiraProfitLoss / totalCarteiraCost) * 100).toFixed(2) : 0}%)
            </span>
          </div>
          {/* Mini resumo por tipo */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-blue-500/30">
            <div>
              <p className="text-xs text-blue-200">Renda Variável</p>
              <p className="text-sm text-white">{formatCurrency(summary?.totalValue || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200">Renda Fixa</p>
              <p className="text-sm text-white">{formatCurrency(fixedIncomeSummary?.totalCurrentValue || 0)}</p>
            </div>
            {fixedIncomeSummary && fixedIncomeSummary.totalMonthlyYield > 0 && (
              <div>
                <p className="text-xs text-blue-200">Rend. Mensal RF</p>
                <p className="text-sm text-emerald-300">+{formatCurrency(fixedIncomeSummary.totalMonthlyYield)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className={`flex rounded-xl overflow-hidden border mb-4 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={() => setActiveTab("variavel")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === "variavel"
                ? "bg-emerald-600 text-white"
                : theme === "dark" ? "bg-zinc-900 text-zinc-400" : "bg-zinc-50 text-zinc-600"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Renda Variável
          </button>
          <button
            onClick={() => setActiveTab("fixa")}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === "fixa"
                ? "bg-amber-600 text-white"
                : theme === "dark" ? "bg-zinc-900 text-zinc-400" : "bg-zinc-50 text-zinc-600"
            }`}
          >
            <Landmark className="w-4 h-4" />
            Renda Fixa
          </button>
        </div>

        {/* Conteúdo da Aba Renda Variável */}
        {activeTab === "variavel" && (
          <>
            {/* Filtros */}
            <div className="flex gap-2 mb-4">
              {["Todos", "Ação", "FII"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo as typeof filtroTipo)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${filtroTipo === tipo
                      ? "bg-emerald-600 text-white"
                      : theme === "dark"
                        ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            {/* Campo de Busca */}
            <div className="relative mb-6">
              {!filtroSearch && <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />}
              <Input
                placeholder="Buscar por ticker ou nome..."
                value={filtroSearch}
                onChange={(e) => setFiltroSearch(e.target.value)}
                className={`pl-10 pr-10 ${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" : "bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400"}`}
              />
              {filtroSearch && (
                <button
                  onClick={() => setFiltroSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"}`} />
                </button>
              )}
            </div>
          </>
        )}

        {/* Conteúdo da Aba Renda Fixa */}
        {activeTab === "fixa" && (
          <>
            {/* Taxas Atuais */}
            {currentRates && (
              <div className={`grid grid-cols-4 gap-2 mb-4 p-3 rounded-xl ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"}`}>
                <div className="text-center">
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>CDI</p>
                  <p className="text-sm font-medium text-amber-500">{currentRates.cdi}%</p>
                </div>
                <div className="text-center">
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Selic</p>
                  <p className="text-sm font-medium text-amber-500">{currentRates.selic}%</p>
                </div>
                <div className="text-center">
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>IPCA</p>
                  <p className="text-sm font-medium text-amber-500">{currentRates.ipca}%</p>
                </div>
                <div className="text-center">
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Poup.</p>
                  <p className="text-sm font-medium text-amber-500">{currentRates.poupanca}%</p>
                </div>
              </div>
            )}

            {/* Filtro por Tipo */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFiltroTipoFixa("Todos")}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filtroTipoFixa === "Todos"
                    ? "bg-amber-600 text-white"
                    : theme === "dark"
                      ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
              >
                Todos
              </button>
              {["CDB", "TESOURO_SELIC", "TESOURO_IPCA", "LCI", "LCA"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipoFixa(tipo)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${filtroTipoFixa === tipo
                      ? "bg-amber-600 text-white"
                      : theme === "dark"
                        ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                >
                  {getTypeLabel(tipo as FixedIncomeType)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lista de Ativos - Renda Variável */}
      {activeTab === "variavel" && (
        <div className="px-4 space-y-3">
          {portfolioFiltrado.length === 0 ? (
            <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-8 text-center`}>
              <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} mb-2`}>
                {portfolio.length === 0
                  ? "Nenhum ativo na carteira"
                  : "Nenhum ativo encontrado para este filtro"}
              </p>
              <p className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-500"} text-sm`}>
                {portfolio.length === 0
                  ? "Clique no + para adicionar sua primeira compra"
                  : "Tente outro filtro"}
              </p>
            </div>
          ) : (
          portfolioFiltrado.map((item) => {
            const peso = summary && summary.totalValue > 0
              ? (item.currentValue / summary.totalValue) * 100
              : 0;

            return (
              <div key={item.ativo.id} className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{item.ativo.ticker}</h3>
                      <span className={`px-2 py-0.5 ${theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"} text-xs rounded`}>
                        {item.ativo.tipo}
                      </span>
                    </div>
                    <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>{item.ativo.nome}</p>
                    <p className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-500"} text-xs mt-1`}>
                      {item.ativo.categoria || "Sem categoria"} • {item.transactionCount} transação(ões)
                    </p>
                  </div>
                  <div className="text-right flex items-start gap-2">
                    <div>
                      <p className={`${item.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {item.profitLossPercentage >= 0 ? "+" : ""}
                        {item.profitLossPercentage.toFixed(2)}%
                      </p>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"} mt-1`}>
                        {peso.toFixed(1)}% da carteira
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenDeleteConfirm(item)}
                      className={`p-1.5 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} transition-colors`}
                      title="Remover todas as transações deste ativo"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-3 gap-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Quantidade</p>
                    <p className="text-sm">{item.totalQuantity}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Preço Médio</p>
                    <p className="text-sm">{formatCurrency(item.averagePrice)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Preço Atual</p>
                    <p className="text-sm">{formatCurrency(item.currentPrice)}</p>
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"} flex items-center justify-between`}>
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Valor da Posição</p>
                    <p>{formatCurrency(item.currentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Lucro/Prejuízo</p>
                    <p className={item.profitLoss >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {item.profitLoss >= 0 ? "+" : ""}
                      {formatCurrency(item.profitLoss)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Lista de Ativos - Renda Fixa */}
      {activeTab === "fixa" && (
        <div className="px-4 space-y-3">
          {fixedIncomeFilteredPortfolio.length === 0 ? (
            <div className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-8 text-center`}>
              <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} mb-2`}>
                {fixedIncomePortfolio.length === 0
                  ? "Nenhum investimento de renda fixa"
                  : "Nenhum investimento encontrado para este filtro"}
              </p>
              <p className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-500"} text-sm`}>
                {fixedIncomePortfolio.length === 0
                  ? "Clique no + para adicionar seu primeiro investimento"
                  : "Tente outro filtro"}
              </p>
            </div>
          ) : (
            fixedIncomeFilteredPortfolio.map((item) => {
              const peso = fixedIncomeSummary && fixedIncomeSummary.totalCurrentValue > 0
                ? ((item.estimatedCurrentValue || item.investedAmount) / fixedIncomeSummary.totalCurrentValue) * 100
                : 0;

              return (
                <div key={item.id} className={`${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"} rounded-xl p-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <span className={`px-2 py-0.5 bg-amber-600/20 text-amber-500 text-xs rounded`}>
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"} text-sm`}>
                        {getIndexerLabel(item.indexer, Number(item.interestRate))}
                      </p>
                      {item.institution && (
                        <p className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-500"} text-xs mt-1`}>
                          {item.institution}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex items-start gap-2">
                      <div>
                        <p className="text-emerald-400">
                          +{(item.yieldPercentage || 0).toFixed(2)}%
                        </p>
                        <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"} mt-1`}>
                          {peso.toFixed(1)}% da RF
                        </p>
                      </div>
                      <button
                        onClick={() => handleOpenDeleteFixedIncomeConfirm(item)}
                        className={`p-1.5 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} transition-colors`}
                        title="Remover investimento"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Valor Investido</p>
                      <p className="text-sm">{formatCurrency(item.investedAmount)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Valor Atual</p>
                      <p className="text-sm">{formatCurrency(item.estimatedCurrentValue || item.investedAmount)}</p>
                    </div>
                  </div>

                  <div className={`grid grid-cols-3 gap-3 pt-3 mt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Rend. Mensal</p>
                      <p className="text-sm text-emerald-400">+{formatCurrency(item.monthlyYield || 0)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Rend. Anual</p>
                      <p className="text-sm text-emerald-400">+{formatCurrency(item.yearlyYield || 0)}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Taxa Efetiva</p>
                      <p className="text-sm">{(item.annualEffectiveRate || 0).toFixed(2)}% a.a.</p>
                    </div>
                  </div>

                  <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"} flex items-center justify-between`}>
                    <div>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Aplicado em</p>
                      <p className="text-sm">{new Date(item.purchaseDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Dias</p>
                      <p className="text-sm">{item.daysInvested || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Rendimento Total</p>
                      <p className="text-emerald-400">
                        +{formatCurrency(item.totalYield || 0)}
                      </p>
                    </div>
                  </div>

                  {item.maturityDate && (
                    <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
                      <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>
                        Vencimento: {new Date(item.maturityDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão - Renda Variável */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === "dark" ? "text-white" : "text-black"}>
              Excluir ativo da carteira?
            </AlertDialogTitle>
            <AlertDialogDescription className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>
              <span className="block mb-2">
                Você está prestes a excluir <strong className={theme === "dark" ? "text-white" : "text-black"}>{ativoToDelete?.ativo.ticker}</strong> da sua carteira.
              </span>
              <span className="block p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                ⚠️ <strong>Atenção:</strong> Excluir um ativo é diferente de vender! Esta ação remove todas as transações do ativo do seu histórico. Se você vendeu suas cotas, registre uma <strong>operação de venda</strong> para manter o histórico correto.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className={theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200"}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoverTransacoes}
              style={{ backgroundColor: "#640505" }}
              className="!text-white hover:opacity-90"
            >
              Excluir mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação de Exclusão - Renda Fixa */}
      <AlertDialog open={deleteFixedIncomeConfirmOpen} onOpenChange={setDeleteFixedIncomeConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === "dark" ? "text-white" : "text-black"}>
              Excluir investimento de renda fixa?
            </AlertDialogTitle>
            <AlertDialogDescription className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>
              <span className="block mb-2">
                Você está prestes a excluir <strong className={theme === "dark" ? "text-white" : "text-black"}>{fixedIncomeToDelete?.name}</strong> da sua carteira.
              </span>
              <span className="block p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                ⚠️ Esta ação é irreversível. Se você resgatou o investimento, considere apenas desativar para manter o histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className={theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200"}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoverRendaFixa}
              style={{ backgroundColor: "#640505" }}
              className="!text-white hover:opacity-90"
            >
              Excluir mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}