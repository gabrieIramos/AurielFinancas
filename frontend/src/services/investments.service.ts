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
}

export const investmentsService = new InvestmentsService();
