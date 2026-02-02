import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { 
  IBankParser, 
  BankParserInfo, 
  ImportResult, 
  ParsedTransaction,
  C6CsvParser,
  C6ContaCorrenteCsvParser,
  InterOfxParser,
  BbOfxParser,
  NubankCsvParser,
  GenericOfxParser,
} from './parsers';

/**
 * Códigos de banco suportados
 */
export type SupportedBankCode = 
  | 'C6_CSV'           // C6 Bank - Fatura cartão CSV
  | 'C6_CONTA_CSV'     // C6 Bank - Conta corrente CSV
  | 'INTER_OFX'        // Banco Inter - OFX
  | 'BB_OFX'           // Banco do Brasil - OFX
  | 'NUBANK_CSV'       // Nubank - CSV
  | 'GENERIC_OFX'      // Genérico OFX
  | 'AUTO';            // Detecção automática

interface ImportOptions {
  accountId: string;
  userId: string;
  bankCode: SupportedBankCode;
  filename: string;
}

interface ProcessedImportResult {
  success: boolean;
  bankDetected: string;
  transactions: ParsedTransaction[];
  summary: {
    total: number;
    income: number;
    expense: number;
    totalIncome: number;
    totalExpense: number;
  };
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly parsers: Map<string, IBankParser> = new Map();

  constructor(
    private readonly c6CsvParser: C6CsvParser,
    private readonly c6ContaCorrenteCsvParser: C6ContaCorrenteCsvParser,
    private readonly interOfxParser: InterOfxParser,
    private readonly bbOfxParser: BbOfxParser,
    private readonly nubankCsvParser: NubankCsvParser,
    private readonly genericOfxParser: GenericOfxParser,
  ) {
    // Registrar todos os parsers
    this.registerParser(c6CsvParser);
    this.registerParser(c6ContaCorrenteCsvParser);
    this.registerParser(interOfxParser);
    this.registerParser(bbOfxParser);
    this.registerParser(nubankCsvParser);
    this.registerParser(genericOfxParser);
  }

  private registerParser(parser: IBankParser): void {
    const info = parser.getInfo();
    this.parsers.set(info.bankCode, parser);
    this.logger.log(`Parser registrado: ${info.bankCode} (${info.bankName})`);
  }

  /**
   * Retorna lista de bancos/formatos suportados
   */
  getSupportedBanks(): BankParserInfo[] {
    const banks: BankParserInfo[] = [];
    
    this.parsers.forEach((parser) => {
      const info = parser.getInfo();
      // Não incluir o genérico na lista pública
      if (info.bankCode !== 'GENERIC_OFX') {
        banks.push(info);
      }
    });

    return banks;
  }

  /**
   * Processa arquivo de importação
   */
  processFile(content: string, options: ImportOptions): ProcessedImportResult {
    const { bankCode, filename } = options;

    let parser: IBankParser | undefined;
    let result: ImportResult;

    // Determinar parser a usar
    if (bankCode === 'AUTO') {
      parser = this.detectParser(filename, content);
      if (!parser) {
        return {
          success: false,
          bankDetected: 'Desconhecido',
          transactions: [],
          summary: { total: 0, income: 0, expense: 0, totalIncome: 0, totalExpense: 0 },
          errors: ['Não foi possível detectar o formato do arquivo automaticamente. Selecione o banco manualmente.'],
          warnings: [],
        };
      }
    } else {
      parser = this.parsers.get(bankCode);
      if (!parser) {
        throw new BadRequestException(`Banco não suportado: ${bankCode}`);
      }
    }

    // Executar parse
    const bankInfo = parser.getInfo();
    this.logger.log(`Processando arquivo com parser: ${bankInfo.bankCode}`);

    result = parser.parse(content);

    // Calcular resumo
    const summary = this.calculateSummary(result.transactions);

    return {
      success: result.success,
      bankDetected: bankInfo.bankName,
      transactions: result.transactions,
      summary,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  /**
   * Detecta automaticamente o parser correto baseado no conteúdo
   */
  private detectParser(filename: string, content: string): IBankParser | undefined {
    // Tentar parsers específicos primeiro (ordem de prioridade)
    // IMPORTANTE: C6 Conta Corrente deve vir ANTES do C6 Fatura pois são ambos CSV
    // IMPORTANTE: BB deve vir antes do Inter pois ambos são OFX
    const specificParsers = [
      this.c6ContaCorrenteCsvParser,  // Detecta extrato conta corrente C6
      this.c6CsvParser,                // Detecta fatura cartão C6
      this.nubankCsvParser,
      this.bbOfxParser,                // Detecta extrato Banco do Brasil
      this.interOfxParser,
    ];

    for (const parser of specificParsers) {
      if (parser.supports(filename, content)) {
        this.logger.log(`Parser detectado automaticamente: ${parser.getInfo().bankCode}`);
        return parser;
      }
    }

    // Fallback para parser genérico
    if (this.genericOfxParser.supports(filename, content)) {
      this.logger.log('Usando parser OFX genérico');
      return this.genericOfxParser;
    }

    return undefined;
  }

  /**
   * Calcula resumo das transações
   */
  private calculateSummary(transactions: ParsedTransaction[]) {
    let income = 0;
    let expense = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income') {
        income++;
        totalIncome += t.amount;
      } else {
        expense++;
        totalExpense += t.amount;
      }
    }

    return {
      total: transactions.length,
      income,
      expense,
      totalIncome,
      totalExpense,
    };
  }

  /**
   * Normaliza transações para o formato esperado pelo TransactionsService
   */
  normalizeForImport(transactions: ParsedTransaction[]): Array<{
    date: Date;
    descriptionRaw: string;
    amount: number;
    fitid?: string;
    additionalInfo?: any;
  }> {
    return transactions.map(t => ({
      date: new Date(t.date),
      descriptionRaw: t.description,
      amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
      fitid: t.fitid,
      additionalInfo: t.additionalInfo,
    }));
  }
}
