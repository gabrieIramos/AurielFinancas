import { transactionsService, Transaction } from './transactions.service';
import { investmentsService, PortfolioItem, FixedIncomePortfolioResponse } from './investments.service';
import { accountsService, Account } from './accounts.service';
import { netWorthService, NetWorthHistoryResponse } from './networth.service';

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
  hasPatrimonioHistory: boolean; // true se tem histórico real, false se é usuário novo
}

// Cores para categorias de despesas - 16 categorias com cores distintas
const CATEGORY_COLORS: Record<string, string> = {
  'Saúde': '#10b981',           // Verde esmeralda
  'Assinatura': '#8b5cf6',      // Roxo
  'Educação': '#3b82f6',        // Azul
  'Transferências': '#6b7280',  // Cinza
  'Alimentação': '#f59e0b',     // Âmbar/Laranja
  'Impostos': '#dc2626',        // Vermelho
  'Outras': '#71717a',          // Cinza escuro
  'Pets': '#f472b6',            // Rosa
  'Mercado': '#84cc16',         // Lima/Verde claro
  'Lazer': '#a855f7',           // Violeta
  'Presentes': '#ec4899',       // Pink
  'Viagens': '#14b8a6',         // Teal/Turquesa
  'Compras': '#f97316',         // Laranja intenso
  'Seguros': '#0ea5e9',         // Azul céu
  'Contas e Serviços': '#6366f1', // Indigo
  'Transporte': '#eab308',      // Amarelo
  // Mantém compatibilidade com nomes antigos
  'Assinaturas': '#8b5cf6',
  'Moradia': '#06b6d4',
  'Serviços': '#6366f1',
  'Outros': '#71717a',
};

// Cores para tipos de ativos
const ASSET_TYPE_COLORS: Record<string, string> = {
  'Ação': '#10b981',
  'FII': '#3b82f6',
  'Criptomoeda': '#f59e0b',
  'ETF': '#ec4899',
  'BDR': '#06b6d4',
  // Tipos de Renda Fixa
  'CDB': '#8b5cf6',
  'LCI': '#a855f7',
  'LCA': '#7c3aed',
  'Tesouro Selic': '#6366f1',
  'Tesouro Prefixado': '#4f46e5',
  'Tesouro IPCA+': '#4338ca',
  'LC': '#c084fc',
  'Debênture': '#9333ea',
  'CRI': '#7e22ce',
  'CRA': '#6b21a8',
  'Poupança': '#d946ef',
};

// Cores para tipos de conta
const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  'Conta Corrente': '#22c55e',
  'Outros Investimentos': '#a855f7',
};

class DashboardService {
  /**
   * Carrega todos os dados do dashboard
   */
  async getDashboardData(userName?: string): Promise<DashboardData> {
    const displayName = userName?.split(' ')[0] || 'Usuário';

    // Carregar dados em paralelo (incluindo histórico de patrimônio)
    const [transactionsResult, portfolioResult, fixedIncomeResult, accountsResult, netWorthResult] = await Promise.all([
      transactionsService.getAll(),
      investmentsService.getPortfolio(),
      investmentsService.getFixedIncomePortfolio(),
      accountsService.getAll(),
      netWorthService.getHistory(12),
    ]);

    const transactions = transactionsResult.data || [];
    const portfolio = portfolioResult.data;
    const fixedIncomePortfolio = fixedIncomeResult.data;
    const accounts = accountsResult.data || [];
    const netWorthData = netWorthResult.data;

    // DEBUG
    console.log('=== DEBUG DASHBOARD ===');
    console.log('Contas recebidas:', accounts.map(a => ({ 
      name: a.name, 
      type: a.type, 
      calculatedBalance: a.calculatedBalance 
    })));
    console.log('Portfolio:', portfolio?.summary);
    console.log('Net Worth History:', netWorthData);

    // Usar patrimônio do snapshot atual (mais preciso)
    const patrimonioTotal = netWorthData?.currentSnapshot?.netWorth || 0;
    console.log('Patrimônio total:', patrimonioTotal);
    console.log('=== FIM DEBUG ===');

    // Calcular variação do mês baseado nas transações
    const resumoMensal = this.calcularResumoMensal(transactions);
    const saldoMes = resumoMensal.receitas - resumoMensal.gastos;
    
    // Rendimento da renda fixa no mês
    const rendimentoRendaFixaMes = fixedIncomePortfolio?.summary?.totalMonthlyYield || 0;
    
    // Calcular variação percentual baseada no histórico real
    let variacaoMes = 0;
    if (netWorthData?.hasHistory && netWorthData.history.length > 0) {
      // Pegar último registro do histórico para comparar
      const lastHistoryItem = netWorthData.history[netWorthData.history.length - 1];
      const lastNetWorth = Number(lastHistoryItem.netWorth) || 0;
      if (lastNetWorth > 0) {
        variacaoMes = ((patrimonioTotal - lastNetWorth) / lastNetWorth) * 100;
      }
    } else if (patrimonioTotal > 0) {
      // Usuário novo: variação baseada no saldo do mês
      const variacaoAbsoluta = saldoMes + rendimentoRendaFixaMes;
      variacaoMes = (variacaoAbsoluta / patrimonioTotal) * 100;
    }

    // Calcular valor investido no mês (transações de investimento)
    const investimentosNoMes = this.calcularInvestimentosNoMes();

    // Calcular despesas por categoria
    const despesasPorCategoria = this.calcularDespesasPorCategoria(transactions);

    // Calcular alocação de ativos (incluindo contas e renda fixa)
    const alocacaoAtivos = this.calcularAlocacaoAtivosCompleta(
      portfolio?.items || [], 
      accounts,
      fixedIncomePortfolio
    );

    // Gerar histórico de patrimônio (real ou apenas mês atual)
    const historicoPatrimonio = this.processarHistoricoPatrimonio(netWorthData, patrimonioTotal);

    return {
      userName: displayName,
      patrimonioTotal,
      variacaoMes,
      resumoMensal: {
        ...resumoMensal,
        investimentos: investimentosNoMes,
      },
      despesasPorCategoria,
      alocacaoAtivos,
      historicoPatrimonio,
      hasPatrimonioHistory: netWorthData?.hasHistory || false,
    };
  }

