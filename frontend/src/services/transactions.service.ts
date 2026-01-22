import { api } from './api';

// Códigos de banco suportados pelo backend
export type SupportedBankCode = 
  | 'C6_CSV'           // C6 Bank - Fatura cartão CSV
  | 'INTER_OFX'        // Banco Inter - OFX
  | 'NUBANK_CSV'       // Nubank - CSV
  | 'GENERIC_OFX'      // Genérico OFX
  | 'AUTO';            // Detecção automática

export interface BankParserInfo {
  bankCode: string;
  bankName: string;
  supportedFormats: ('csv' | 'ofx')[];
  description: string;
}

export interface ImportSummary {
  total: number;
  income: number;
  expense: number;
  totalIncome: number;
  totalExpense: number;
}

export interface ImportPreviewResult {
  success: boolean;
  bankDetected: string;
  summary: ImportSummary;
  transactions: any[];
  totalTransactions: number;
  errors: string[];
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  bankDetected: string;
  totalProcessed: number;
  newlyImported: number;
  duplicatesSkipped: number;
  summary: ImportSummary;
  warnings: string[];
}

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

  /**
   * Lista bancos/formatos suportados para importação
   */
  async getSupportedBanks(): Promise<ApiResponse<BankParserInfo[]>> {
    return api.get<BankParserInfo[]>('/transactions/import/supported-banks');
  }

  /**
   * Preview da importação (não salva no banco)
   */
  async previewImport(file: File, bankCode: SupportedBankCode = 'AUTO'): Promise<ApiResponse<ImportPreviewResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankCode', bankCode);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/transactions/import/preview`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'Erro ao processar arquivo',
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro ao processar arquivo',
      };
    }
  }

  /**
   * Importa transações para uma conta
   */
  async importTransactions(
    file: File,
    accountId: string,
    bankCode: SupportedBankCode = 'AUTO',
  ): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('accountId', accountId);
    formData.append('bankCode', bankCode);

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

  /**
   * Atualiza a categoria de uma transação
   * Também salva a preferência do usuário para futuras transações similares
   */
  async updateCategory(transactionId: string, categoryId: string): Promise<ApiResponse<Transaction>> {
    const response = await api.patch<BackendTransaction>(`/transactions/${transactionId}/category`, {
      categoryId,
    });
    return {
      ...response,
      data: response.data ? normalizeTransaction(response.data) : undefined,
    };
  }

  // Método legado (deprecated) - usar importTransactions
  async uploadFile(
    file: File,
    payload: { accountId: string; bankCode: SupportedBankCode },
  ): Promise<ApiResponse<ImportResult>> {
    return this.importTransactions(file, payload.accountId, payload.bankCode);
  }
}

export const transactionsService = new TransactionsService();
