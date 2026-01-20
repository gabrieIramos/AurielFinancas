import { api } from './api';
import { transactionsService } from './transactions.service';
import { investmentsService } from './investments.service';
import { categoriesService } from './categories.service';

// Constantes para cache
const INSIGHTS_CACHE_KEY = 'ai_insights_cache';
const INSIGHTS_CACHE_TTL = 48 * 60 * 60 * 1000; // 48 horas em milissegundos

interface InsightsCache {
  insights: AIInitialInsights;
  timestamp: number;
}

export interface AIInsight {
  id: string;
  tipo: 'alerta' | 'oportunidade' | 'info';
  titulo: string;
  descricao: string;
  valor?: string;
}

export interface AIRiskAnalysis {
  id: string;
  nivel: 'baixo' | 'medio' | 'alto';
  titulo: string;
  descricao: string;
}

export interface AIInitialInsights {
  alertas: AIInsight[];
  analiseRisco: AIRiskAnalysis[];
  sugestoes: AIInsight[];
}

export interface FinancialKPIs {
  // Transações
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  topExpenseCategories: { name: string; amount: number; percentage: number }[];
  
  // Investimentos
  portfolioValue: number;
  portfolioProfitLoss: number;
  portfolioProfitLossPercentage: number;
  portfolioDistribution: { tipo: string; value: number; percentage: number }[];
  
  // Ativos detalhados
  assets: {
    ticker: string;
    nome: string;
    tipo: string;
    quantidade: number;
    precoMedio: number;
    precoAtual: number;
    valorTotal: number;
    lucroPerda: number;
    lucroPerdaPercentual: number;
  }[];
  totalAssets: number;
  
  // Período
  periodStart: string;
  periodEnd: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
}

class AIService {
  /**
   * Coleta KPIs financeiras do usuário para enviar à IA
   */
  async collectKPIs(): Promise<FinancialKPIs> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const periodStart = thirtyDaysAgo.toISOString().split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    // Buscar dados em paralelo
    const [transactionsRes, portfolioRes, categoriesRes] = await Promise.all([
      transactionsService.getAll(),
      investmentsService.getPortfolio(),
      categoriesService.getAll(),
    ]);

    const transactions = transactionsRes.data || [];
    const portfolio = portfolioRes.data || { items: [], summary: { totalValue: 0, profitLoss: 0, profitLossPercentage: 0 } };
    const categories = categoriesRes.data || [];

    console.log('[AI KPIs] Total transações carregadas:', transactions.length);
    console.log('[AI KPIs] Período:', periodStart, 'até', periodEnd);

