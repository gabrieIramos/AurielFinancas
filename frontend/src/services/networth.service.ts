import { api } from './api';

export interface NetWorthData {
  date: string;
  value: number;
  change: number;
  changePercentage: number;
}

export interface NetWorthHistory {
  current: number;
  history: NetWorthData[];
}

class NetWorthService {
  async getCurrent() {
    // Calcular a partir dos investimentos disponíveis
    try {
      const investmentsResponse = await api.get<any[]>('/investments');
      if (investmentsResponse.data && Array.isArray(investmentsResponse.data)) {
        const totalValue = investmentsResponse.data.reduce((acc, inv) => acc + (inv.totalValue || 0), 0);
        return {
          data: {
            value: totalValue,
            change: 0,
            changePercentage: 0,
          },
        };
      }
    } catch (e) {
      // silently fail
    }

    return {
      data: {
        value: 0,
        change: 0,
        changePercentage: 0,
      },
    };
  }

  async getHistory(months: number = 6) {
    // Retorna histórico vazio (backend não implementa esse endpoint)
    // Em produção, seria calculado a partir de snapshots históricos
    return {
      data: {
        current: 0,
        history: [],
      },
    };
  }
}

export const netWorthService = new NetWorthService();
