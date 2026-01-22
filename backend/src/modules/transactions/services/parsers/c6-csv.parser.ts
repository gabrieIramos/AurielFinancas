import { Injectable, Logger } from '@nestjs/common';
import { IBankParser, BankParserInfo, ImportResult, ParsedTransaction } from './bank-parser.interface';
import { parseBrazilianCurrency, parseBrazilianDate } from './parser-utils';

/**
 * Parser para faturas de cartão de crédito do C6 Bank (CSV)
 * 
 * Formato do CSV:
 * Separador: ; (ponto e vírgula)
 * Colunas: Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)
 * 
 * Características:
 * - Data no formato DD/MM/YYYY
 * - Valores negativos = estorno
 * - Coluna "Parcela" pode ser "Única" ou "X/Y"
 * - Categoria do banco (ignoramos, usamos nossa IA)
 */
@Injectable()
export class C6CsvParser implements IBankParser {
  private readonly logger = new Logger(C6CsvParser.name);

  getInfo(): BankParserInfo {
    return {
      bankCode: 'C6_CSV',
      bankName: 'C6 Bank',
      supportedFormats: ['csv'],
      description: 'Fatura de cartão de crédito C6 Bank (CSV)',
    };
  }

  supports(filename: string, content: string): boolean {
    const isCSV = filename.toLowerCase().endsWith('.csv');
    if (!isCSV) return false;

    // Verificar se tem as colunas do C6
    const firstLine = content.split('\n')[0]?.toLowerCase() || '';
    return (
      firstLine.includes('data de compra') &&
      firstLine.includes('final do cartão') &&
      firstLine.includes('valor (em r$)')
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

      // Pular header
      const dataLines = lines.slice(1);

      for (let i = 0; i < dataLines.length; i++) {
        const lineNumber = i + 2; // +2 porque pulamos o header e index começa em 0
        
        try {
          const transaction = this.parseLine(dataLines[i], lineNumber);
          
          if (transaction) {
            result.transactions.push(transaction);
          }
        } catch (error) {
          result.warnings.push(`Linha ${lineNumber}: ${error.message}`);
        }
      }

      if (result.transactions.length > 0) {
        result.success = true;
        this.logger.log(`C6 CSV: ${result.transactions.length} transações parseadas`);
      } else {
        result.errors.push('Nenhuma transação válida encontrada');
      }

    } catch (error) {
      result.errors.push(`Erro ao processar arquivo: ${error.message}`);
      this.logger.error(`C6 CSV parse error: ${error.message}`);
    }

    return result;
  }

  private parseLine(line: string, lineNumber: number): ParsedTransaction | null {
    // Separar por ; e limpar espaços
    const cols = line.split(';').map(col => col.trim().replace(/^"|"$/g, ''));

    // Esperamos pelo menos 9 colunas
    if (cols.length < 9) {
      throw new Error(`Formato inválido - esperado 9 colunas, encontrado ${cols.length}`);
    }

    const [
      dataCompra,      // 0: DD/MM/YYYY
      nomeCartao,      // 1: Nome do titular
      finalCartao,     // 2: Últimos 4 dígitos
      categoriaOrigem, // 3: Categoria do banco (ignoramos)
      descricao,       // 4: Descrição da transação
      parcela,         // 5: "Única" ou "X/Y"
      valorUsd,        // 6: Valor em dólar (se aplicável)
      cotacao,         // 7: Cotação do dólar (se aplicável)
      valorBrl,        // 8: Valor em reais
    ] = cols;

    // Parse da data (DD/MM/YYYY -> YYYY-MM-DD)
    const date = parseBrazilianDate(dataCompra);
    if (!date) {
      throw new Error(`Data inválida: ${dataCompra}`);
    }

    // Parse do valor usando utilitário
    const amount = parseBrazilianCurrency(valorBrl);

    if (isNaN(amount)) {
      throw new Error(`Valor inválido: ${valorBrl}`);
    }

    // Ignorar transações com valor 0
    if (amount === 0) {
      return null;
    }

    // Descrição limpa
    const description = this.cleanDescription(descricao);

    // Determinar tipo
    // - Valores negativos são estornos (income)
    // - Transações com "PAGAMENTO" são income
    // - Resto é expense
    const isEstorno = amount < 0;
    const isPagamento = description.toUpperCase().includes('PAGAMENTO');
    
    let type: 'income' | 'expense';
    let finalAmount = Math.abs(amount);
    
    if (isEstorno) {
      type = 'income';
    } else if (isPagamento) {
      type = 'income';
    } else {
      type = 'expense';
    }

    // Extrair info da parcela
    let parcelaInfo: { atual?: number; total?: number } | undefined;
    let parcelaAtual = 1;
    
    if (parcela && parcela !== 'Única') {
      const parcelaParts = parcela.split('/');
      if (parcelaParts.length === 2) {
        parcelaAtual = parseInt(parcelaParts[0]);
        parcelaInfo = {
          atual: parcelaAtual,
          total: parseInt(parcelaParts[1]),
        };
      }
    }

    // Ajustar data para parcelas: a data no CSV é da compra original,
    // mas queremos a data da parcela atual
    let finalDate = date;
    if (parcelaAtual > 1) {
      const dateObj = new Date(date);
      dateObj.setMonth(dateObj.getMonth() + (parcelaAtual - 1));
      finalDate = dateObj.toISOString().split('T')[0];
    }

    return {
      date: finalDate,
      description,
      amount: finalAmount,
      type,
      additionalInfo: {
        banco: 'C6',
        tipoArquivo: 'fatura_cartao',
        cartaoFinal: finalCartao,
        titularCartao: nomeCartao,
        parcela: parcelaInfo,
        parcelaOriginal: parcela,
        categoriaOriginal: categoriaOrigem, // Categoria do banco (para debug)
        valorOriginal: valorBrl,
        dataCompraOriginal: date, // Data original da compra (útil para parcelas)
        ...(valorUsd && valorUsd !== '0' ? { valorUsd, cotacaoDolar: cotacao } : {}),
      },
    };
  }

  /**
   * Limpa a descrição da transação
   * 
   * Casos tratados:
   * - "99APP       *99APP" -> "99APP"
   * - "UBER   *UBER" -> "UBER"
   * - "PAG*JoseDaSilva" -> "PAG JoseDaSilva"
   * - "MERCADOLIVRE*ML" -> "MERCADOLIVRE"
   */
  private cleanDescription(rawDescription: string | undefined): string {
    if (!rawDescription) return 'Sem descrição';
    
    let desc = rawDescription.trim();
    
    // Padrão: "NOME       *NOME" ou "NOME*NOME" -> manter apenas "NOME"
    // Regex: captura texto antes do * e depois, se forem similares, mantém só um
    const duplicatePattern = /^(.+?)\s*\*\s*\1$/i;
    const duplicateMatch = desc.match(duplicatePattern);
    if (duplicateMatch) {
      desc = duplicateMatch[1].trim();
    } else {
      // Padrão: "NOME    *SUFIXO" -> "NOME SUFIXO" (limpar espaços extras)
      desc = desc.replace(/\s+\*/g, ' ').replace(/\*\s+/g, ' ').replace(/\*/, ' ');
    }
    
    // Remover espaços múltiplos
    desc = desc.replace(/\s+/g, ' ').trim();
    
    // Se ficou vazio, retorna padrão
    return desc || 'Sem descrição';
  }
}
