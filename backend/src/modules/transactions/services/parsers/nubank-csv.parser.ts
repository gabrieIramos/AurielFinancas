import { Injectable, Logger } from '@nestjs/common';
import { IBankParser, BankParserInfo, ImportResult, ParsedTransaction } from './bank-parser.interface';
import { parseBrazilianCurrency } from './parser-utils';

/**
 * Parser para faturas/extratos do Nubank (CSV)
 * 
 * Formato esperado do Nubank:
 * Separador: , (vírgula)
 * Colunas: date,category,title,amount
 * 
 * Características:
 * - Data no formato YYYY-MM-DD
 * - Valores negativos são despesas
 * - Valores positivos são receitas (estornos, cashback)
 */
@Injectable()
export class NubankCsvParser implements IBankParser {
  private readonly logger = new Logger(NubankCsvParser.name);

  getInfo(): BankParserInfo {
    return {
      bankCode: 'NUBANK_CSV',
      bankName: 'Nubank',
      supportedFormats: ['csv'],
      description: 'Fatura de cartão ou extrato Nubank (CSV)',
    };
  }

  supports(filename: string, content: string): boolean {
    const isCSV = filename.toLowerCase().endsWith('.csv');
    if (!isCSV) return false;

    // Verificar se tem as colunas do Nubank
    const firstLine = content.split('\n')[0]?.toLowerCase() || '';
    return (
      firstLine.includes('date') &&
      firstLine.includes('title') &&
      firstLine.includes('amount')
    );
  }

  parse(content: string): ImportResult {
    const result: ImportResult = {
      success: false,
      transactions: [],
      errors: [],
      warnings: [],
    };

    try {
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        result.errors.push('Arquivo CSV vazio ou sem transações');
        return result;
      }

      // Identificar colunas pelo header
      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const colIndex = {
        date: header.indexOf('date'),
        category: header.indexOf('category'),
        title: header.indexOf('title'),
        amount: header.indexOf('amount'),
      };

      if (colIndex.date === -1 || colIndex.title === -1 || colIndex.amount === -1) {
        result.errors.push('Colunas obrigatórias não encontradas (date, title, amount)');
        return result;
      }

      // Processar linhas de dados
      for (let i = 1; i < lines.length; i++) {
        const lineNumber = i + 1;
        
        try {
          const transaction = this.parseLine(lines[i], colIndex, lineNumber);
          
          if (transaction) {
            result.transactions.push(transaction);
          }
        } catch (error) {
          result.warnings.push(`Linha ${lineNumber}: ${error.message}`);
        }
      }

      if (result.transactions.length > 0) {
        result.success = true;
        this.logger.log(`Nubank CSV: ${result.transactions.length} transações parseadas`);
      } else {
        result.errors.push('Nenhuma transação válida encontrada');
      }

    } catch (error) {
      result.errors.push(`Erro ao processar arquivo: ${error.message}`);
      this.logger.error(`Nubank CSV parse error: ${error.message}`);
    }

    return result;
  }

  private parseLine(
    line: string, 
    colIndex: { date: number; category: number; title: number; amount: number },
    lineNumber: number
  ): ParsedTransaction | null {
    // Parse CSV considerando aspas
    const cols = this.parseCSVLine(line);

    const dateStr = cols[colIndex.date]?.trim();
    const category = cols[colIndex.category]?.trim();
    const title = cols[colIndex.title]?.trim();
    const amountStr = cols[colIndex.amount]?.trim();

    if (!dateStr || !amountStr) {
      throw new Error('Data ou valor ausente');
    }

    // Validar data (YYYY-MM-DD)
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Data inválida: ${dateStr}`);
    }

    // Parse do valor usando utilitário
    const amount = parseBrazilianCurrency(amountStr);
    if (isNaN(amount)) {
      throw new Error(`Valor inválido: ${amountStr}`);
    }

    // Ignorar transações com valor 0
    if (amount === 0) {
      return null;
    }

    // Determinar tipo
    // Nubank: valores negativos são despesas
    const type: 'income' | 'expense' = amount < 0 ? 'expense' : 'income';

    return {
      date: dateStr,
      description: title || 'Sem descrição',
      amount: Math.abs(amount),
      type,
      additionalInfo: {
        banco: 'NUBANK',
        tipoArquivo: 'extrato_csv',
        categoriaOriginal: category,
      },
    };
  }

  /**
   * Parse de linha CSV respeitando aspas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Adicionar último campo
    result.push(current.trim());
    
    return result;
  }
}
