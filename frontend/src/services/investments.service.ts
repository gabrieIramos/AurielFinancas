import { api } from './api';

export interface Investment {
  id: number;
  name: string;
  ticker: string;
  type: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface CreateInvestmentData {
  name: string;
  ticker: string;
  type: string;
  quantity: number;
  averagePrice: number;
}

class InvestmentsService {
  async getAll() {
    return api.get<Investment[]>('/investments');
  }

  async getById(id: number) {
    return api.get<Investment>(`/investments/${id}`);
  }

  async create(data: CreateInvestmentData) {
    return api.post<Investment>('/investments', data);
  }

  async update(id: number, data: Partial<CreateInvestmentData>) {
    return api.put<Investment>(`/investments/${id}`, data);
  }

  async delete(id: number) {
    return api.delete(`/investments/${id}`);
  }

  async getPortfolioSummary() {
    // Calcular do endpoint /investments que funciona
    try {
      const allInvestments = await this.getAll();
      if (allInvestments.data && Array.isArray(allInvestments.data)) {
        const summary = {
          total: allInvestments.data.reduce((acc, inv) => acc + inv.totalValue, 0),
          profitLoss: allInvestments.data.reduce((acc, inv) => acc + inv.profitLoss, 0),
          count: allInvestments.data.length,
          allocation: this.calculateAllocation(allInvestments.data),
        };
        return { data: summary };
      }
    } catch (e) {
      // silently fail
    }

    return { data: { total: 0, profitLoss: 0, count: 0, allocation: [] } };
  }

  private calculateAllocation(investments: Investment[]) {
    // Agrupar investimentos por tipo
    const byType: Record<string, number> = {};
    
    investments.forEach(inv => {
      byType[inv.type] = (byType[inv.type] || 0) + inv.totalValue;
    });

    return Object.entries(byType).map(([type, total]) => ({
      type,
      total,
    }));
  }
}

export const investmentsService = new InvestmentsService();
