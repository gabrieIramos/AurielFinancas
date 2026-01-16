import { api } from './api';

export type BankType = 'C6' | 'INTER' | 'NUBANK';

type ApiResponse<T> = { data?: T; error?: string };

export interface BackendTransaction {
  id: string;
  descriptionRaw: string;
  descriptionClean?: string;
  amount: number;
  date: string;
  categoryId?: string;
  accountId?: string;
  needsReview?: boolean;
  categoryConfidence?: number | null;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  account?: {
    id: string;
    name: string;
  };
}

export interface Transaction {
  id: string;
  description: string;
  descriptionRaw?: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  categoryId?: string;
  accountId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  account?: {
    id: string;
    name: string;
  };
  needsReview?: boolean;
  categoryConfidence?: number | null;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  categoryId?: string;
  accountId?: string;
}

const normalizeTransaction = (transaction: BackendTransaction): Transaction => {
  const amountNumber = Number(transaction.amount) || 0;
  const description = transaction.descriptionClean || transaction.descriptionRaw || 'Sem descrição';
  const type: 'income' | 'expense' = amountNumber >= 0 ? 'income' : 'expense';

  return {
    id: transaction.id,
    description,
    descriptionRaw: transaction.descriptionRaw,
    amount: Math.abs(amountNumber),
    type,
    date: transaction.date,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    category: transaction.category
      ? {
          id: transaction.category.id,
          name: transaction.category.name,
          color: transaction.category.color,
        }
      : undefined,
    account: transaction.account
      ? {
          id: transaction.account.id,
          name: transaction.account.name,
        }
      : undefined,
    needsReview: transaction.needsReview,
    categoryConfidence: transaction.categoryConfidence ?? null,
  };
};

class TransactionsService {
  async getAll(): Promise<ApiResponse<Transaction[]>> {
    const response = await api.get<BackendTransaction[]>('/transactions');
    return {
      ...response,
      data: response.data ? response.data.map(normalizeTransaction) : undefined,
    };
  }

  async getById(id: string): Promise<ApiResponse<Transaction>> {
    const response = await api.get<BackendTransaction>(`/transactions/${id}`);
    return {
      ...response,
      data: response.data ? normalizeTransaction(response.data) : undefined,
    };
  }

  async create(data: CreateTransactionData): Promise<ApiResponse<Transaction>> {
    const response = await api.post<BackendTransaction>('/transactions', data);
    return {
      ...response,
      data: response.data ? normalizeTransaction(response.data) : undefined,
    };
  }

  async update(id: string, data: Partial<CreateTransactionData>): Promise<ApiResponse<Transaction>> {
    const response = await api.put<BackendTransaction>(`/transactions/${id}`, data);
    return {
      ...response,
      data: response.data ? normalizeTransaction(response.data) : undefined,
    };
  }

  async delete(id: string) {
    return api.delete(`/transactions/${id}`);
  }

  async getByPeriod(startDate: string, endDate: string): Promise<ApiResponse<Transaction[]>> {
    const response = await api.get<BackendTransaction[]>(`/transactions?startDate=${startDate}&endDate=${endDate}`);
    return {
      ...response,
      data: response.data ? response.data.map(normalizeTransaction) : undefined,
    };
  }

  async uploadFile(
    file: File,
    payload: { accountId: string; bankType: BankType; userId: string },
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', payload.accountId);
    formData.append('bankType', payload.bankType);
    formData.append('userId', payload.userId);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/transactions/import`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'Erro ao importar arquivo',
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro ao importar arquivo',
      };
    }
  }
}

export const transactionsService = new TransactionsService();
