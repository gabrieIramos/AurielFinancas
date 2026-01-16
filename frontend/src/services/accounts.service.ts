import { api } from './api';

export type AccountType = 'CONTA_CORRENTE' | 'CARTAO_DE_CREDITO' | 'INVESTIMENTO';

type ApiResponse<T> = { data?: T; error?: string };

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institutionId?: string | null;
  currentBalance?: number;
}

class AccountsService {
  async getAll(): Promise<ApiResponse<Account[]>> {
    return api.get<Account[]>('/accounts');
  }

  async getById(id: string): Promise<ApiResponse<Account>> {
    return api.get<Account>(`/accounts/${id}`);
  }
}

export const accountsService = new AccountsService();
