import { Injectable, Logger } from '@nestjs/common';
import { IBankParser, BankParserInfo, ImportResult, ParsedTransaction } from './bank-parser.interface';
import { parseBrazilianCurrency, parseBrazilianDate } from './parser-utils';

/**
 * Parser para extrato de conta corrente do C6 Bank (CSV)
 * 
 * Formato do CSV:
 * Separador: , (vírgula)
 * Header: 6 linhas iniciais de informações do extrato antes dos dados
 * Colunas: Data Lançamento,Data Contábil,Título,Descrição,Entrada(R$),Saída(R$),Saldo do Dia(R$)
 * 
 * Características:
 * - Data no formato DD/MM/YYYY
 * - Entrada e Saída em colunas separadas
 * - Valores no formato brasileiro (1.234,56)
 * - Linhas com "Pix estornado" ou "Pix recusado" devem ser tratadas especialmente
 */
@Injectable()
export class C6ContaCorrenteCsvParser implements IBankParser {
  private readonly logger = new Logger(C6ContaCorrenteCsvParser.name);

  getInfo(): BankParserInfo {
    return {
      bankCode: 'C6_CONTA_CSV',
      bankName: 'C6 Bank - Conta Corrente',
      supportedFormats: ['csv'],
      description: 'Extrato de conta corrente C6 Bank (CSV)',
    };
  }

