import { Injectable, BadRequestException } from '@nestjs/common';
import { ParsedTransaction } from './csv-parser.service';

/**
 * Parser para arquivos OFX (Open Financial Exchange)
 * Suporta formato OFX 1.x
 * 
 * Estrutura básica:
 * OFXHEADER...
 * <OFX>
 *   <STMTRS>
 *     <STMTRS>
 *       <BANKTRANLIST>
 *         <STMTTRN>
 *           <TRNTYPE>DEBIT|CREDIT
 *           <DTPOSTED>YYYYMMDD
 *           <TRNAMT>valor
 *           <FITID>identificador
 *           <NAME>descricao
 */
@Injectable()
export class OfxParserService {
  parse(fileContent: string): ParsedTransaction[] {
    // Remover header OFXHEADER se existir
    let content = fileContent;
    if (content.includes('OFXHEADER')) {
      const headerEndIndex = content.indexOf('\n');
      if (headerEndIndex > -1) {
        content = content.substring(headerEndIndex + 1);
      }
    }

    // Converter para minúsculas para facilitar parse
    const contentLower = content.toLowerCase();

    // Validar estrutura básica
    if (!contentLower.includes('stmttrn') && !contentLower.includes('stmtrs')) {
      throw new BadRequestException(
        'Formato OFX inválido: estrutura não reconhecida',
      );
    }

    // Extrair transações
    const transactions = this.extractTransactions(content);

    if (transactions.length === 0) {
      throw new BadRequestException(
        'Nenhuma transação encontrada no arquivo OFX',
      );
    }

    return transactions;
  }

  private extractTransactions(content: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    // Regex para capturar blocos <STMTTRN>...</STMTTRN>
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      try {
        const transaction = this.parseTransaction(match[1]);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Erro ao parsear transação OFX: ${error.message}`);
      }
    }

    return transactions;
  }

  private parseTransaction(transactionBlock: string): ParsedTransaction | null {
    // Extrair campos
    const type = this.extractField(transactionBlock, 'TRNTYPE');
    const dtPosted = this.extractField(transactionBlock, 'DTPOSTED');
    const trnAmt = this.extractField(transactionBlock, 'TRNAMT');
    const fitId = this.extractField(transactionBlock, 'FITID');
    const name = this.extractField(transactionBlock, 'NAME');
    const memo = this.extractField(transactionBlock, 'MEMO');

    // Validar campos obrigatórios
    if (!dtPosted || !trnAmt) {
      return null;
    }

    const date = this.parseDate(dtPosted);
    if (!date) {
      return null;
    }

    const amount = parseFloat(trnAmt);
    if (isNaN(amount) || amount === 0) {
      return null;
    }

    // Determinar tipo de transação
    let transactionType: 'income' | 'expense' = 'expense';
    
    if (type) {
      const typeUpper = type.toUpperCase();
      if (
        typeUpper.includes('CREDIT') ||
        typeUpper.includes('DEBIT') && amount > 0
      ) {
        transactionType = amount > 0 ? 'income' : 'expense';
      } else if (typeUpper.includes('DEBIT')) {
        transactionType = 'expense';
      }
    } else {
      // Se não houver tipo, usar o sinal do valor
      transactionType = amount > 0 ? 'income' : 'expense';
    }

    // Montar descrição
    const description = [name, memo]
      .filter(Boolean)
      .join(' - ')
      .trim() || 'Sem descrição';

    return {
      date,
      description,
      amount: Math.abs(amount),
      type: transactionType,
      fitid: fitId || undefined,
    };
  }

  private extractField(content: string, fieldName: string): string | null {
    // Suporta tanto <FIELDNAME>value</FIELDNAME> quanto FIELDNAME:value
    const regex1 = new RegExp(
      `<${fieldName}>(.*?)<\/${fieldName}>`,
      'i',
    );
    const regex2 = new RegExp(`${fieldName}:(.+?)(?:\n|$)`, 'i');

    let match = content.match(regex1);
    if (match) {
      return match[1].trim();
    }

    match = content.match(regex2);
    if (match) {
      return match[1].trim();
    }

    return null;
  }

  private parseDate(dateStr: string): string | null {
    // Formato esperado: YYYYMMDD ou YYYYMMDDHHMMSS
    const cleaned = dateStr.replace(/[^\d]/g, '');

    if (cleaned.length < 8) {
      return null;
    }

    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);

    // Validar data
    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) {
      return null;
    }

    return `${year}-${month}-${day}`;
  }
}
