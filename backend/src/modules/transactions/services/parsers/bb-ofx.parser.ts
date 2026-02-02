import { Injectable, Logger } from '@nestjs/common';
import { IBankParser, BankParserInfo, ImportResult, ParsedTransaction } from './bank-parser.interface';
import { parseBrazilianCurrency } from './parser-utils';

/**
 * Parser para extratos OFX do Banco do Brasil (BB)
 * 
 * Formato OFX (Open Financial Exchange) 1.x
 * 
 * Estrutura:
 * <STMTTRN>
 *   <TRNTYPE>DEBIT|CREDIT|OTHER
 *   <DTPOSTED>YYYYMMDD000000[-3:BRT]
 *   <TRNAMT>-100.00 ou 100.00
 *   <FITID>identificador_unico
 *   <NAME>descricao
 *   <MEMO>memo_adicional (opcional)
 * </STMTTRN>
 * 
 * Características do BB:
 * - Data inclui timezone no formato [-3:BRT]
 * - Transações de "Saldo Anterior" e "Saldo do dia" devem ser ignoradas
 * - Proventos de FIIs e ações (MEMO contém ticker)
 * - BB Rende Fácil (aplicação automática)
 * - FITID pode estar vazio para transações de saldo
 */
@Injectable()
export class BbOfxParser implements IBankParser {
  private readonly logger = new Logger(BbOfxParser.name);

  getInfo(): BankParserInfo {
    return {
      bankCode: 'BB_OFX',
      bankName: 'Banco do Brasil',
      supportedFormats: ['ofx'],
      description: 'Extrato conta corrente Banco do Brasil (OFX)',
    };
  }

  supports(filename: string, content: string): boolean {
    const isOFX = filename.toLowerCase().endsWith('.ofx');
    if (!isOFX) return false;

    // Verificar se é do Banco do Brasil
    const contentLower = content.toLowerCase();
    return (
      contentLower.includes('banco do brasil') ||
      (contentLower.includes('<org>') && contentLower.includes('brasil'))
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
        this.logger.log(`BB OFX: ${transactions.length} transações parseadas`);
      } else {
        result.errors.push('Nenhuma transação encontrada no arquivo OFX');
      }

    } catch (error) {
      result.errors.push(`Erro ao processar arquivo: ${error.message}`);
      this.logger.error(`BB OFX parse error: ${error.message}`);
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

    // Ignorar transações de saldo (Saldo Anterior, Saldo do dia)
    if (name && this.isSaldoTransaction(name)) {
      return null;
    }

    // Validar campos obrigatórios
    if (!dtPosted) {
      throw new Error('Data não encontrada');
    }

    if (!trnAmt) {
      throw new Error('Valor não encontrado');
    }

    // Parse da data (YYYYMMDD ou YYYYMMDDHHmmss[-3:BRT])
    const date = this.parseDate(dtPosted);
    if (!date) {
      throw new Error(`Data inválida: ${dtPosted}`);
    }

    // Verificar se é uma data válida (não no ano 0002 por exemplo)
    const yearNum = parseInt(date.substring(0, 4), 10);
    if (yearNum < 1900 || yearNum > 2100) {
      // Data inválida (ex: 00021130 que aparece em "Saldo do dia")
      return null;
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

    // Montar descrição com informações do BB
    const description = this.buildDescription(name, memo);

    // Extrair informações adicionais específicas do BB
    const additionalInfo = this.extractAdditionalInfo(name, memo, trnType, checkNum);

    return {
      date,
      description,
      amount: Math.abs(amount),
      type,
      fitid: fitId || undefined,
      additionalInfo,
    };
  }

  /**
   * Verifica se é uma transação de saldo (que deve ser ignorada)
   */
  private isSaldoTransaction(name: string): boolean {
    const nameLower = name.toLowerCase();
    return (
      nameLower.includes('saldo anterior') ||
      nameLower.includes('saldo do dia') ||
      nameLower.includes('saldo parcial')
    );
  }

  /**
   * Constrói a descrição da transação
   */
  private buildDescription(name: string | null, memo: string | null): string {
    const parts: string[] = [];
    
    if (name) {
      parts.push(name.trim());
    }
    
    if (memo) {
      const memoTrimmed = memo.trim();
      // Evitar repetição se memo já estiver no name
      if (!name || !name.toLowerCase().includes(memoTrimmed.toLowerCase())) {
        parts.push(memoTrimmed);
      }
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Sem descrição';
  }

  /**
   * Extrai informações adicionais específicas do Banco do Brasil
   */
  private extractAdditionalInfo(
    name: string | null, 
    memo: string | null, 
    trnType: string | null, 
    checkNum: string | null
  ): Record<string, unknown> {
    const info: Record<string, unknown> = {
      banco: 'BB',
      tipoArquivo: 'extrato_ofx',
    };

    if (trnType) {
      info.tipoTransacao = trnType;
    }

    if (checkNum) {
      info.numeroDocumento = checkNum;
    }

    if (memo) {
      info.memo = memo;

      // Detectar ticker de FII/Ação no memo
      const tickerMatch = memo.match(/([A-Z]{4}\d{2})/);
      if (tickerMatch) {
        info.ticker = tickerMatch[1];
        info.tipoTransacao = 'PROVENTO';
      }
    }

    // Detectar tipo de transação específica do BB
    const combinedText = `${name || ''} ${memo || ''}`.toLowerCase();
    
    if (combinedText.includes('rende fácil') || combinedText.includes('rende facil')) {
      info.categoria = 'BB_RENDE_FACIL';
    } else if (combinedText.includes('proventos') || combinedText.includes('rendimento')) {
      info.categoria = 'PROVENTOS';
    } else if (combinedText.includes('pix')) {
      info.categoria = 'PIX';
    } else if (combinedText.includes('ted') || combinedText.includes('doc')) {
      info.categoria = 'TRANSFERENCIA';
    } else if (combinedText.includes('débito automático') || combinedText.includes('debito automatico')) {
      info.categoria = 'DEBITO_AUTOMATICO';
    } else if (combinedText.includes('tarifa') || combinedText.includes('taxa')) {
      info.categoria = 'TARIFA';
    }

    return info;
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
    // Remover timezone se existir [-3:BRT] ou [+0:GMT]
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