  /**
   * Processa histórico de patrimônio - usa dados reais ou apenas mês atual
   */
  private processarHistoricoPatrimonio(
    netWorthData: NetWorthHistoryResponse | undefined,
    patrimonioAtual: number
  ): DashboardPatrimonioHistorico[] {
    const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    
    // Se tem histórico real, usar
    if (netWorthData?.hasHistory && netWorthData.history.length > 0) {
      const historico = netWorthData.history.map(item => {
        const date = new Date(item.snapshotDate);
        return {
          month: MONTH_NAMES[date.getMonth()],
          value: Number(item.netWorth) || 0,
        };
      });

      // Adicionar mês atual se ainda não está no histórico
      const currentMonth = MONTH_NAMES[hoje.getMonth()];
      const lastItem = historico[historico.length - 1];
      if (lastItem?.month !== currentMonth) {
        historico.push({
          month: currentMonth,
          value: patrimonioAtual,
        });
      } else {
        // Atualizar valor do mês atual
        lastItem.value = patrimonioAtual;
      }

      return historico;
    }

    // Usuário novo: mostrar apenas o mês atual
    return [{
      month: MONTH_NAMES[hoje.getMonth()],
      value: patrimonioAtual,
    }];
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
   * Calcula alocação de ativos completa (investimentos + contas + renda fixa)
   */
  private calcularAlocacaoAtivosCompleta(
    portfolioItems: PortfolioItem[], 
    accounts: Account[],
    fixedIncomePortfolio?: FixedIncomePortfolioResponse | null
  ): DashboardAlocacaoAtivo[] {
    const tipoMap = new Map<string, number>();

    // Adicionar investimentos de renda variável por tipo
    portfolioItems.forEach(item => {
      const tipo = item.ativo?.tipo || 'Outros';
      const valorAtual = tipoMap.get(tipo) || 0;
      tipoMap.set(tipo, valorAtual + item.currentValue);
    });

    // Adicionar investimentos de renda fixa POR TIPO (CDB, Tesouro, etc)
    if (fixedIncomePortfolio?.items && fixedIncomePortfolio.items.length > 0) {
      fixedIncomePortfolio.items.forEach(item => {
        // Mapear o tipo do banco para nome amigável
        const tipoAmigavel = this.mapearTipoRendaFixa(item.type);
        const valorAtual = tipoMap.get(tipoAmigavel) || 0;
        tipoMap.set(tipoAmigavel, valorAtual + (item.estimatedCurrentValue || item.currentAmount || item.investedAmount));
      });
    }

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
   * Mapeia o tipo de renda fixa do banco para nome amigável
   */
  private mapearTipoRendaFixa(tipo: string): string {
    const mapeamento: Record<string, string> = {
      'CDB': 'CDB',
      'LCI': 'LCI',
      'LCA': 'LCA',
      'TESOURO_SELIC': 'Tesouro Selic',
      'TESOURO_PREFIXADO': 'Tesouro Prefixado',
      'TESOURO_IPCA': 'Tesouro IPCA+',
      'LC': 'LC',
      'DEBENTURE': 'Debênture',
      'CRI': 'CRI',
      'CRA': 'CRA',
      'POUPANCA': 'Poupança',
    };
    return mapeamento[tipo] || tipo;
  }
}

export const dashboardService = new DashboardService();
