import { transactionsService, Transaction } from './transactions.service';
import { investmentsService, PortfolioItem } from './investments.service';
import { accountsService, Account } from './accounts.service';
import { authService } from './auth.service';

export interface DashboardResumoMensal {
  receitas: number;
  gastos: number;
  investimentos: number;
}

export interface DashboardDespesaCategoria {
  categoria: string;
  valor: number;
  cor: string;
}

export interface DashboardAlocacaoAtivo {
  name: string;
  value: number;
  color: string;
}

export interface DashboardPatrimonioHistorico {
  month: string;
  value: number;
}

export interface DashboardData {
  userName: string;
  patrimonioTotal: number;
  variacaoMes: number;
  resumoMensal: DashboardResumoMensal;
  despesasPorCategoria: DashboardDespesaCategoria[];
  alocacaoAtivos: DashboardAlocacaoAtivo[];
  historicoPatrimonio: DashboardPatrimonioHistorico[];
}

// Cores para categorias de despesas
const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f59e0b',
  'Transporte': '#3b82f6',
  'Saúde': '#10b981',
  'Lazer': '#8b5cf6',
  'Assinaturas': '#ef4444',
  'Educação': '#06b6d4',
  'Moradia': '#ec4899',
  'Compras': '#f97316',
  'Serviços': '#6366f1',
  'Outros': '#71717a',
};

// Cores para tipos de ativos
const ASSET_TYPE_COLORS: Record<string, string> = {
  'Ação': '#10b981',
  'FII': '#3b82f6',
  'Renda Fixa': '#8b5cf6',
  'Criptomoeda': '#f59e0b',
  'ETF': '#ec4899',
  'BDR': '#06b6d4',
};

// Cores para tipos de conta
const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  'Conta Corrente': '#22c55e',
  'Outros Investimentos': '#a855f7',
};

// Nomes dos meses
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

class DashboardService {
  /**
   * Carrega todos os dados do dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    // Obter nome do usuário
    const user = authService.getUser();
    const userName = user?.fullName?.split(' ')[0] || 'Usuário';

    // Carregar dados em paralelo
    const [transactionsResult, portfolioResult, accountsResult] = await Promise.all([
      transactionsService.getAll(),
      investmentsService.getPortfolio(),
      accountsService.getAll(),
    ]);

    const transactions = transactionsResult.data || [];
    const portfolio = portfolioResult.data;
    const accounts = accountsResult.data || [];

    // DEBUG
    console.log('=== DEBUG DASHBOARD ===');
    console.log('Contas recebidas:', accounts.map(a => ({ 
      name: a.name, 
      type: a.type, 
      calculatedBalance: a.calculatedBalance 
    })));
    console.log('Portfolio:', portfolio?.summary);

    // Calcular saldo total das contas (exceto cartão de crédito que é dívida)
    const saldoContas = this.calcularSaldoContas(accounts);
    console.log('Saldo total das contas:', saldoContas);

    // Calcular valor dos investimentos
    const valorInvestimentos = portfolio?.summary?.totalValue || 0;
    console.log('Valor investimentos:', valorInvestimentos);

    // Calcular patrimônio total = saldo das contas + investimentos
    const patrimonioTotal = saldoContas + valorInvestimentos;
    console.log('Patrimônio total:', patrimonioTotal);
    console.log('=== FIM DEBUG ===');

    // Calcular variação do mês baseado nas transações
    const resumoMensal = this.calcularResumoMensal(transactions);
    const saldoMes = resumoMensal.receitas - resumoMensal.gastos;
    
    // Variação percentual do mês (baseado no saldo líquido vs patrimônio)
    const variacaoMes = patrimonioTotal > 0 
      ? (saldoMes / patrimonioTotal) * 100 
      : (portfolio?.summary?.profitLossPercentage || 0);

    // Calcular valor investido no mês (transações de investimento)
    const investimentosNoMes = this.calcularInvestimentosNoMes();

    // Calcular despesas por categoria
    const despesasPorCategoria = this.calcularDespesasPorCategoria(transactions);

    // Calcular alocação de ativos (incluindo contas)
    const alocacaoAtivos = this.calcularAlocacaoAtivosCompleta(portfolio?.items || [], accounts);

    // Gerar histórico de patrimônio (simulado baseado no valor atual)
    const historicoPatrimonio = this.gerarHistoricoPatrimonio(patrimonioTotal);

    return {
      userName,
      patrimonioTotal,
      variacaoMes,
      resumoMensal: {
        ...resumoMensal,
        investimentos: investimentosNoMes,
      },
      despesasPorCategoria,
      alocacaoAtivos,
      historicoPatrimonio,
    };
  }

  /**
   * Calcula receitas e gastos dos últimos 30 dias
   */
  private calcularResumoMensal(transactions: Transaction[]): { receitas: number; gastos: number; investimentos: number } {
    // Usar data local corretamente
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
    const trintaDiasAtras = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 30, 0, 0, 0, 0);

    let receitas = 0;
    let gastos = 0;

    transactions.forEach(t => {
      // Parse da data sem problemas de timezone (formato: YYYY-MM-DD)
      const datePart = t.date.includes('T') ? t.date.split('T')[0] : t.date;
      const [year, month, day] = datePart.split('-').map(Number);
      const dataTransacao = new Date(year, month - 1, day, 12, 0, 0);
      
      if (dataTransacao >= trintaDiasAtras && dataTransacao <= hoje) {
        if (t.type === 'income') {
          receitas += t.amount;
        } else {
          gastos += t.amount;
        }
      }
    });

