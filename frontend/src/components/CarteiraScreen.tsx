import { useState, useEffect, useRef, useMemo, JSX } from "react";
import { 
  Plus, TrendingUp, TrendingDown, Trash2, Search, X, Calendar, 
  Landmark, ChevronRight, ChevronLeft, PiggyBank, Bitcoin, 
  Building2, LineChart, Coins, BadgePercent, Pencil, Check, XCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
import Loading from "./Loading";
import {
  investmentsService,
  Ativo,
  Investment,
  PortfolioItem,
  PortfolioSummary,
  FixedIncomeInvestment,
  FixedIncomePortfolioSummary,
  FixedIncomeTypeOption,
  IndexerOption,
  FixedIncomeType,
  IndexerType,
} from "../services/investments.service";

// Constante de paginação
const ITEMS_PER_PAGE = 6;

// Tipos de navegação hierárquica
type NavigationLevel = 
  | { level: 0 } // Visão geral
  | { level: 1; category: "variavel" | "fixa" | "cripto" } // Categoria
  | { level: 2; category: "variavel" | "fixa"; subcategory: string }; // Subcategoria

export default function CarteiraScreen() {
  const { theme } = useTheme();
  
  // Navegação hierárquica
  const [navigation, setNavigation] = useState<NavigationLevel>({ level: 0 });
  
  // Paginação para nível 2
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtro para nível 2
  const [searchFilter, setSearchFilter] = useState("");
  
  // Estados para Renda Variável
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [ativosDisponiveis, setAtivosDisponiveis] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ativoToDelete, setAtivoToDelete] = useState<PortfolioItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados para edição de transações
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [transactions, setTransactions] = useState<Investment[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editBroker, setEditBroker] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [deleteTransactionConfirmOpen, setDeleteTransactionConfirmOpen] = useState(false);

  // Form states para Renda Variável
  const [tipoTransacao, setTipoTransacao] = useState<"compra" | "venda">("compra");
  const [tipoAtivo, setTipoAtivo] = useState<"Ação" | "FII">("Ação");
  const [searchTicker, setSearchTicker] = useState("");
  const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [novaCorretora, setNovaCorretora] = useState("");
  const [dataTransacao, setDataTransacao] = useState(() => new Date().toISOString().split('T')[0]);

  // Estados para Renda Fixa
  const [fixedIncomePortfolio, setFixedIncomePortfolio] = useState<FixedIncomeInvestment[]>([]);
  const [fixedIncomeSummary, setFixedIncomeSummary] = useState<FixedIncomePortfolioSummary | null>(null);
  const [fixedIncomeTypes, setFixedIncomeTypes] = useState<FixedIncomeTypeOption[]>([]);
  const [indexerOptions, setIndexerOptions] = useState<IndexerOption[]>([]);
  const [currentRates, setCurrentRates] = useState<{ cdi: number; selic: number; ipca: number; poupanca: number } | null>(null);
  const [fixedIncomeDialogOpen, setFixedIncomeDialogOpen] = useState(false);
  const [fixedIncomeToDelete, setFixedIncomeToDelete] = useState<FixedIncomeInvestment | null>(null);
  const [deleteFixedIncomeConfirmOpen, setDeleteFixedIncomeConfirmOpen] = useState(false);
  const [fixedIncomeErrorMessage, setFixedIncomeErrorMessage] = useState<string | null>(null);

  // Form states para Renda Fixa
  const [fixedIncomeName, setFixedIncomeName] = useState("");
  const [fixedIncomeType, setFixedIncomeType] = useState<FixedIncomeType>("CDB");
  const [fixedIncomeInstitution, setFixedIncomeInstitution] = useState("");
  const [fixedIncomeAmount, setFixedIncomeAmount] = useState("");
  const [fixedIncomeRate, setFixedIncomeRate] = useState("");
  const [fixedIncomeIndexer, setFixedIncomeIndexer] = useState<IndexerType>("CDI");
  const [fixedIncomePurchaseDate, setFixedIncomePurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fixedIncomeMaturityDate, setFixedIncomeMaturityDate] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);

  // Reset page e filtro quando muda de subcategoria
  useEffect(() => {
    setCurrentPage(1);
    setSearchFilter("");
  }, [navigation]);

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

  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const safeValue = isNaN(numValue) ? 0 : numValue;
    const sign = safeValue >= 0 ? '+' : '';
    return `${sign}${safeValue.toFixed(2)}%`;
  };

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, ativosRes, fixedRes, typesRes, indexersRes] = await Promise.all([
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
      if (fixedRes.data) {
        setFixedIncomePortfolio(fixedRes.data.items);
        setFixedIncomeSummary(fixedRes.data.summary);
        setCurrentRates(fixedRes.data.rates);
      }
      if (typesRes.data) setFixedIncomeTypes(typesRes.data);
      if (indexersRes.data) setIndexerOptions(indexersRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais
  const totalCarteiraValue = (summary?.totalValue || 0) + (fixedIncomeSummary?.totalCurrentValue || 0);
  const totalCarteiraCost = (summary?.totalCost || 0) + (fixedIncomeSummary?.totalInvested || 0);
  const totalCarteiraProfitLoss = totalCarteiraValue - totalCarteiraCost;
  const totalCarteiraProfitLossPercentage = totalCarteiraCost > 0 
    ? ((totalCarteiraValue - totalCarteiraCost) / totalCarteiraCost) * 100 
    : 0;

  const rendaVariavelTotal = summary?.totalValue || 0;
  const rendaVariavelProfitLoss = summary?.profitLoss || 0;
  const rendaFixaTotal = fixedIncomeSummary?.totalCurrentValue || 0;
  const rendaFixaProfitLoss = fixedIncomeSummary?.totalYield || 0;

  const acoes = portfolio.filter(p => p.ativo.tipo === "Ação");
  const fiis = portfolio.filter(p => p.ativo.tipo === "FII");
  const acoesTotal = acoes.reduce((acc, p) => acc + p.currentValue, 0);
  const acoesProfitLoss = acoes.reduce((acc, p) => acc + p.profitLoss, 0);
  const fiisTotal = fiis.reduce((acc, p) => acc + p.currentValue, 0);
  const fiisProfitLoss = fiis.reduce((acc, p) => acc + p.profitLoss, 0);

  const fixedIncomeByType = useMemo(() => {
    const grouped: Record<string, { items: FixedIncomeInvestment[]; total: number; yield: number }> = {};
    fixedIncomePortfolio.forEach(item => {
      if (!grouped[item.type]) {
        grouped[item.type] = { items: [], total: 0, yield: 0 };
      }
      grouped[item.type].items.push(item);
      grouped[item.type].total += item.estimatedCurrentValue || item.investedAmount;
      grouped[item.type].yield += item.totalYield || 0;
    });
    return grouped;
  }, [fixedIncomePortfolio]);

  const ativosFiltrados = useMemo(() => {
    if (!searchTicker || searchTicker.length < 1) return [];
    const search = searchTicker.toUpperCase();
    return ativosDisponiveis
      .filter(ativo => 
        ativo.tipo === tipoAtivo &&
        (ativo.ticker.toUpperCase().includes(search) || ativo.nome.toUpperCase().includes(search))
      )
      .slice(0, 10);
  }, [searchTicker, ativosDisponiveis, tipoAtivo]);

  // Navegação
  const goBack = () => {
    if (navigation.level === 2) {
      setNavigation({ level: 1, category: navigation.category });
    } else if (navigation.level === 1) {
      setNavigation({ level: 0 });
    }
  };

  const getTitle = () => {
    if (navigation.level === 0) return "Carteira";
    if (navigation.level === 1) {
      if (navigation.category === "variavel") return "Renda Variável";
      if (navigation.category === "fixa") return "Renda Fixa";
      if (navigation.category === "cripto") return "Criptomoedas";
    }
    if (navigation.level === 2) return navigation.subcategory;
    return "Carteira";
  };

  const getTypeLabel = (type: FixedIncomeType) => {
    const labels: Record<string, string> = {
      'CDB': 'CDB', 'LCI': 'LCI', 'LCA': 'LCA',
      'TESOURO_SELIC': 'Tesouro Selic', 'TESOURO_PREFIXADO': 'Tesouro Prefixado',
      'TESOURO_IPCA': 'Tesouro IPCA+', 'LC': 'LC', 'DEBENTURE': 'Debênture',
      'CRI': 'CRI', 'CRA': 'CRA', 'POUPANCA': 'Poupança',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'CDB': <BadgePercent className="w-5 h-5" />,
      'LCI': <Building2 className="w-5 h-5" />, 'LCA': <Building2 className="w-5 h-5" />,
      'TESOURO_SELIC': <Landmark className="w-5 h-5" />,
      'TESOURO_PREFIXADO': <Landmark className="w-5 h-5" />,
      'TESOURO_IPCA': <Landmark className="w-5 h-5" />,
      'POUPANCA': <PiggyBank className="w-5 h-5" />,
      'Ação': <LineChart className="w-5 h-5" />, 'FII': <Building2 className="w-5 h-5" />,
    };
    return icons[type] || <Coins className="w-5 h-5" />;
  };

  // Validações
  const validateQuantidade = (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (num <= 0) return "A quantidade deve ser maior que zero";
    return null;
  };

  const validatePreco = (value: string): string | null => {
    if (!value) return null;
    const num = parseFloat(value);
    if (num <= 0) return "O valor deve ser maior que zero";
    return null;
  };

  const validateDataCompra = (value: string): string | null => {
    if (!value) return null;
    const dataCompra = new Date(value);
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    if (dataCompra > hoje) return "A data não pode ser maior que hoje";
    return null;
  };

  const quantidadeError = validateQuantidade(novaQuantidade);
  const precoError = validatePreco(novoPreco);
  const dataError = validateDataCompra(dataTransacao);
  const hasValidationErrors = !!(quantidadeError || precoError || dataError);

  const validateFixedAmount = (value: string): string | null => {
    if (!value) return null;
    if (parseFloat(value) <= 0) return "O valor deve ser maior que zero";
    return null;
  };

  const validateFixedRate = (value: string): string | null => {
    if (!value) return null;
    if (parseFloat(value) <= 0) return "A taxa deve ser maior que zero";
    return null;
  };

  const validateFixedPurchaseDate = (value: string): string | null => {
    if (!value) return null;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) return "Data não pode ser futura";
    return null;
  };

  const fixedAmountError = validateFixedAmount(fixedIncomeAmount);
  const fixedRateError = validateFixedRate(fixedIncomeRate);
  const fixedPurchaseDateError = validateFixedPurchaseDate(fixedIncomePurchaseDate);
  const hasFixedIncomeValidationErrors = !!(fixedAmountError || fixedRateError || fixedPurchaseDateError);

  // Funções Renda Variável
  const handleSelectAtivo = (ativo: Ativo) => {
    setSelectedAtivo(ativo);
    setSearchTicker(ativo.ticker);
    setShowSuggestions(false);
  };

  const handleClearAtivo = () => {
    setSelectedAtivo(null);
    setSearchTicker("");
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setTipoTransacao("compra");
    setTipoAtivo("Ação");
    setSelectedAtivo(null);
    setSearchTicker("");
    setNovaQuantidade("");
    setNovoPreco("");
    setNovaCorretora("");
    setDataTransacao(new Date().toISOString().split('T')[0]);
    setErrorMessage(null);
  };

  const handleAdicionarTransacao = async () => {
    if (!selectedAtivo || !novaQuantidade || !novoPreco || !dataTransacao) {
      setErrorMessage("Preencha todos os campos obrigatórios");
      return;
    }
    if (hasValidationErrors) {
      setErrorMessage(quantidadeError || precoError || dataError);
      return;
    }
    setErrorMessage(null);
    setSaving(true);
    try {
      const response = await investmentsService.create({
        ativoId: selectedAtivo.id,
        quantity: tipoTransacao === "venda" ? -parseFloat(novaQuantidade) : parseFloat(novaQuantidade),
        purchasePrice: parseFloat(novoPreco),
        purchaseDate: dataTransacao,
        broker: novaCorretora || undefined,
      });
      if (response.error) {
        setErrorMessage(response.error);
        return;
      }
      if (response.data) {
        await loadData();
        resetForm();
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      setErrorMessage("Erro ao adicionar transação. Tente novamente.");
    } finally {
      setSaving(false);
    }
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

  // Funções Edição de Transações
  const handleOpenEditDialog = async (item: PortfolioItem) => {
    setSelectedPortfolioItem(item);
    setEditDialogOpen(true);
    setLoadingTransactions(true);
    setEditError(null);
    try {
      const response = await investmentsService.getAll();
      if (response.data) {
        const ativoTransactions = response.data
          .filter(t => t.ativoId === item.ativo.id)
          .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        setTransactions(ativoTransactions);
      }
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      setEditError("Erro ao carregar transações");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleStartEdit = (transaction: Investment) => {
    setEditingTransactionId(transaction.id);
    setEditQuantity(Math.abs(transaction.quantity).toString());
    setEditPrice(transaction.purchasePrice.toString());
    setEditDate(new Date(transaction.purchaseDate).toISOString().split('T')[0]);
    setEditBroker(transaction.broker || "");
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingTransactionId(null);
    setEditQuantity("");
    setEditPrice("");
    setEditDate("");
    setEditBroker("");
    setEditError(null);
  };

  const handleSaveEdit = async (transactionId: string, originalQuantity: number) => {
    const qtyError = validateQuantidade(editQuantity);
    const priceError = validatePreco(editPrice);
    const dateError = validateDataCompra(editDate);
    if (qtyError || priceError || dateError) {
      setEditError(qtyError || priceError || dateError);
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const newQuantity = originalQuantity < 0 ? -Math.abs(parseFloat(editQuantity)) : parseFloat(editQuantity);
      const response = await investmentsService.update(transactionId, {
        quantity: newQuantity,
        purchasePrice: parseFloat(editPrice),
        purchaseDate: editDate,
        broker: editBroker || undefined,
      });
      if (response.error) {
        setEditError(response.error);
        return;
      }
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, quantity: newQuantity, purchasePrice: parseFloat(editPrice), purchaseDate: editDate, broker: editBroker }
          : t
      ));
      await loadData();
      handleCancelEdit();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      setEditError("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenDeleteTransaction = (transactionId: string) => {
    setDeleteTransactionId(transactionId);
    setDeleteTransactionConfirmOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    try {
      await investmentsService.delete(deleteTransactionId);
      setTransactions(prev => prev.filter(t => t.id !== deleteTransactionId));
      await loadData();
      if (transactions.length <= 1) {
        setEditDialogOpen(false);
        setSelectedPortfolioItem(null);
      }
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
    } finally {
      setDeleteTransactionConfirmOpen(false);
      setDeleteTransactionId(null);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedPortfolioItem(null);
    setTransactions([]);
    setEditingTransactionId(null);
    setEditError(null);
  };

  // Funções Renda Fixa
  const resetFixedIncomeForm = () => {
    setFixedIncomeName("");
    setFixedIncomeType("CDB");
    setFixedIncomeInstitution("");
    setFixedIncomeAmount("");
    setFixedIncomeRate("");
    setFixedIncomeIndexer("CDI");
    setFixedIncomePurchaseDate(new Date().toISOString().split('T')[0]);
    setFixedIncomeMaturityDate("");
    setFixedIncomeErrorMessage(null);
  };

  const handleAdicionarRendaFixa = async () => {
    if (!fixedIncomeName || !fixedIncomeAmount || !fixedIncomeRate || !fixedIncomePurchaseDate) {
      setFixedIncomeErrorMessage("Preencha todos os campos obrigatórios");
      return;
    }
    if (hasFixedIncomeValidationErrors) {
      setFixedIncomeErrorMessage("Corrija os erros de validação antes de salvar");
      return;
    }
    setFixedIncomeErrorMessage(null);
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
      });
      if (response.error) {
        setFixedIncomeErrorMessage(response.error);
        return;
      }
      if (response.data) {
        await loadData();
        resetFixedIncomeForm();
        setFixedIncomeDialogOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar renda fixa:", error);
      setFixedIncomeErrorMessage("Erro ao adicionar investimento. Tente novamente.");
    } finally {
      setSaving(false);
    }
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

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} flex items-center justify-center`}>
        <Loading size="lg" color="emerald" />
      </div>
    );
  }

  // RENDER: NÍVEL 0 - VISÃO GERAL
  const renderOverview = () => (
    <div className="px-4 space-y-4">
      <div className={`p-6 rounded-2xl`} style={{ background: "linear-gradient(135deg, #0f3a1e, #3db960)" }}>
        <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Patrimônio Total Investido</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalCarteiraValue)}</p>
        <div className="flex items-center gap-2 mt-2">
          {totalCarteiraProfitLoss >= 0 ? (
            <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
          ) : (
            <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
          )}
          <span style={{ color: totalCarteiraProfitLoss >= 0 ? '#10b981' : '#ef4444' }}>
            {totalCarteiraProfitLoss >= 0 ? "+" : ""}{formatCurrency(totalCarteiraProfitLoss)} ({formatPercentage(totalCarteiraProfitLossPercentage)})
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <button onClick={() => setNavigation({ level: 1, category: "variavel" })}
          className={`w-full p-4 rounded-xl text-left ${theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800" : "bg-zinc-100 hover:bg-zinc-200"} transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 rounded-xl bg-blue-500/20">
                <LineChart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Renda Variável</p>
                <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>{portfolio.length} investimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(rendaVariavelTotal)}</p>
                <p className="text-sm" style={{ color: rendaVariavelProfitLoss >= 0 ? '#10b981' : '#ef4444' }}>
                  {rendaVariavelProfitLoss >= 0 ? "+" : ""}{formatCurrency(rendaVariavelProfitLoss)}
                </p>
              </div>
              <ChevronRight className={`w-5 h-5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
            </div>
          </div>
        </button>

        <button onClick={() => setNavigation({ level: 1, category: "fixa" })}
          className={`w-full p-4 rounded-xl text-left ${theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800" : "bg-zinc-100 hover:bg-zinc-200"} transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20">
                <PiggyBank className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Renda Fixa</p>
                <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>{fixedIncomePortfolio.length} investimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(rendaFixaTotal)}</p>
                <p className="text-sm" style={{ color: rendaFixaProfitLoss >= 0 ? '#10b981' : '#ef4444' }}>
                  {rendaFixaProfitLoss >= 0 ? "+" : ""}{formatCurrency(rendaFixaProfitLoss)}
                </p>
              </div>
              <ChevronRight className={`w-5 h-5 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
            </div>
          </div>
        </button>

        <div className={`w-full p-4 rounded-xl ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"} opacity-60`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20">
                <Bitcoin className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Criptomoedas</p>
                <p className={`text-sm ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Em breve</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${theme === "dark" ? "text-zinc-600" : "text-zinc-300"}`} />
          </div>
        </div>
      </div>    
    </div>
  );

  // RENDER: NÍVEL 1 - RENDA VARIÁVEL
  const renderRendaVariavel = () => (
    <div style={{ padding: '0 16px' }}>
      {/* Card principal - igual ao nível 0 */}
      <div style={{ 
        padding: '24px', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, #0f3a1e, #3db960)',
        marginBottom: '16px'
      }}>
        <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '4px' }}>
          Total em Renda Variável
        </p>
        <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
          {formatCurrency(rendaVariavelTotal)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {rendaVariavelProfitLoss >= 0 ? (
            <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
          ) : (
            <TrendingDown style={{ width: '16px', height: '16px', color: '#ef4444' }} />
          )}
          <span style={{ color: rendaVariavelProfitLoss >= 0 ? '#10b981' : '#ef4444' }}>
            {rendaVariavelProfitLoss >= 0 ? "+" : ""}{formatCurrency(rendaVariavelProfitLoss)} ({summary?.profitLossPercentage ? formatPercentage(summary.profitLossPercentage) : '0%'})
          </span>
        </div>
      </div>

      {/* Botões de navegação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => setNavigation({ level: 2, category: "variavel", subcategory: "Ações" })}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '12px', 
            backgroundColor: '#18181b',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                <LineChart style={{ width: '20px', height: '20px', color: '#10b981' }} />
              </div>
              <div>
                <p style={{ fontWeight: '500', color: '#ffffff', margin: 0 }}>Ações</p>
                <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>{acoes.length} ativos</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', color: '#ffffff', margin: 0 }}>{formatCurrency(acoesTotal)}</p>
                <p style={{ fontSize: '14px', color: acoesProfitLoss >= 0 ? '#10b981' : '#ef4444', margin: 0 }}>
                  {acoesProfitLoss >= 0 ? "+" : ""}{formatCurrency(acoesProfitLoss)}
                </p>
              </div>
              <ChevronRight style={{ width: '20px', height: '20px', color: '#71717a' }} />
            </div>
          </div>
        </button>

        <button 
          onClick={() => setNavigation({ level: 2, category: "variavel", subcategory: "FIIs" })}
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: '12px', 
            backgroundColor: '#18181b',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Building2 style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              </div>
              <div>
                <p style={{ fontWeight: '500', color: '#ffffff', margin: 0 }}>Fundos Imobiliários</p>
                <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>{fiis.length} fundos</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', color: '#ffffff', margin: 0 }}>{formatCurrency(fiisTotal)}</p>
                <p style={{ fontSize: '14px', color: fiisProfitLoss >= 0 ? '#10b981' : '#ef4444', margin: 0 }}>
                  {fiisProfitLoss >= 0 ? "+" : ""}{formatCurrency(fiisProfitLoss)}
                </p>
              </div>
              <ChevronRight style={{ width: '20px', height: '20px', color: '#71717a' }} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  // RENDER: NÍVEL 1 - RENDA FIXA
  const renderRendaFixa = () => {
    const allFixedIncomeTypes: FixedIncomeType[] = [
      'CDB', 'LCI', 'LCA', 'TESOURO_SELIC', 'TESOURO_PREFIXADO', 'TESOURO_IPCA', 'LC', 'DEBENTURE', 'CRI', 'CRA', 'POUPANCA'
    ];

    return (
      <div style={{ padding: '0 16px' }}>
        {/* Card principal - igual ao nível 0 */}
        <div style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          background: 'linear-gradient(135deg, #0f3a1e, #3db960)',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '4px' }}>
            Total em Renda Fixa
          </p>
          <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            {formatCurrency(rendaFixaTotal)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {rendaFixaProfitLoss >= 0 ? (
              <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
            ) : (
              <TrendingDown style={{ width: '16px', height: '16px', color: '#ef4444' }} />
            )}
            <span style={{ color: rendaFixaProfitLoss >= 0 ? '#10b981' : '#ef4444' }}>
              {rendaFixaProfitLoss >= 0 ? "+" : ""}{formatCurrency(rendaFixaProfitLoss)} de rendimento
            </span>
          </div>
        </div>

        {/* Botões de navegação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allFixedIncomeTypes.map((type) => {
            const data = fixedIncomeByType[type];
            const hasItems = data && data.items.length > 0;
            
            return (
              <button 
                key={type} 
                onClick={() => setNavigation({ level: 2, category: "fixa", subcategory: type })}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  backgroundColor: '#18181b',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      padding: '10px', 
                      borderRadius: '12px', 
                      backgroundColor: hasItems ? 'rgba(168, 85, 247, 0.2)' : '#27272a',
                      color: hasItems ? '#a855f7' : '#71717a'
                    }}>
                      {getTypeIcon(type)}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500', color: hasItems ? '#ffffff' : '#71717a', margin: 0 }}>
                        {getTypeLabel(type)}
                      </p>
                      <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>
                        {hasItems ? `${data.items.length} ${data.items.length === 1 ? 'título' : 'títulos'}` : 'Nenhum título'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {hasItems ? (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', color: '#ffffff', margin: 0 }}>{formatCurrency(data.total)}</p>
                        <p style={{ fontSize: '14px', color: '#10b981', margin: 0 }}>+{formatCurrency(data.yield)}</p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '14px', color: '#52525b', margin: 0 }}>R$ 0,00</p>
                    )}
                    <ChevronRight style={{ width: '20px', height: '20px', color: '#71717a' }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // RENDER: NÍVEL 2 - LISTA DE ATIVOS COM PAGINAÇÃO
  const renderAssetList = () => {
    if (navigation.level !== 2) return null;

    if (navigation.category === "variavel") {
      const baseItems = navigation.subcategory === "Ações" ? acoes : fiis;
      // Aplicar filtro
      const allItems = searchFilter 
        ? baseItems.filter(item => 
            item.ativo.ticker.toLowerCase().includes(searchFilter.toLowerCase()) ||
            item.ativo.nome.toLowerCase().includes(searchFilter.toLowerCase())
          )
        : baseItems;
      const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const items = allItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      return (
        <div className="px-4 space-y-3">
          {/* Filtro */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
            <Input
              placeholder={`Buscar ${navigation.subcategory === "Ações" ? "ação" : "FII"}...`}
              value={searchFilter}
              onChange={(e) => { setSearchFilter(e.target.value); setCurrentPage(1); }}
              className={`pl-10 pr-10 ${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" : "bg-zinc-100 border-zinc-200 text-black placeholder:text-zinc-400"}`}
            />
            {searchFilter && (
              <button onClick={() => setSearchFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"}`} />
              </button>
            )}
          </div>

          {items.map((item) => (
            <div key={item.ativo.id} onClick={() => handleOpenEditDialog(item)}
              className={`p-4 rounded-xl cursor-pointer ${theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800" : "bg-zinc-100 hover:bg-zinc-200"} transition-colors`}>
              
              {/* Header: Ticker + Variação do Dia */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">{item.ativo.ticker}</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium`} style={{ backgroundColor: (item.ativo.variacaoDia || 0) >= 0 ? '#22c55e20' : '#ef444420', color: (item.ativo.variacaoDia || 0) >= 0 ? '#22c55e' : '#ef4444' }}>                      
                    {(item.ativo.variacaoDia || 0) >= 0 ? "↑" : "↓"} {formatPercentage(item.ativo.variacaoDia || 0)} hoje
                  </span>
                </div>
                <ChevronRight className={`w-5 h-5 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
              </div>

              {/* Grid de informações */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Quantidade */}
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Quantidade</p>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                    {item.totalQuantity} cotas
                  </p>
                </div>

                {/* Preço Atual (cotação) */}
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Cotação Atual</p>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                    {formatCurrency(item.currentPrice)}
                  </p>
                </div>

                {/* Preço Médio */}
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Preço Médio</p>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                    {formatCurrency(item.averagePrice)}
                  </p>
                </div>

                {/* Total Investido */}
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Total Investido</p>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                    {formatCurrency(item.totalCost)}
                  </p>
                </div>
              </div>

              {/* Footer: Valor Atual + Lucro/Prejuízo */}
              <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Valor Total</p>
                    <p className="font-semibold">{formatCurrency(item.currentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Lucro/Prejuízo</p>
                    <p className="font-semibold" style={{ color: item.profitLoss >= 0 ? "#22c55e" : "#ef4444" }}>
                      {item.profitLoss >= 0 ? "+" : ""}{formatCurrency(item.profitLoss)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {allItems.length === 0 && (
            <div className={`p-8 rounded-xl text-center ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
              {searchFilter ? (
                <>
                  <Search className={`w-10 h-10 mx-auto mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                  <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Nenhum resultado para "{searchFilter}"</p>
                </>
              ) : (
                <>
                  <LineChart className={`w-10 h-10 mx-auto mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                  <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Nenhum {navigation.subcategory === "Ações" ? "ação" : "FII"} na carteira</p>
                </>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-emerald-600 text-white" : theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"}`}>
                    {page}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {allItems.length > 0 && (
            <p className={`text-center text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, allItems.length)} de {allItems.length} ativos
            </p>
          )}
        </div>
      );
    }

    if (navigation.category === "fixa") {
      const baseItems = fixedIncomeByType[navigation.subcategory]?.items || [];
      // Aplicar filtro
      const allItems = searchFilter 
        ? baseItems.filter(item => 
            item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
            (item.institution && item.institution.toLowerCase().includes(searchFilter.toLowerCase()))
          )
        : baseItems;
      const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const items = allItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      
      return (
        <div className="px-4 space-y-3">
          {/* Filtro */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
            <Input
              placeholder={`Buscar ${getTypeLabel(navigation.subcategory as FixedIncomeType)}...`}
              value={searchFilter}
              onChange={(e) => { setSearchFilter(e.target.value); setCurrentPage(1); }}
              className={`pl-10 pr-10 ${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500" : "bg-zinc-100 border-zinc-200 text-black placeholder:text-zinc-400"}`}
            />
            {searchFilter && (
              <button onClick={() => setSearchFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"}`} />
              </button>
            )}
          </div>

          {items.map((item) => (
            <div key={item.id} className={`p-4 rounded-xl ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>{item.institution || 'Sem instituição'}</p>
                </div>
                <button onClick={() => { setFixedIncomeToDelete(item); setDeleteFixedIncomeConfirmOpen(true); }}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Investido</p>
                  <p className="text-sm font-medium">{formatCurrency(item.investedAmount)}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Valor Atual</p>
                  <p className="text-sm font-medium">{formatCurrency(item.estimatedCurrentValue || item.investedAmount)}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Taxa</p>
                  <p className="text-sm font-medium">{item.interestRate}% {item.indexer}</p>
                </div>
                <div>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Rendimento</p>
                  <p className="text-sm font-medium text-emerald-500">+{formatCurrency(item.totalYield || 0)}</p>
                </div>
              </div>
              {item.maturityDate && (
                <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-zinc-200"}`}>
                  <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>
                    Vencimento: {new Date(item.maturityDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          ))}

          {allItems.length === 0 && (
            <div className={`p-8 rounded-xl text-center ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
              {searchFilter ? (
                <>
                  <Search className={`w-10 h-10 mx-auto mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                  <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Nenhum resultado para "{searchFilter}"</p>
                </>
              ) : (
                <>
                  <PiggyBank className={`w-10 h-10 mx-auto mb-2 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                  <p className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Nenhum {getTypeLabel(navigation.subcategory as FixedIncomeType)} na carteira</p>
                  <p className={`text-sm mt-1 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Clique no + para adicionar</p>
                </>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-purple-600 text-white" : theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"}`}>
                    {page}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-200"} ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {allItems.length > 0 && (
            <p className={`text-center text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, allItems.length)} de {allItems.length} títulos
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // RENDER PRINCIPAL
  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"} pb-24`}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {navigation.level > 0 && (
              <button onClick={goBack} className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}>
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-semibold">{getTitle()}</h1>
          </div>
          
          {navigation.level === 2 && navigation.category === "variavel" && (
            <button onClick={() => { setTipoAtivo(navigation.subcategory === "Ações" ? "Ação" : "FII"); setDialogOpen(true); }}
              className="p-2 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
          {navigation.level === 2 && navigation.category === "fixa" && (
            <button onClick={() => { setFixedIncomeType(navigation.subcategory as FixedIncomeType); setFixedIncomeDialogOpen(true); }}
              className="p-2 bg-purple-600 rounded-full hover:bg-purple-700 transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {navigation.level === 0 && renderOverview()}
      {navigation.level === 1 && navigation.category === "variavel" && renderRendaVariavel()}
      {navigation.level === 1 && navigation.category === "fixa" && renderRendaFixa()}
      {navigation.level === 2 && renderAssetList()}

      {/* DIALOG NOVA TRANSAÇÃO RENDA VARIÁVEL */}
      <Dialog open={dialogOpen} onOpenChange={(open: boolean) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className={`${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"} !w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] max-h-[90vh] overflow-y-auto`}>
          <DialogHeader><DialogTitle className="text-lg">Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className={`flex rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'}`}>
              <button type="button" onClick={() => { setTipoTransacao("compra"); handleClearAtivo(); }}
                style={{ backgroundColor: tipoTransacao === "compra" ? "#059669" : theme === "dark" ? "#27272a" : "#f4f4f5" }}
                className={`flex-1 py-4 text-base font-medium transition-colors ${tipoTransacao === "compra" ? "text-white" : theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Compra
              </button>
              <button type="button" onClick={() => { setTipoTransacao("venda"); handleClearAtivo(); }}
                style={{ backgroundColor: tipoTransacao === "venda" ? "#dc2626" : theme === "dark" ? "#27272a" : "#f4f4f5" }}
                className={`flex-1 py-4 text-base font-medium transition-colors ${tipoTransacao === "venda" ? "text-white" : theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                Venda
              </button>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Tipo de Ativo</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setTipoAtivo("Ação"); handleClearAtivo(); }}
                  style={{ backgroundColor: tipoAtivo === "Ação" ? "#2563eb" : theme === "dark" ? "#27272a" : "#f4f4f5" }}
                  className={`flex-1 py-3 text-sm rounded-lg transition-colors ${tipoAtivo === "Ação" ? "text-white" : theme === "dark" ? "text-zinc-400 border border-zinc-700" : "text-zinc-600 border border-zinc-200"}`}>
                  Ação
                </button>
                <button type="button" onClick={() => { setTipoAtivo("FII"); handleClearAtivo(); }}
                  style={{ backgroundColor: tipoAtivo === "FII" ? "#9333ea" : theme === "dark" ? "#27272a" : "#f4f4f5" }}
                  className={`flex-1 py-3 text-sm rounded-lg transition-colors ${tipoAtivo === "FII" ? "text-white" : theme === "dark" ? "text-zinc-400 border border-zinc-700" : "text-zinc-600 border border-zinc-200"}`}>
                  FII
                </button>
              </div>
            </div>

            <div ref={searchRef} className="relative">
              <Label htmlFor="ticker" className="text-xs">Buscar Ticker</Label>
              <div className="relative mt-1">
                {!searchTicker && <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />}
                <Input id="ticker" placeholder={`Digite o ticker (ex: ${tipoAtivo === "Ação" ? "PETR4" : "HGLG11"})`} value={searchTicker}
                  onChange={(e) => { setSearchTicker(e.target.value); setShowSuggestions(true); if (selectedAtivo && e.target.value !== selectedAtivo.ticker) setSelectedAtivo(null); }}
                  onFocus={() => setShowSuggestions(true)}
                  className={`pl-9 pr-9 text-center ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
                {searchTicker && (
                  <button type="button" onClick={handleClearAtivo} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4">
                    <X className={`w-4 h-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                  </button>
                )}
              </div>
              {showSuggestions && ativosFiltrados.length > 0 && (
                <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto ${theme === "dark" ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-zinc-200"}`}>
                  {ativosFiltrados.map((ativo) => (
                    <button key={ativo.id} type="button" onClick={() => handleSelectAtivo(ativo)}
                      className={`w-full px-3 py-2.5 text-left flex items-center justify-between ${theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-zinc-50"} ${selectedAtivo?.id === ativo.id ? (theme === "dark" ? "bg-zinc-700" : "bg-zinc-100") : ""}`}>
                      <div>
                        <span className="font-medium text-sm">{ativo.ticker}</span>
                        <span className={`text-xs ml-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>{ativo.nome.length > 20 ? ativo.nome.substring(0, 20) + "..." : ativo.nome}</span>
                      </div>
                      <span className="text-xs text-emerald-500">{formatCurrency(Number(ativo.precoAtual))}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="nome" className="text-xs">Nome do Ativo</Label>
              <Input id="nome" value={selectedAtivo?.nome || ""} disabled placeholder="Selecione um ativo acima"
                className={`mt-1 ${theme === "dark" ? "bg-zinc-800/50 border-zinc-700 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"}`} />
            </div>

            {selectedAtivo && (
              <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>{selectedAtivo.categoria || "Sem categoria"}</span>
                  <span className="text-sm font-medium text-emerald-500">{formatCurrency(Number(selectedAtivo.precoAtual))}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="dataTransacao" className="text-xs">Data da {tipoTransacao === "compra" ? "Compra" : "Venda"}</Label>
              <div className="relative mt-1">
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                <Input id="dataTransacao" type="date" max={new Date().toISOString().split('T')[0]} value={dataTransacao}
                  onChange={(e) => setDataTransacao(e.target.value)}
                  className={`pl-10 ${dataError ? 'border-red-500' : ''} ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
              </div>
              {dataError && <p className="text-xs text-red-500 mt-1">{dataError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantidade" className="text-xs">Quantidade</Label>
                <Input id="quantidade" type="number" min="0.01" step="0.01" placeholder="100" value={novaQuantidade}
                  onChange={(e) => setNovaQuantidade(e.target.value)}
                  className={`mt-1 ${quantidadeError ? 'border-red-500' : ''} ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
                {quantidadeError && <p className="text-xs text-red-500 mt-1">{quantidadeError}</p>}
              </div>
              <div>
                <Label htmlFor="preco" className="text-xs">Preço Unitário</Label>
                <Input id="preco" type="number" min="0.01" step="0.01" placeholder="28.50" value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  className={`mt-1 ${precoError ? 'border-red-500' : ''} ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
                {precoError && <p className="text-xs text-red-500 mt-1">{precoError}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="corretora" className="text-xs">Corretora (opcional)</Label>
              <div className="relative mt-1">
                <Landmark className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                <Input id="corretora" type="text" placeholder="Ex: XP, Clear, Nubank..." value={novaCorretora}
                  onChange={(e) => setNovaCorretora(e.target.value)}
                  className={`pl-10 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
              </div>
            </div>

            {novaQuantidade && novoPreco && (
              <div className={`p-3 rounded-lg ${tipoTransacao === "compra" ? (theme === "dark" ? "bg-emerald-900/30" : "bg-emerald-50") : (theme === "dark" ? "bg-red-900/30" : "bg-red-50")}`}>
                <p className={`text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Valor total da {tipoTransacao}</p>
                <p className={`text-xl font-semibold ${tipoTransacao === "compra" ? "text-emerald-500" : "text-red-500"}`}>
                  {formatCurrency(parseFloat(novaQuantidade) * parseFloat(novoPreco))}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-500 text-center">{errorMessage}</p>
              </div>
            )}

            <Button onClick={handleAdicionarTransacao} disabled={saving || !selectedAtivo || !novaQuantidade || !novoPreco}
              style={{ backgroundColor: tipoTransacao === "compra" ? "#059669" : "#dc2626" }} className="w-full py-3 text-white hover:opacity-90 flex items-center justify-center gap-2">
              {saving && <Loading size="sm" color="white" inline />}
              Confirmar {tipoTransacao === "compra" ? "Compra" : "Venda"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG NOVA RENDA FIXA */}
      <Dialog open={fixedIncomeDialogOpen} onOpenChange={(open: boolean) => { setFixedIncomeDialogOpen(open); if (!open) resetFixedIncomeForm(); }}>
        <DialogContent className={`${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"} !w-[95vw] !max-w-md max-h-[85vh] overflow-y-auto p-4`}>
          <DialogHeader className="pb-2"><DialogTitle className="text-base">Novo Investimento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label htmlFor="fixedIncomeName" className="text-[10px] text-zinc-500">Nome</Label>
                <Input id="fixedIncomeName" placeholder="CDB XP 120% CDI" value={fixedIncomeName}
                  onChange={(e) => setFixedIncomeName(e.target.value)}
                  className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
              </div>
              <div>
                <Label className="text-[10px] text-zinc-500">Tipo</Label>
                <select value={fixedIncomeType} onChange={(e) => setFixedIncomeType(e.target.value as FixedIncomeType)}
                  className={`w-full h-9 text-sm rounded-md border px-2 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}>
                  {fixedIncomeTypes.map((type) => (<option key={type.value} value={type.value}>{type.label}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fixedIncomeAmount" className="text-[10px] text-zinc-500">Valor (R$)</Label>
                <Input id="fixedIncomeAmount" type="number" min="0.01" step="0.01" placeholder="10000" value={fixedIncomeAmount}
                  onChange={(e) => setFixedIncomeAmount(e.target.value)}
                  className={`h-9 text-sm ${fixedAmountError ? 'border-red-500' : ''} ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
                {fixedAmountError && <p className="text-xs text-red-500 mt-1">{fixedAmountError}</p>}
              </div>
              <div>
                <Label htmlFor="fixedIncomeInstitution" className="text-[10px] text-zinc-500">Instituição</Label>
                <Input id="fixedIncomeInstitution" placeholder="XP, Nubank..." value={fixedIncomeInstitution}
                  onChange={(e) => setFixedIncomeInstitution(e.target.value)}
                  className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-zinc-500">Indexador</Label>
                <select value={fixedIncomeIndexer} onChange={(e) => setFixedIncomeIndexer(e.target.value as IndexerType)}
                  className={`w-full h-9 text-sm rounded-md border px-2 ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`}>
                  {indexerOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label} {opt.rate ? `(${opt.rate}%)` : ''}</option>))}
                </select>
              </div>
              <div>
                <Label htmlFor="fixedIncomeRate" className="text-[10px] text-zinc-500">
                  {fixedIncomeIndexer === 'IPCA' ? 'IPCA +' : fixedIncomeIndexer === 'PREFIXADO' ? '% a.a.' : `% do ${fixedIncomeIndexer}`}
                </Label>
                <Input id="fixedIncomeRate" type="number" min="0.01" step="0.01" placeholder={fixedIncomeIndexer === 'CDI' ? "120" : "12.5"}
                  value={fixedIncomeRate} onChange={(e) => setFixedIncomeRate(e.target.value)}
                  className={`h-9 text-sm ${fixedRateError ? 'border-red-500' : ''} ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
                {fixedRateError && <p className="text-xs text-red-500 mt-1">{fixedRateError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fixedIncomePurchaseDate" className="text-[10px] text-zinc-500">Aplicação</Label>
                <Input id="fixedIncomePurchaseDate" type="date" max={new Date().toISOString().split('T')[0]} value={fixedIncomePurchaseDate}
                  onChange={(e) => setFixedIncomePurchaseDate(e.target.value)}
                  className={`h-9 text-sm ${fixedPurchaseDateError ? 'border-red-500' : ''} ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
                {fixedPurchaseDateError && <p className="text-xs text-red-500 mt-1">{fixedPurchaseDateError}</p>}
              </div>
              <div>
                <Label htmlFor="fixedIncomeMaturityDate" className="text-[10px] text-zinc-500">Vencimento</Label>
                <Input id="fixedIncomeMaturityDate" type="date" value={fixedIncomeMaturityDate}
                  onChange={(e) => setFixedIncomeMaturityDate(e.target.value)}
                  className={`h-9 text-sm ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-200 text-black"}`} />
              </div>
            </div>

            {fixedIncomeErrorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-500 text-center">{fixedIncomeErrorMessage}</p>
              </div>
            )}

            <Button onClick={handleAdicionarRendaFixa}
              disabled={saving || !fixedIncomeName || !fixedIncomeAmount || !fixedIncomeRate || hasFixedIncomeValidationErrors}
              className="w-full h-10 bg-purple-600 text-white hover:bg-purple-700 text-sm flex items-center justify-center gap-2">
              {saving && <Loading size="sm" color="white" inline />}
              Adicionar Investimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIÇÃO DE TRANSAÇÕES */}
      <Dialog open={editDialogOpen} onOpenChange={(open: boolean) => !open && handleCloseEditDialog()}>
        <DialogContent className={`${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-black"} !w-[95vw] !max-w-[95vw] sm:!max-w-[600px] max-h-[85vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <span>Transações - {selectedPortfolioItem?.ativo.ticker}</span>
              <span className={`px-2 py-0.5 text-xs rounded ${theme === "dark" ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-700"}`}>
                {selectedPortfolioItem?.ativo.tipo}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8"><Loading size="lg" color="emerald" /></div>
            ) : transactions.length === 0 ? (
              <p className={`text-center py-8 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Nenhuma transação encontrada</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const isEditing = editingTransactionId === transaction.id;
                  const isCompra = transaction.quantity > 0;
                  return (
                    <div key={transaction.id} className={`p-4 rounded-lg border ${isEditing ? "border-blue-500" : theme === "dark" ? "border-zinc-800 bg-zinc-800/50" : "border-zinc-200 bg-zinc-50"}`}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-1 text-xs rounded ${isCompra ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                              {isCompra ? "Compra" : "Venda"}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={handleCancelEdit} className={`p-1.5 rounded ${theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-zinc-200"}`} title="Cancelar">
                                <XCircle className="w-4 h-4 text-zinc-400" />
                              </button>
                              <button onClick={() => handleSaveEdit(transaction.id, transaction.quantity)} disabled={savingEdit}
                                className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center" title="Salvar">
                                {savingEdit ? <Loading size="sm" color="white" inline /> : <Check className="w-4 h-4 text-white" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Data</Label>
                            <Input type="date" value={editDate} max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setEditDate(e.target.value)}
                              className={`mt-1 h-9 text-sm w-full ${theme === "dark" ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-300"}`} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Quantidade</Label>
                              <Input type="number" min="0.01" step="0.01" value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className={`mt-1 h-9 text-sm ${theme === "dark" ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-300"}`} />
                            </div>
                            <div>
                              <Label className="text-xs">Preço (R$)</Label>
                              <Input type="number" min="0.01" step="0.01" value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className={`mt-1 h-9 text-sm ${theme === "dark" ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-300"}`} />
                            </div>
                          </div>
                          <div className="mt-3">
                            <Label className="text-xs">Corretora</Label>
                            <div className="relative mt-1">
                              <Landmark className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                              <Input type="text" placeholder="Ex: XP, Clear, Nubank..." value={editBroker}
                                onChange={(e) => setEditBroker(e.target.value)}
                                className={`pl-10 h-9 text-sm ${theme === "dark" ? "bg-zinc-700 border-zinc-600" : "bg-white border-zinc-300"}`} />
                            </div>
                          </div>
                          {editError && <p className="text-xs text-red-500 mt-2">{editError}</p>}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded ${isCompra ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                                {isCompra ? "Compra" : "Venda"}
                              </span>
                              <span className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                                {new Date(transaction.purchaseDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleStartEdit(transaction)} className={`p-1.5 rounded ${theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-zinc-200"}`} title="Editar">
                                <Pencil className="w-4 h-4 text-blue-400" />
                              </button>
                              <button onClick={() => handleOpenDeleteTransaction(transaction.id)} className={`p-1.5 rounded ${theme === "dark" ? "hover:bg-zinc-700" : "hover:bg-zinc-200"}`} title="Excluir">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Quantidade</p>
                              <p className="text-sm font-medium">{Math.abs(transaction.quantity)}</p>
                            </div>
                            <div>
                              <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Preço Unit.</p>
                              <p className="text-sm font-medium">{formatCurrency(transaction.purchasePrice)}</p>
                            </div>
                            <div>
                              <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>Total</p>
                              <p className={`text-sm font-medium ${isCompra ? "text-emerald-500" : "text-red-500"}`}>
                                {formatCurrency(Math.abs(transaction.quantity) * transaction.purchasePrice)}
                              </p>
                            </div>
                          </div>
                          {transaction.broker && (
                            <div className="mt-2 flex items-center gap-1">
                              <Landmark className={`w-3 h-3 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
                              <p className={`text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>{transaction.broker}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {transactions.length > 0 && (
              <div className={`mt-4 p-4 rounded-lg ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Total de transações: {transactions.length}</span>
                  <span className="text-sm font-medium">Qtd. Total: {Number(transactions.reduce((acc, t) => acc + Number(t.quantity), 0)).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOGS */}
      <AlertDialog open={deleteTransactionConfirmOpen} onOpenChange={setDeleteTransactionConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === "dark" ? "text-white" : "text-black"}>Excluir esta transação?</AlertDialogTitle>
            <AlertDialogDescription className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>
              Esta ação é irreversível. A transação será removida permanentemente do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200"}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} style={{ backgroundColor: "#dc2626" }} className="!text-white hover:opacity-90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === "dark" ? "text-white" : "text-black"}>Excluir ativo da carteira?</AlertDialogTitle>
            <AlertDialogDescription className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>
              <span className="block mb-2">Você está prestes a excluir <strong className={theme === "dark" ? "text-white" : "text-black"}>{ativoToDelete?.ativo.ticker}</strong> da sua carteira.</span>
              <span className="block p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                ⚠️ <strong>Atenção:</strong> Excluir um ativo é diferente de vender! Esta ação remove todas as transações do ativo do seu histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200"}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoverTransacoes} style={{ backgroundColor: "#640505" }} className="!text-white hover:opacity-90">Excluir mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFixedIncomeConfirmOpen} onOpenChange={setDeleteFixedIncomeConfirmOpen}>
        <AlertDialogContent className={theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === "dark" ? "text-white" : "text-black"}>Excluir investimento de renda fixa?</AlertDialogTitle>
            <AlertDialogDescription className={theme === "dark" ? "text-zinc-400" : "text-zinc-600"}>
              <span className="block mb-2">Você está prestes a excluir <strong className={theme === "dark" ? "text-white" : "text-black"}>{fixedIncomeToDelete?.name}</strong> da sua carteira.</span>
              <span className="block p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">⚠️ Esta ação é irreversível.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={theme === "dark" ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-black hover:bg-zinc-200"}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoverRendaFixa} style={{ backgroundColor: "#640505" }} className="!text-white hover:opacity-90">Excluir mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
