import { api } from './api';

export interface NetWorthBreakdown {
  accounts: number;
  variableIncome: number;
  fixedIncome: number;
  creditCardDebt: number;
}

export interface NetWorthSnapshot {
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown?: NetWorthBreakdown;
}

export interface NetWorthHistoryItem {
  id: string;
  userId: string;
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export interface NetWorthHistoryResponse {
  history: NetWorthHistoryItem[];
  currentSnapshot: NetWorthSnapshot;
  hasHistory: boolean;
}

class NetWorthService {
  /**
   * Busca histórico de patrimônio com snapshot atual
   */
  async getHistory(limit: number = 12) {
    return api.get<NetWorthHistoryResponse>(`/net-worth/history?limit=${limit}`);
  }

  /**
   * Busca apenas o snapshot atual (calculado em tempo real)
   */
  async getCurrentSnapshot() {
    return api.get<NetWorthSnapshot>('/net-worth/current');
  }

  /**
   * Salva o snapshot do mês atual
   */
  async saveSnapshot() {
    return api.post<NetWorthHistoryItem>('/net-worth/snapshot');
  }
}

export const netWorthService = new NetWorthService();
