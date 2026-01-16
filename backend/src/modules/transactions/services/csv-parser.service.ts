import { Injectable, BadRequestException } from '@nestjs/common';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  fitid?: string;
   additionalInfo?: Record<string, unknown>;
}

@Injectable()
export class CsvParserService {
  /**
   * Faz parse de arquivo CSV
   * Suporta formatos comuns de extratos bancários
   * 
   * Formatos esperados:
   * data,descricao,valor
   * data,descricao,debito,credito
   */
  parse(fileContent: string): ParsedTransaction[] {
    const lines = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new BadRequestException('Arquivo CSV vazio');
    }

    // Skip header se existir
    let startLine = 0;
    const headerLine = lines[0].toLowerCase();
    
    if (
      headerLine.includes('data') ||
      headerLine.includes('date') ||
      headerLine.includes('descricao') ||
      headerLine.includes('description')
    ) {
      startLine = 1;
    }

    const transactions: ParsedTransaction[] = [];

    for (let i = startLine; i < lines.length; i++) {
      try {
        const transaction = this.parseLine(lines[i]);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Erro ao parsear linha ${i + 1}: ${lines[i]}`);
      }
    }

    if (transactions.length === 0) {
      throw new BadRequestException(
        'Nenhuma transação válida encontrada no arquivo',
      );
    }

    return transactions;
  }

  private parseLine(line: string): ParsedTransaction | null {
    const parts = line.split(',').map(p => p.trim());

    if (parts.length < 3) {
      return null;
    }

    // Tentar diferentes formatos
    // Formato 1: data, descricao, valor (com sinal)
    if (parts.length === 3) {
      return this.parseFormat1(parts);
    }

    // Formato 2: data, descricao, debito, credito
    if (parts.length === 4) {
      return this.parseFormat2(parts);
    }

    // Formato 3: data, descricao, tipo, valor
    if (parts.length === 4) {
      return this.parseFormat3(parts);
    }

    return null;
  }

  /**
   * Formato: data, descricao, valor (sinal indica tipo)
   */
  private parseFormat1(parts: string[]): ParsedTransaction | null {
    const [dateStr, description, valueStr] = parts;

    const date = this.parseDate(dateStr);
    if (!date) return null;

    const amount = this.parseAmount(valueStr);
    if (amount === null) return null;

    const type = amount < 0 ? 'expense' : 'income';

    return {
      date,
      description,
      amount: Math.abs(amount),
      type,
    };
  }

  /**
   * Formato: data, descricao, debito, credito
   */
  private parseFormat2(parts: string[]): ParsedTransaction | null {
    const [dateStr, description, debitoStr, creditoStr] = parts;

    const date = this.parseDate(dateStr);
    if (!date) return null;

    const debito = this.parseAmount(debitoStr);
    const credito = this.parseAmount(creditoStr);

    if (debito === null && credito === null) {
      return null;
    }

    if (debito && debito > 0) {
      return {
        date,
        description,
        amount: debito,
        type: 'expense',
      };
    }

    if (credito && credito > 0) {
      return {
        date,
        description,
        amount: credito,
        type: 'income',
      };
    }

    return null;
  }

  /**
   * Formato: data, descricao, tipo (D/C ou expense/income), valor
   */
  private parseFormat3(parts: string[]): ParsedTransaction | null {
    const [dateStr, description, typeStr, valueStr] = parts;

    const date = this.parseDate(dateStr);
    if (!date) return null;

    const amount = this.parseAmount(valueStr);
    if (amount === null || amount === 0) return null;

    const type =
      typeStr.toUpperCase().startsWith('D') ||
      typeStr.toLowerCase().includes('expense')
        ? 'expense'
        : 'income';

    return {
      date,
      description,
      amount: Math.abs(amount),
      type,
    };
  }

  private parseDate(dateStr: string): string | null {
    // Suporta: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (dateStr.includes('/') || dateStr.includes('-')) {
          const [, first, second, third] = match;
          
          // Detectar formato
          if (parseInt(first) > 31) {
            // YYYY-MM-DD
            return `${first}-${second}-${third}`;
          } else {
            // DD/MM/YYYY ou DD-MM-YYYY
            return `${third}-${second}-${first}`;
          }
        }
      }
    }

    return null;
  }

  private parseAmount(valueStr: string): number | null {
    // Remove espaços
    let clean = valueStr.trim();

    // Suporta: -150,50 | -150.50 | (150,50) | (150.50)
    const isNegative =
      clean.startsWith('-') || clean.startsWith('(') || clean.endsWith(')');

    clean = clean
      .replace(/[()]/g, '')
      .replace(/\s/g, '')
      .replace(/-/g, '');

    // Detectar separador decimal
    const lastCommaIndex = clean.lastIndexOf(',');
    const lastDotIndex = clean.lastIndexOf('.');

    let amount: number;

    if (lastCommaIndex > lastDotIndex && lastCommaIndex > -1) {
      // Vírgula é decimal
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (lastDotIndex > -1) {
      // Ponto é decimal
      clean = clean.replace(/,/g, '');
    } else {
      // Sem decimal
      clean = clean.replace(/[.,]/g, '');
    }

    amount = parseFloat(clean);

    if (isNaN(amount)) {
      return null;
    }

    return isNegative ? -amount : amount;
  }
}
