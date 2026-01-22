import { Injectable, Logger } from '@nestjs/common';
import { IBankParser, BankParserInfo, ImportResult, ParsedTransaction } from './bank-parser.interface';
import { parseBrazilianCurrency } from './parser-utils';

/**
 * Parser para extratos OFX do Banco Inter
 * 
 * Formato OFX (Open Financial Exchange) 1.x
 * 
 * Estrutura:
 * <STMTTRN>
 *   <TRNTYPE>DEBIT|CREDIT|OTHER
 *   <DTPOSTED>YYYYMMDD ou YYYYMMDDHHmmss
 *   <TRNAMT>-100.00 ou 100.00
 *   <FITID>identificador_unico
 *   <NAME>descricao
 *   <MEMO>memo_adicional (opcional)
 * </STMTTRN>
 */
@Injectable()
export class InterOfxParser implements IBankParser {
  private readonly logger = new Logger(InterOfxParser.name);

  getInfo(): BankParserInfo {
    return {
      bankCode: 'INTER_OFX',
      bankName: 'Banco Inter',
      supportedFormats: ['ofx'],
      description: 'Extrato conta corrente/cartão Banco Inter (OFX)',
    };
  }

  supports(filename: string, content: string): boolean {
    const isOFX = filename.toLowerCase().endsWith('.ofx');
    if (!isOFX) return false;

    // Verificar se parece ser do Inter (pode ter identificadores específicos)
    const contentLower = content.toLowerCase();
    return (
      contentLower.includes('ofx') &&
      (contentLower.includes('stmttrn') || contentLower.includes('stmtrs'))
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
      // Remover header OFXHEADER se existir (OFX 1.x)
      let cleanContent = content;
      const headerEndMarkers = ['<OFX>', '<ofx>'];
      
      for (const marker of headerEndMarkers) {
        const markerIndex = content.indexOf(marker);
        if (markerIndex > -1) {
          cleanContent = content.substring(markerIndex);
          break;
        }
      }

      // Extrair transações
      const transactions = this.extractTransactions(cleanContent);

      if (transactions.length > 0) {
        result.transactions = transactions;
        result.success = true;
        this.logger.log(`Inter OFX: ${transactions.length} transações parseadas`);
      } else {
        result.errors.push('Nenhuma transação encontrada no arquivo OFX');
      }

    } catch (error) {
      result.errors.push(`Erro ao processar arquivo: ${error.message}`);
      this.logger.error(`Inter OFX parse error: ${error.message}`);
    }

    return result;
  }

  private extractTransactions(content: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    // Regex para capturar blocos <STMTTRN>...</STMTTRN>
    // OFX pode não ter tag de fechamento, então tratamos ambos os casos
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|$))/gi;
    
    let match;
    let index = 0;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      index++;
      
      try {
        const transaction = this.parseTransaction(match[1], index);
        
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        this.logger.warn(`Transação ${index}: ${error.message}`);
      }
    }

    return transactions;
  }

  private parseTransaction(block: string, index: number): ParsedTransaction | null {
    // Extrair campos
    const trnType = this.extractField(block, 'TRNTYPE');
    const dtPosted = this.extractField(block, 'DTPOSTED');
    const trnAmt = this.extractField(block, 'TRNAMT');
    const fitId = this.extractField(block, 'FITID');
    const name = this.extractField(block, 'NAME');
    const memo = this.extractField(block, 'MEMO');
    const checkNum = this.extractField(block, 'CHECKNUM');

    // Validar campos obrigatórios
    if (!dtPosted) {
      throw new Error('Data não encontrada');
    }

    if (!trnAmt) {
      throw new Error('Valor não encontrado');
    }

    // Parse da data (YYYYMMDD ou YYYYMMDDHHmmss)
    const date = this.parseDate(dtPosted);
    if (!date) {
      throw new Error(`Data inválida: ${dtPosted}`);
    }

    // Parse do valor usando utilitário
    const amount = parseBrazilianCurrency(trnAmt);
    if (isNaN(amount) || amount === 0) {
      return null; // Ignora transações com valor 0
    }

    // Determinar tipo
    let type: 'income' | 'expense';
    
    if (trnType) {
      const typeUpper = trnType.toUpperCase();
      if (typeUpper === 'CREDIT' || typeUpper === 'DEP') {
        type = 'income';
      } else if (typeUpper === 'DEBIT' || typeUpper === 'POS' || typeUpper === 'XFER') {
        type = 'expense';
      } else {
        // Fallback para o sinal do valor
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
        banco: 'INTER',
        tipoArquivo: 'extrato_ofx',
        tipoTransacao: trnType,
        ...(checkNum ? { numeroDocumento: checkNum } : {}),
        ...(memo ? { memo } : {}),
      },
    };
  }

  private extractField(content: string, fieldName: string): string | null {
    // OFX pode ter diferentes formatos:
    // 1. <FIELDNAME>value</FIELDNAME>
    // 2. <FIELDNAME>value (sem tag de fechamento)
    // 3. <FIELDNAME>value\n
    
    // Primeiro, tentar formato com tag de fechamento
    const regexWithClose = new RegExp(`<${fieldName}>([^<]*)<\/${fieldName}>`, 'i');
    let match = content.match(regexWithClose);
    if (match) {
      return match[1].trim();
    }

    // Tentar formato sem tag de fechamento
    const regexNoClose = new RegExp(`<${fieldName}>([^<\n\r]+)`, 'i');
    match = content.match(regexNoClose);
    if (match) {
      return match[1].trim();
    }

    return null;
  }

  private parseDate(dtPosted: string): string | null {
    // Remover timezone se existir [timezone]
    const cleaned = dtPosted.replace(/\[.*\]/, '').trim();

    // YYYYMMDD ou YYYYMMDDHHmmss
    if (cleaned.length >= 8) {
      const year = cleaned.substring(0, 4);
      const month = cleaned.substring(4, 6);
      const day = cleaned.substring(6, 8);

      const date = `${year}-${month}-${day}`;
      
      // Validar
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return date;
      }
    }

    return null;
  }
}
