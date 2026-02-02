import { api } from './api';

// Ativo da tabela fixa (ações, FIIs cadastrados)
export interface Ativo {
  id: number;
  nome: string;
  ticker: string;
  tipo: string;
  categoria: string;
  precoAtual: number;
  dataCriacao?: string;
}

// Transação de investimento do usuário
export interface Investment {
  id: string;
  userId: string;
  ativoId: number;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  createdAt?: string;
  updatedAt?: string;
  ativo: Ativo;
}

// Item da carteira consolidada
export interface PortfolioItem {
  ativo: Ativo;
  totalQuantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  transactionCount: number;
}

// Resumo da carteira
export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercentage: number;
  assetCount: number;
}

// Resposta do endpoint de portfolio
export interface PortfolioResponse {
  items: PortfolioItem[];
  summary: PortfolioSummary;
}

export interface CreateInvestmentData {
  ativoId: number;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

export interface UpdateInvestmentData {
  ativoId?: number;
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: string;
}

// ========== RENDA FIXA ==========

export type FixedIncomeType = 
  | 'CDB'
  | 'LCI'
  | 'LCA'
  | 'TESOURO_SELIC'
  | 'TESOURO_PREFIXADO'
  | 'TESOURO_IPCA'
  | 'LC'
  | 'DEBENTURE'
  | 'CRI'
  | 'CRA'
  | 'POUPANCA';

export type IndexerType = 'CDI' | 'SELIC' | 'IPCA' | 'PREFIXADO' | 'POUPANCA';

export interface FixedIncomeTypeOption {
  value: FixedIncomeType;
  label: string;
  description: string;
}

export interface IndexerOption {
  value: IndexerType;
  label: string;
  rate: number | null;
}

export interface FixedIncomeInvestment {
  id: string;
  userId: string;
  name: string;
  type: FixedIncomeType;
  institution?: string;
  investedAmount: number;
  currentAmount?: number;
  interestRate: number;
  indexer: IndexerType;
  purchaseDate: string;
  maturityDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Campos calculados
  monthlyYield?: number;
  yearlyYield?: number;
  estimatedCurrentValue?: number;
  totalYield?: number;
  yieldPercentage?: number;
  daysInvested?: number;
  annualEffectiveRate?: number;
}

export interface FixedIncomePortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalYield: number;
  totalYieldPercentage: number;
  totalMonthlyYield: number;
  totalYearlyYield: number;
  assetCount: number;
}

export interface FixedIncomePortfolioResponse {
  items: FixedIncomeInvestment[];
  summary: FixedIncomePortfolioSummary;
  rates: {
    cdi: number;
    selic: number;
    ipca: number;
    poupanca: number;
  };
}

export interface CreateFixedIncomeData {
  name: string;
  type: FixedIncomeType;
  institution?: string;
  investedAmount: number;
  interestRate: number;
  indexer: IndexerType;
  purchaseDate: string;
  maturityDate?: string;
  notes?: string;
}

export interface UpdateFixedIncomeData {
  name?: string;
  type?: FixedIncomeType;
  institution?: string;
  investedAmount?: number;
  currentAmount?: number;
  interestRate?: number;
  indexer?: IndexerType;
  purchaseDate?: string;
  maturityDate?: string;
  isActive?: boolean;
  notes?: string;
}

class InvestmentsService {
  // ========== ATIVOS ==========
  
  async getAtivos(tipo?: string) {
    const endpoint = tipo ? `/investments/ativos?tipo=${encodeURIComponent(tipo)}` : '/investments/ativos';
    return api.get<Ativo[]>(endpoint);
  }

  async getAtivoById(id: number) {
    return api.get<Ativo>(`/investments/ativos/${id}`);
  }

  // ========== PORTFOLIO (carteira consolidada) ==========

  async getPortfolio() {
    return api.get<PortfolioResponse>('/investments/portfolio');
  }

  // ========== INVESTMENTS (transações) ==========

  async getAll() {
    return api.get<Investment[]>('/investments');
  }

  async getById(id: string) {
    return api.get<Investment>(`/investments/${id}`);
  }

  async create(data: CreateInvestmentData) {
    return api.post<Investment>('/investments', data);
  }

  async update(id: string, data: UpdateInvestmentData) {
    return api.put<Investment>(`/investments/${id}`, data);
  }

  async delete(id: string) {
    return api.delete(`/investments/${id}`);
  }

  // ========== RENDA FIXA ==========

  async getFixedIncomeTypes() {
    return api.get<FixedIncomeTypeOption[]>('/investments/fixed-income/types');
  }

  async getFixedIncomeIndexers() {
    return api.get<IndexerOption[]>('/investments/fixed-income/indexers');
  }

  async getFixedIncomePortfolio() {
    return api.get<FixedIncomePortfolioResponse>('/investments/fixed-income/portfolio');
  }

  async getAllFixedIncome(activeOnly: boolean = false) {
    const endpoint = activeOnly ? '/investments/fixed-income?active=true' : '/investments/fixed-income';
    return api.get<FixedIncomeInvestment[]>(endpoint);
  }

  async getFixedIncomeById(id: string) {
    return api.get<FixedIncomeInvestment>(`/investments/fixed-income/${id}`);
  }

  async createFixedIncome(data: CreateFixedIncomeData) {
    return api.post<FixedIncomeInvestment>('/investments/fixed-income', data);
  }

  async updateFixedIncome(id: string, data: UpdateFixedIncomeData) {
    return api.put<FixedIncomeInvestment>(`/investments/fixed-income/${id}`, data);
  }

  async deleteFixedIncome(id: string) {
    return api.delete(`/investments/fixed-income/${id}`);
  }
}

export const investmentsService = new InvestmentsService();