  supports(filename: string, content: string): boolean {
    const isCSV = filename.toLowerCase().endsWith('.csv');
    if (!isCSV) return false;

    // Verificar marcadores específicos do extrato de conta corrente C6
    const contentLower = content.toLowerCase();
    
    // Verificar se tem as características do extrato de conta corrente
    const hasC6Header = contentLower.includes('extrato de conta corrente c6') || 
                        contentLower.includes('c6 bank');
    const hasContaCorrenteColumns = contentLower.includes('data lançamento') &&
                                    contentLower.includes('entrada(r$)') &&
                                    contentLower.includes('saída(r$)');
    
    return hasC6Header || hasContaCorrenteColumns;
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

      // Encontrar a linha do header (contém "Data Lançamento")
      let headerIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('data lançamento')) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        result.errors.push('Cabeçalho não encontrado. Certifique-se de que é um extrato de conta corrente do C6.');
        return result;
      }

      // Processar apenas as linhas após o header
      const dataLines = lines.slice(headerIndex + 1);

      for (let i = 0; i < dataLines.length; i++) {
        const lineNumber = headerIndex + i + 2;
        
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
        this.logger.log(`C6 Conta Corrente CSV: ${result.transactions.length} transações parseadas`);
      } else {
        result.errors.push('Nenhuma transação válida encontrada');
      }

    } catch (error) {
      result.errors.push(`Erro ao processar arquivo: ${error.message}`);
      this.logger.error(`C6 Conta Corrente CSV parse error: ${error.message}`);
    }

    return result;
  }

  private parseLine(line: string, lineNumber: number): ParsedTransaction | null {
    // Parse CSV com vírgula, respeitando aspas
    const cols = this.parseCSVLine(line);

    // Esperamos pelo menos 7 colunas
    if (cols.length < 7) {
      throw new Error(`Formato inválido - esperado 7 colunas, encontrado ${cols.length}`);
    }

    const [
      dataLancamento,  // 0: DD/MM/YYYY
      dataContabil,    // 1: DD/MM/YYYY
      titulo,          // 2: Título/Tipo da transação
      descricao,       // 3: Descrição detalhada
      entrada,         // 4: Valor de entrada (crédito)
      saida,           // 5: Valor de saída (débito)
      saldoDia,        // 6: Saldo do dia (ignoramos)
    ] = cols;

    // Ignorar linhas de estorno/recusa que são apenas marcadores
    const tituloLower = titulo.toLowerCase();
    const descricaoLower = descricao.toLowerCase();
    
    if (tituloLower.includes('pix estornado') || 
        tituloLower.includes('pix recusado') ||
        descricaoLower.includes('pix estornado') ||
        descricaoLower.includes('pix recusado')) {
      return null;
    }

    // Parse da data (DD/MM/YYYY -> YYYY-MM-DD) - usar data de lançamento
    const date = parseBrazilianDate(dataLancamento);
    if (!date) {
      throw new Error(`Data inválida: ${dataLancamento}`);
    }

    // Parse dos valores
    const valorEntrada = parseBrazilianCurrency(entrada);
    const valorSaida = parseBrazilianCurrency(saida);

    // Determinar tipo e valor
    let type: 'income' | 'expense';
    let amount: number;

    if (valorEntrada > 0) {
      type = 'income';
      amount = valorEntrada;
    } else if (valorSaida > 0) {
      type = 'expense';
      amount = valorSaida;
    } else {
      // Ambos zero, ignorar
      return null;
    }

    // Construir descrição limpa
    const description = this.buildDescription(titulo, descricao);

    // Extrair informações adicionais
    const metadata = this.extractMetadata(titulo, descricao);

    return {
      date,
      description,
      amount,
      type,
      additionalInfo: {
        dataLancamento,
        dataContabil,
        titulo,
        descricao,
        entrada,
        saida,
        ...metadata,
      },
    };
  }

  private buildDescription(titulo: string, descricao: string): string {
    // Limpar e combinar título e descrição
    const tituloClean = titulo.replace(/"/g, '').trim();
    const descricaoClean = descricao.replace(/"/g, '').trim();

    // Se o título já está contido na descrição, usar só a descrição
    if (descricaoClean.toLowerCase().includes(tituloClean.toLowerCase())) {
      return this.cleanDescription(descricaoClean);
    }

    // Combinar título e descrição se forem diferentes
    if (tituloClean && descricaoClean && tituloClean !== descricaoClean) {
      return this.cleanDescription(`${tituloClean} - ${descricaoClean}`);
    }

    return this.cleanDescription(descricaoClean || tituloClean);
  }

  private cleanDescription(desc: string): string {
    return desc
      .replace(/\s+/g, ' ')                    // Múltiplos espaços -> um espaço
      .replace(/BRA$/i, '')                     // Remover "BRA" no final
      .replace(/\s{2,}/g, ' ')                  // Espaços duplos
      .trim();
  }

  private extractMetadata(titulo: string, descricao: string): Record<string, string> {
    const metadata: Record<string, string> = {};

    const tituloLower = titulo.toLowerCase();
    const descricaoLower = descricao.toLowerCase();

    // Identificar tipo de transação
    if (tituloLower.includes('pix enviado') || descricaoLower.includes('pix enviado')) {
      metadata.transactionType = 'PIX_ENVIADO';
    } else if (tituloLower.includes('pix recebido') || descricaoLower.includes('pix recebido')) {
      metadata.transactionType = 'PIX_RECEBIDO';
    } else if (tituloLower.includes('debito de cartao') || tituloLower.includes('débito de cartão')) {
      metadata.transactionType = 'DEBITO_CARTAO';
    } else if (tituloLower.includes('recebimento salario') || tituloLower.includes('recebimento salário')) {
      metadata.transactionType = 'SALARIO';
    } else if (tituloLower.includes('resgate de cdb')) {
      metadata.transactionType = 'RESGATE_CDB';
    } else if (tituloLower.includes('emissao de cdb') || tituloLower.includes('emissão de cdb')) {
      metadata.transactionType = 'APLICACAO_CDB';
    } else if (tituloLower.includes('pgto fat cartao') || tituloLower.includes('fatura')) {
      metadata.transactionType = 'PAGAMENTO_FATURA';
    }

    // Extrair nome do destinatário/remetente de PIX
    const pixMatch = descricao.match(/(?:pix (?:enviado|recebido)(?: c6)? (?:para|de) )(.+)/i);
    if (pixMatch) {
      metadata.pixContraparte = pixMatch[1].trim();
    }

    return metadata;
  }

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
