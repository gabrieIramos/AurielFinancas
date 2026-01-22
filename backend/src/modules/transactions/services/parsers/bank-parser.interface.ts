/**
 * Interface base para parsers de banco
 * Cada banco deve implementar esta interface
 */

export interface ParsedTransaction {
  date: string;           // Formato: YYYY-MM-DD
  description: string;    // Descrição original da transação
  amount: number;         // Valor absoluto (sempre positivo)
  type: 'income' | 'expense';
  fitid?: string;         // ID único da transação (OFX)
  additionalInfo?: Record<string, unknown>;  // Info extra (parcela, cartão, etc)
}

export interface ImportResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  warnings: string[];
}

export interface BankParserInfo {
  bankCode: string;       // Ex: 'C6', 'INTER', 'NUBANK'
  bankName: string;       // Ex: 'C6 Bank', 'Banco Inter'
  supportedFormats: ('csv' | 'ofx')[];
  description: string;
}

export interface IBankParser {
  /**
   * Informações sobre o parser
   */
  getInfo(): BankParserInfo;

  /**
   * Verifica se o parser suporta o formato do arquivo
   */
  supports(filename: string, content: string): boolean;

  /**
   * Faz o parse do arquivo e retorna as transações
   */
  parse(content: string): ImportResult;
}