    return { receitas, gastos, investimentos: 0 };
  }

  /**
   * Calcula o valor investido no mês atual
   * (Por enquanto retorna 0, pode ser expandido para buscar do backend)
   */
  private calcularInvestimentosNoMes(): number {
    // TODO: Implementar quando houver endpoint para buscar investimentos do mês
    return 0;
  }

  /**
   * Agrupa despesas por categoria
   */
  private calcularDespesasPorCategoria(transactions: Transaction[]): DashboardDespesaCategoria[] {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);
    trintaDiasAtras.setHours(0, 0, 0, 0);

    const categoriaMap = new Map<string, number>();

    transactions.forEach(t => {
      // Parse da data sem problemas de timezone (formato: YYYY-MM-DD)
      const [year, month, day] = t.date.split('T')[0].split('-').map(Number);
      const dataTransacao = new Date(year, month - 1, day, 12, 0, 0);
      
      if (dataTransacao >= trintaDiasAtras && dataTransacao <= hoje && t.type === 'expense') {
        const categoria = t.category?.name || 'Outros';
        const valorAtual = categoriaMap.get(categoria) || 0;
        categoriaMap.set(categoria, valorAtual + t.amount);
      }
    });

    // Converter para array e ordenar
    const despesas: DashboardDespesaCategoria[] = [];
    categoriaMap.forEach((valor, categoria) => {
      despesas.push({
        categoria,
        valor,
        cor: CATEGORY_COLORS[categoria] || CATEGORY_COLORS['Outros'],
      });
    });

    // Ordenar por valor (maior primeiro)
    return despesas.sort((a, b) => b.valor - a.valor);
  }

  /**
   * Calcula alocação de ativos por tipo
   */
  private calcularAlocacaoAtivos(portfolioItems: PortfolioItem[]): DashboardAlocacaoAtivo[] {
    const tipoMap = new Map<string, number>();

    portfolioItems.forEach(item => {
      const tipo = item.ativo?.tipo || 'Outros';
      const valorAtual = tipoMap.get(tipo) || 0;
      tipoMap.set(tipo, valorAtual + item.currentValue);
    });

    // Converter para array
    const alocacao: DashboardAlocacaoAtivo[] = [];
    tipoMap.forEach((value, name) => {
      alocacao.push({
        name,
        value,
        color: ASSET_TYPE_COLORS[name] || '#71717a',
      });
    });

    // Ordenar por valor (maior primeiro)
    return alocacao.sort((a, b) => b.value - a.value);
  }

  /**
   * Calcula saldo total das contas
   */
  private calcularSaldoContas(accounts: Account[]): number {
    let saldoTotal = 0;

    accounts.forEach(account => {
      const saldo = Number(account.calculatedBalance) || 0;
      
      // Cartão de crédito: saldo negativo representa dívida
      if (account.type === 'CARTAO_DE_CREDITO') {
        // Se o saldo do cartão for negativo, é uma dívida (subtrai do patrimônio)
        // Se for positivo (crédito disponível), não conta como patrimônio
        saldoTotal += saldo < 0 ? saldo : 0;
      } else {
        // Conta corrente e investimento: soma normalmente
        saldoTotal += saldo;
      }
    });

    return saldoTotal;
  }

  /**
   * Calcula alocação de ativos completa (investimentos + contas)
   */
  private calcularAlocacaoAtivosCompleta(
    portfolioItems: PortfolioItem[], 
    accounts: Account[]
  ): DashboardAlocacaoAtivo[] {
    const tipoMap = new Map<string, number>();

    // Adicionar investimentos por tipo
    portfolioItems.forEach(item => {
      const tipo = item.ativo?.tipo || 'Outros';
      const valorAtual = tipoMap.get(tipo) || 0;
      tipoMap.set(tipo, valorAtual + item.currentValue);
    });

    // Adicionar saldo das contas
    accounts.forEach(account => {
      const saldo = Number(account.calculatedBalance) || 0;
      
      if (account.type === 'CONTA_CORRENTE' && saldo > 0) {
        const valorAtual = tipoMap.get('Conta Corrente') || 0;
        tipoMap.set('Conta Corrente', valorAtual + saldo);
      } else if (account.type === 'INVESTIMENTO' && saldo > 0) {
        // Contas de investimento que não estão detalhadas no portfolio
        const valorAtual = tipoMap.get('Outros Investimentos') || 0;
        tipoMap.set('Outros Investimentos', valorAtual + saldo);
      }
      // Cartão de crédito com saldo negativo não entra na alocação positiva
    });

    // Converter para array
    const alocacao: DashboardAlocacaoAtivo[] = [];
    tipoMap.forEach((value, name) => {
      if (value > 0) {
        alocacao.push({
          name,
          value,
          color: ASSET_TYPE_COLORS[name] || ACCOUNT_TYPE_COLORS[name] || '#71717a',
        });
      }
    });

    // Ordenar por valor (maior primeiro)
    return alocacao.sort((a, b) => b.value - a.value);
  }

  /**
   * Gera histórico de patrimônio (últimos 6 meses)
   * Por enquanto simulado, pode ser integrado com backend futuramente
   */
  private gerarHistoricoPatrimonio(patrimonioAtual: number): DashboardPatrimonioHistorico[] {
    const hoje = new Date();
    const historico: DashboardPatrimonioHistorico[] = [];

    // Gerar 6 meses de histórico com variação simulada
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje);
      data.setMonth(data.getMonth() - i);
      
      // Variação simulada (entre -5% e +10% do valor atual por mês)
      const fatorVariacao = 1 - (i * 0.03) + (Math.random() * 0.05 - 0.025);
      const valor = i === 0 ? patrimonioAtual : patrimonioAtual * fatorVariacao;

      historico.push({
        month: MONTH_NAMES[data.getMonth()],
        value: Math.max(0, Math.round(valor * 100) / 100),
      });
    }

    return historico;
  }
}

export const dashboardService = new DashboardService();
