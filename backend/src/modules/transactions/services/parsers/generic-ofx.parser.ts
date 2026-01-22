import { Injectable, Logger } from '@nestjs/common';
import { IBankParser, BankParserInfo, ImportResult, ParsedTransaction } from './bank-parser.interface';
import { parseBrazilianCurrency } from './parser-utils';

/**
 * Parser genérico para arquivos OFX
 * Usado como fallback quando não há parser específico para o banco
 * 
 * Suporta OFX 1.x e 2.x (XML)
 */
@Injectable()
export class GenericOfxParser implements IBankParser {
  private readonly logger = new Logger(GenericOfxParser.name);

  getInfo(): BankParserInfo {
    return {
      bankCode: 'GENERIC_OFX',
      bankName: 'Genérico',
      supportedFormats: ['ofx'],
      description: 'Parser genérico para arquivos OFX de qualquer banco',
    };
  }

  supports(filename: string, content: string): boolean {
    const isOFX = filename.toLowerCase().endsWith('.ofx');
    if (!isOFX) return false;

    const contentLower = content.toLowerCase();
    return contentLower.includes('ofx') || contentLower.includes('stmttrn');
  }

  parse(content: string): ImportResult {
    const result: ImportResult = {
      success: false,
      transactions: [],
      errors: [],
      warnings: [],
    };

    try {
      // Detectar versão OFX
      const isOFX2 = content.includes('<?xml');
      
      // Extrair transações
      const transactions = isOFX2 
        ? this.extractTransactionsXml(content)
        : this.extractTransactionsSgml(content);

      if (transactions.length > 0) {
        result.transactions = transactions;
        result.success = true;
        this.logger.log(`Generic OFX: ${transactions.length} transações parseadas`);
      } else {
        result.errors.push('Nenhuma transação encontrada no arquivo OFX');
      }

    } catch (error) {
      result.errors.push(`Erro ao processar arquivo: ${error.message}`);
      this.logger.error(`Generic OFX parse error: ${error.message}`);
    }

    return result;
  }

  /**
   * Parse OFX 1.x (SGML-like)
   */
  private extractTransactionsSgml(content: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    // Regex para capturar blocos <STMTTRN>
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|$))/gi;
    
    let match;
    let index = 0;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      index++;
      
      try {
        const transaction = this.parseTransactionBlock(match[1], index);
        
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        this.logger.warn(`Transação ${index}: ${error.message}`);
      }
    }

    return transactions;
  }

  /**
   * Parse OFX 2.x (XML)
   */
  private extractTransactionsXml(content: string): ParsedTransaction[] {
    // Para XML, usamos a mesma lógica mas com regex mais específico
    return this.extractTransactionsSgml(content);
  }

  private parseTransactionBlock(block: string, index: number): ParsedTransaction | null {
    const trnType = this.extractField(block, 'TRNTYPE');
    const dtPosted = this.extractField(block, 'DTPOSTED');
    const trnAmt = this.extractField(block, 'TRNAMT');
    const fitId = this.extractField(block, 'FITID');
    const name = this.extractField(block, 'NAME');
    const memo = this.extractField(block, 'MEMO');

    if (!dtPosted) {
      throw new Error('Data não encontrada');
    }

    if (!trnAmt) {
      throw new Error('Valor não encontrado');
    }

    // Parse da data
    const date = this.parseDate(dtPosted);
    if (!date) {
      throw new Error(`Data inválida: ${dtPosted}`);
    }

    // Parse do valor usando utilitário
    const amount = parseBrazilianCurrency(trnAmt);
    if (isNaN(amount) || amount === 0) {
      return null;
    }

    // Determinar tipo
    let type: 'income' | 'expense';
    
    if (trnType) {
      const typeUpper = trnType.toUpperCase();
      if (typeUpper === 'CREDIT' || typeUpper === 'DEP' || typeUpper === 'INT') {
        type = 'income';
      } else if (typeUpper === 'DEBIT' || typeUpper === 'POS' || typeUpper === 'XFER' || typeUpper === 'CHECK') {
        type = 'expense';
      } else {
        type = amount > 0 ? 'income' : 'expense';
      }
    } else {
      type = amount > 0 ? 'income' : 'expense';
    }

    // Montar descrição
    const parts = [name, memo].filter(Boolean);
    const description = parts.length > 0 
      ? parts.join(' - ').trim() 
      : 'Sem descrição';

    return {
      date,
      description,
      amount: Math.abs(amount),
      type,
      fitid: fitId || undefined,
      additionalInfo: {
        tipoArquivo: 'ofx_generico',
        tipoTransacao: trnType,
      },
    };
  }

  private extractField(content: string, fieldName: string): string | null {
    // Formato com tag de fechamento
    const regexWithClose = new RegExp(`<${fieldName}>([^<]*)<\/${fieldName}>`, 'i');
    let match = content.match(regexWithClose);
    if (match) {
      return match[1].trim();
    }

    // Formato sem tag de fechamento
    const regexNoClose = new RegExp(`<${fieldName}>([^<\n\r]+)`, 'i');
    match = content.match(regexNoClose);
    if (match) {
      return match[1].trim();
    }

    return null;
  }

  private parseDate(dtPosted: string): string | null {
    const cleaned = dtPosted.replace(/\[.*\]/, '').trim();

    if (cleaned.length >= 8) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);

      const date = `${year}-${month}-${day}`;
      
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return date;
      }
    }

    return null;
  }
}