    // Se não houver transações nos últimos 30 dias, usar todas as transações disponíveis
    let recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= thirtyDaysAgo && transactionDate <= now;
    });

    // Se não houver transações recentes, usar todas
    if (recentTransactions.length === 0 && transactions.length > 0) {
      console.log('[AI KPIs] Sem transações nos últimos 30 dias, usando todas as transações');
      recentTransactions = transactions;
    }

    console.log('[AI KPIs] Transações filtradas:', recentTransactions.length);

    // Calcular KPIs de transações
    let totalIncome = 0;
    let totalExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    recentTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        const categoryName = t.category?.name || 'Sem categoria';
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + t.amount;
      }
    });

    console.log('[AI KPIs] Total Income:', totalIncome);
    console.log('[AI KPIs] Total Expenses:', totalExpenses);
    console.log('[AI KPIs] Portfolio Value:', portfolio.summary?.totalValue);

    // Top categorias de gastos
    const topExpenseCategories = Object.entries(expensesByCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Distribuição do portfólio por tipo
    const portfolioByType: Record<string, number> = {};
    portfolio.items.forEach(item => {
      const tipo = item.ativo.tipo;
      portfolioByType[tipo] = (portfolioByType[tipo] || 0) + item.currentValue;
    });

    const portfolioDistribution = Object.entries(portfolioByType)
      .map(([tipo, value]) => ({
        tipo,
        value,
        percentage: portfolio.summary.totalValue > 0 ? (value / portfolio.summary.totalValue) * 100 : 0,
      }));

    // Mapear ativos detalhados
    const assets = portfolio.items.map(item => ({
      ticker: item.ativo.ticker,
      nome: item.ativo.nome,
      tipo: item.ativo.tipo,
      quantidade: item.totalQuantity,
      precoMedio: item.averagePrice,
      precoAtual: item.currentPrice,
      valorTotal: item.currentValue,
      lucroPerda: item.profitLoss,
      lucroPerdaPercentual: item.profitLossPercentage,
    }));

    console.log('[AI KPIs] Ativos:', assets.length);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: recentTransactions.length,
      topExpenseCategories,
      portfolioValue: portfolio.summary.totalValue,
      portfolioProfitLoss: portfolio.summary.profitLoss,
      portfolioProfitLossPercentage: portfolio.summary.profitLossPercentage,
      portfolioDistribution,
      assets,
      totalAssets: portfolio.summary.assetCount || assets.length,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Envia mensagem para o chat com IA incluindo KPIs
   */
  async chat(message: string, kpis: FinancialKPIs, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/ai/chat', {
        message,
        kpis,
        conversationHistory: conversationHistory.slice(-5), // Limitar a 5 mensagens
      });
      return response.data || { response: 'Desculpe, não consegui processar sua mensagem.' };
    } catch (error) {
      console.error('Erro no chat:', error);
      return { response: 'Desculpe, ocorreu um erro ao processar sua mensagem.' };
    }
  }

  /**
   * Gera insights iniciais baseados nas KPIs (com cache de 48h)
   */
  async generateInitialInsights(kpis: FinancialKPIs): Promise<AIInitialInsights> {
    // Verificar se existe cache válido
    const cachedInsights = this.getCachedInsights();
    if (cachedInsights) {
      console.log('[AI Insights] Usando cache local (válido por mais', this.getRemainingCacheTime(), ')');
      return cachedInsights;
    }

    console.log('[AI Insights] Cache expirado ou inexistente, gerando novos insights via IA...');

    try {
      const response = await api.post<AIInitialInsights>('/ai/insights', { kpis });
      if (response.data) {
        // Salvar no cache
        this.saveInsightsToCache(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    }
    
    // Fallback: gerar insights localmente baseados nas KPIs
    const localInsights = this.generateLocalInsights(kpis);
    this.saveInsightsToCache(localInsights);
    return localInsights;
  }

  /**
   * Obtém insights do cache se ainda estiverem válidos
   */
  private getCachedInsights(): AIInitialInsights | null {
    try {
      const cached = localStorage.getItem(INSIGHTS_CACHE_KEY);
      if (!cached) return null;

      const { insights, timestamp }: InsightsCache = JSON.parse(cached);
      const now = Date.now();

      // Verificar se o cache ainda é válido (48h)
      if (now - timestamp < INSIGHTS_CACHE_TTL) {
        return insights;
      }

      // Cache expirado, remover
      localStorage.removeItem(INSIGHTS_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Erro ao ler cache de insights:', error);
      localStorage.removeItem(INSIGHTS_CACHE_KEY);
      return null;
    }
  }

  /**
   * Salva insights no cache local
   */
  private saveInsightsToCache(insights: AIInitialInsights): void {
    try {
      const cache: InsightsCache = {
        insights,
        timestamp: Date.now(),
      };
      localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cache));
      console.log('[AI Insights] Cache salvo, válido por 48h');
    } catch (error) {
      console.error('Erro ao salvar cache de insights:', error);
    }
  }

  /**
   * Retorna tempo restante do cache formatado
   */
  private getRemainingCacheTime(): string {
    try {
      const cached = localStorage.getItem(INSIGHTS_CACHE_KEY);
      if (!cached) return '0h';

      const { timestamp }: InsightsCache = JSON.parse(cached);
      const remaining = INSIGHTS_CACHE_TTL - (Date.now() - timestamp);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return `${hours}h ${minutes}min`;
    } catch {
      return '0h';
    }
  }

  /**
   * Força a regeneração dos insights (limpa cache)
   */
  clearInsightsCache(): void {
    localStorage.removeItem(INSIGHTS_CACHE_KEY);
    console.log('[AI Insights] Cache limpo');
  }

  /**
   * Gera insights localmente quando o backend não está disponível
   */
  private generateLocalInsights(kpis: FinancialKPIs): AIInitialInsights {
    const alertas: AIInsight[] = [];
    const analiseRisco: AIRiskAnalysis[] = [];
    const sugestoes: AIInsight[] = [];

    // Alertas baseados em gastos
    if (kpis.topExpenseCategories.length > 0) {
      const topCategory = kpis.topExpenseCategories[0];
      if (topCategory.percentage > 30) {
        alertas.push({
          id: '1',
          tipo: 'alerta',
          titulo: `Gastos com ${topCategory.name} Acima da Média`,
          descricao: `${topCategory.percentage.toFixed(0)}% dos seus gastos estão concentrados em ${topCategory.name}. Considere revisar esses gastos.`,
          valor: `R$ ${topCategory.amount.toFixed(2)}`,
        });
      }
    }

    // Oportunidade de economia
    if (kpis.totalExpenses > kpis.totalIncome * 0.7) {
      const potencialEconomia = kpis.totalExpenses * 0.1;
      alertas.push({
        id: '2',
        tipo: 'oportunidade',
        titulo: 'Oportunidade de Economia',
        descricao: 'Seus gastos representam mais de 70% da sua renda. Reduzindo 10% das despesas, você poderia economizar significativamente.',
        valor: `R$ ${potencialEconomia.toFixed(2)}`,
      });
    }

    // Saldo negativo
    if (kpis.balance < 0) {
      alertas.push({
        id: '3',
        tipo: 'alerta',
        titulo: 'Saldo Negativo no Período',
        descricao: `Você gastou mais do que recebeu nos últimos 30 dias. Déficit de R$ ${Math.abs(kpis.balance).toFixed(2)}.`,
      });
    }

    // Análise de risco da carteira
    if (kpis.portfolioValue > 0) {
      if (kpis.portfolioDistribution.length === 1) {
        analiseRisco.push({
          id: '1',
          nivel: 'medio',
          titulo: 'Concentração em um Tipo de Ativo',
          descricao: `100% da sua carteira está em ${kpis.portfolioDistribution[0].tipo}. Considere diversificar entre diferentes tipos de ativos.`,
        });
      } else if (kpis.portfolioDistribution.length > 1) {
        analiseRisco.push({
          id: '2',
          nivel: 'baixo',
          titulo: 'Boa Diversificação entre Ativos',
          descricao: 'Sua carteira está diversificada entre diferentes tipos de ativos, o que ajuda a reduzir riscos.',
        });
      }

      // Verificar concentração em setores
      const maiorConcentracao = kpis.portfolioDistribution.find(d => d.percentage > 70);
      if (maiorConcentracao) {
        analiseRisco.push({
          id: '3',
          nivel: 'medio',
          titulo: `Alta Concentração em ${maiorConcentracao.tipo}`,
          descricao: `${maiorConcentracao.percentage.toFixed(0)}% da sua carteira está em ${maiorConcentracao.tipo}. Considere rebalancear.`,
        });
      }
    } else {
      analiseRisco.push({
        id: '4',
        nivel: 'medio',
        titulo: 'Sem Investimentos Registrados',
        descricao: 'Você ainda não possui investimentos na carteira. Considere começar a investir para construir patrimônio.',
      });
    }

    // Sugestões personalizadas
    if (kpis.balance > 0) {
      sugestoes.push({
        id: '1',
        tipo: 'info',
        titulo: 'Invista seu Saldo Positivo',
        descricao: `Você teve um saldo positivo de R$ ${kpis.balance.toFixed(2)}. Considere investir parte desse valor.`,
        valor: `R$ ${kpis.balance.toFixed(2)}`,
      });
    }

    if (kpis.portfolioValue > 0 && kpis.portfolioProfitLoss > 0) {
      sugestoes.push({
        id: '2',
        tipo: 'oportunidade',
        titulo: 'Reinvista seus Ganhos',
        descricao: 'Seus investimentos estão com rendimento positivo. Considere reinvestir os ganhos para potencializar seus resultados.',
        valor: `+R$ ${kpis.portfolioProfitLoss.toFixed(2)}`,
      });
    }

    if (kpis.topExpenseCategories.length > 0) {
      sugestoes.push({
        id: '3',
        tipo: 'info',
        titulo: 'Monitore seus Maiores Gastos',
        descricao: `Monitore seus gastos com ${kpis.topExpenseCategories[0].name}, que representa sua maior categoria de despesas.`,
      });
    }

    if (kpis.transactionCount < 10) {
      sugestoes.push({
        id: '4',
        tipo: 'info',
        titulo: 'Registre mais Transações',
        descricao: 'Registre mais transações para ter uma análise mais precisa dos seus hábitos financeiros.',
      });
    } else {
      sugestoes.push({
        id: '5',
        tipo: 'info',
        titulo: 'Continue Assim!',
        descricao: 'Continue mantendo suas finanças organizadas. A consistência é a chave para o sucesso financeiro.',
      });
    }

    return { alertas, analiseRisco, sugestoes };
  }
}

export const aiService = new AIService();
