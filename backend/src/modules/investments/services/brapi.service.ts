import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Ativo } from '../entities/ativo.entity';

interface BrapiQuoteResponse {
  results: {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketTime: string;
    shortName?: string;
    longName?: string;
  }[];
  requestedAt: string;
}

export interface FailedAtivo {
  ativo: Ativo;
  errorCode: number;
  errorMessage: string;
  timestamp: Date;
  retryCount: number;
}

export interface UpdateResult {
  updated: number;
  failed: number;
  total: number;
  failedTickers: string[];
  retriedTickers: { ticker: string; success: boolean }[];
}

// Intervalo entre requisições (em ms) - 1.5 segundos para respeitar rate limit do plano free
const REQUEST_INTERVAL_MS = 1500;
// Intervalo entre retries (em ms) - 3 segundos para dar mais tempo
const RETRY_INTERVAL_MS = 3000;
// Número máximo de tentativas de retry
const MAX_RETRY_ATTEMPTS = 3;

@Injectable()
export class BrapiService {
  private readonly logger = new Logger(BrapiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://brapi.dev/api';
  
  // Lista de ativos que falharam para tracking e retry
  private failedAtivos: FailedAtivo[] = [];

  constructor(
    private configService: ConfigService,
    @InjectRepository(Ativo)
    private ativoRepository: Repository<Ativo>,
  ) {
    this.apiKey = this.configService.get<string>('BRAPI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('BRAPI_API_KEY não configurada. Atualizações de preço desabilitadas.');
    }
  }

  /**
   * Retorna a lista de ativos que falharam na última atualização
   */
  getFailedAtivos(): FailedAtivo[] {
    return [...this.failedAtivos];
  }

  /**
   * Limpa a lista de ativos com falha
   */
  clearFailedAtivos(): void {
    this.failedAtivos = [];
  }

  /**
   * Busca cotação de um único ativo na BRAPI (plano free)
   * Retorna { price, errorCode } para tracking de erros
   */
  async getQuote(ticker: string): Promise<{ price: number | null; changePercent?: number; errorCode?: number; errorMessage?: string }> {
    if (!this.apiKey) {
      return { price: null, errorMessage: 'API Key não configurada' };
    }

    try {
      const url = `${this.baseUrl}/quote/${ticker}?token=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorMessage = `${response.status} ${response.statusText}`;
        this.logger.error(`BRAPI Error for ${ticker}: ${errorMessage}`);
        return { price: null, errorCode: response.status, errorMessage };
      }

      const data: BrapiQuoteResponse = await response.json();
      
      if (data.results && data.results.length > 0 && data.results[0].regularMarketPrice) {
        return { 
          price: data.results[0].regularMarketPrice,
          changePercent: data.results[0].regularMarketChangePercent || 0
        };
      }
      
      return { price: null, errorMessage: 'Preço não encontrado na resposta' };
    } catch (error) {
      this.logger.error(`Erro ao buscar cotação de ${ticker}: ${error.message}`);
      return { price: null, errorMessage: error.message };
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Tenta atualizar um ativo específico com retry
   */
  private async tryUpdateAtivo(
    ativo: Ativo, 
    index: number, 
    total: number,
    isRetry = false,
    retryAttempt = 0
  ): Promise<{ success: boolean; errorCode?: number; errorMessage?: string }> {
    const prefix = isRetry ? `🔄 RETRY [${retryAttempt}]` : ``;
    
    try {
      const result = await this.getQuote(ativo.ticker);
      
      if (result.price !== null) {
        await this.ativoRepository.update(ativo.id, {
          precoAtual: result.price,
          variacaoDia: result.changePercent || 0,
        });
        const changeStr = result.changePercent !== undefined ? ` (${result.changePercent >= 0 ? '+' : ''}${result.changePercent.toFixed(2)}%)` : '';
        this.logger.log(`✅ ${prefix}[${index + 1}/${total}] ${ativo.ticker}: R$ ${result.price.toFixed(2)}${changeStr}`);
        return { success: true };
      } else {
        this.logger.warn(`❌ ${prefix}[${index + 1}/${total}] ${ativo.ticker}: ${result.errorMessage || 'Falha ao obter preço'}`);
        return { 
          success: false, 
          errorCode: result.errorCode, 
          errorMessage: result.errorMessage 
        };
      }
    } catch (updateError) {
      this.logger.error(`❌ ${prefix}[${index + 1}/${total}] ${ativo.ticker}: ${updateError.message}`);
      return { success: false, errorMessage: updateError.message };
    }
  }

  /**
   * Executa retry nos ativos que falharam
   */
  private async retryFailedAtivos(): Promise<{ ticker: string; success: boolean }[]> {
    const results: { ticker: string; success: boolean }[] = [];
    
    if (this.failedAtivos.length === 0) {
      return results;
    }

    this.logger.log(`\n🔄 Iniciando retry de ${this.failedAtivos.length} ativos que falharam...`);
    
    // Copia e limpa a lista para evitar loops infinitos
    const ativosParaRetry = [...this.failedAtivos];
    this.failedAtivos = [];
    
    for (let i = 0; i < ativosParaRetry.length; i++) {
      const failedItem = ativosParaRetry[i];
      
      // Verifica se já excedeu o máximo de tentativas
      if (failedItem.retryCount >= MAX_RETRY_ATTEMPTS) {
        this.logger.warn(`⚠️ ${failedItem.ativo.ticker}: Máximo de tentativas (${MAX_RETRY_ATTEMPTS}) atingido. Desistindo.`);
        results.push({ ticker: failedItem.ativo.ticker, success: false });
        // Mantém na lista de falhas para referência
        this.failedAtivos.push(failedItem);
        continue;
      }

      // Aguarda intervalo maior entre retries
      if (i > 0) {
        await this.delay(RETRY_INTERVAL_MS);
      }

      const result = await this.tryUpdateAtivo(
        failedItem.ativo, 
        i, 
        ativosParaRetry.length, 
        true,
        failedItem.retryCount + 1
      );
      
      if (result.success) {
        results.push({ ticker: failedItem.ativo.ticker, success: true });
      } else {
        results.push({ ticker: failedItem.ativo.ticker, success: false });
        // Adiciona de volta à lista de falhas com contador incrementado
        this.failedAtivos.push({
          ...failedItem,
          retryCount: failedItem.retryCount + 1,
          errorCode: result.errorCode || failedItem.errorCode,
          errorMessage: result.errorMessage || failedItem.errorMessage,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Atualiza os preços de todos os ativos no banco de dados
   * Faz uma requisição por ativo com intervalo entre elas (plano free)
   * Inclui retry automático para ativos com falha
   */
  async updateAllPrices(): Promise<UpdateResult> {
    const result: UpdateResult = { 
      updated: 0, 
      failed: 0, 
      total: 0, 
      failedTickers: [],
      retriedTickers: []
    };

    try {
      // Limpa falhas anteriores no início de uma nova atualização completa
      this.clearFailedAtivos();
      
      // Buscar todos os ativos do banco
      const ativos = await this.ativoRepository.find();
      result.total = ativos.length;

      if (ativos.length === 0) {
        this.logger.log('Nenhum ativo encontrado para atualizar.');
        return result;
      }

      this.logger.log(`📊 Iniciando atualização de ${ativos.length} ativos (intervalo: ${REQUEST_INTERVAL_MS}ms entre requisições)`);

      // Primeira passagem - tenta atualizar todos
      for (let i = 0; i < ativos.length; i++) {
        const ativo = ativos[i];
        
        const updateResult = await this.tryUpdateAtivo(ativo, i, ativos.length);
        
        if (updateResult.success) {
          result.updated++;
        } else {
          result.failed++;
          result.failedTickers.push(ativo.ticker);
          
          // Adiciona à lista de falhas para retry (apenas erros 500 ou erros de rede)
          if (updateResult.errorCode === 500 || !updateResult.errorCode) {
            this.failedAtivos.push({
              ativo,
              errorCode: updateResult.errorCode || 0,
              errorMessage: updateResult.errorMessage || 'Erro desconhecido',
              timestamp: new Date(),
              retryCount: 0,
            });
          }
        }

        // Aguardar intervalo antes da próxima requisição (exceto na última)
        if (i < ativos.length - 1) {
          await this.delay(REQUEST_INTERVAL_MS);
        }
      }

      // Segunda passagem - retry dos que falharam
      if (this.failedAtivos.length > 0) {
        this.logger.log(`\n⏳ Aguardando 5 segundos antes de iniciar retries...`);
        await this.delay(5000);
        
        const retryResults = await this.retryFailedAtivos();
        result.retriedTickers = retryResults;
        
        // Atualiza contadores com resultados do retry
        for (const retryResult of retryResults) {
          if (retryResult.success) {
            result.updated++;
            result.failed--;
            // Remove do array de failedTickers
            const idx = result.failedTickers.indexOf(retryResult.ticker);
            if (idx > -1) {
              result.failedTickers.splice(idx, 1);
            }
          }
        }
      }

      // Log final detalhado
      this.logger.log(`\n🏁 ========== RESUMO DA ATUALIZAÇÃO ==========`);
      this.logger.log(`📊 Total de ativos: ${result.total}`);
      this.logger.log(`✅ Atualizados com sucesso: ${result.updated}`);
      this.logger.log(`❌ Falhas: ${result.failed}`);
      
      if (result.failedTickers.length > 0) {
        this.logger.warn(`⚠️ Ativos com falha: ${result.failedTickers.join(', ')}`);
      }
      
      if (result.retriedTickers.length > 0) {
        const retriedSuccess = result.retriedTickers.filter(r => r.success).map(r => r.ticker);
        const retriedFailed = result.retriedTickers.filter(r => !r.success).map(r => r.ticker);
        
        if (retriedSuccess.length > 0) {
          this.logger.log(`🔄 Recuperados via retry: ${retriedSuccess.join(', ')}`);
        }
        if (retriedFailed.length > 0) {
          this.logger.warn(`🔄 Falha persistente após retry: ${retriedFailed.join(', ')}`);
        }
      }
      
      this.logger.log(`============================================\n`);
      
    } catch (error) {
      this.logger.error(`Erro na atualização de preços: ${error.message}`);
    }

    return result;
  }

  /**
   * Cron job: Atualiza preços às 14:00 de segunda a sexta
   * Formato: segundo minuto hora dia mês diaDaSemana
   */
  @Cron('0 0 14 * * 1-5', {
    name: 'update-prices-14h',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCron14h() {
    this.logger.log('⏰ Cron 14h: Iniciando atualização de preços...');
    await this.updateAllPrices();
  }

  /**
   * Cron job: Atualiza preços às 18:00 de segunda a sexta
   */
  @Cron('0 0 18 * * 1-5', {
    name: 'update-prices-18h',
    timeZone: 'America/Sao_Paulo',
  })
  async handleCron18h() {
    this.logger.log('⏰ Cron 18h: Iniciando atualização de preços...');
    await this.updateAllPrices();
  }

  /**
   * Método manual para forçar atualização (útil para testes)
   */
  async forceUpdate(): Promise<UpdateResult> {
    this.logger.log('🔄 Atualização manual de preços solicitada...');
    return this.updateAllPrices();
  }

  /**
   * Método para forçar retry apenas dos ativos que falharam
   * Útil para chamada manual via endpoint
   */
  async retryFailed(): Promise<{ retriedTickers: { ticker: string; success: boolean }[]; remainingFailed: string[] }> {
    this.logger.log('🔄 Retry manual de ativos com falha solicitado...');
    
    if (this.failedAtivos.length === 0) {
      this.logger.log('✅ Nenhum ativo com falha para retry.');
      return { retriedTickers: [], remainingFailed: [] };
    }
    
    const retriedTickers = await this.retryFailedAtivos();
    const remainingFailed = this.failedAtivos.map(f => f.ativo.ticker);
    
    return { retriedTickers, remainingFailed };
  }

  /**
   * Retorna estatísticas dos ativos com falha
   */
  getFailedStats(): { 
    count: number; 
    tickers: string[]; 
    details: { ticker: string; errorCode: number; errorMessage: string; retryCount: number; lastAttempt: Date }[] 
  } {
    return {
      count: this.failedAtivos.length,
      tickers: this.failedAtivos.map(f => f.ativo.ticker),
      details: this.failedAtivos.map(f => ({
        ticker: f.ativo.ticker,
        errorCode: f.errorCode,
        errorMessage: f.errorMessage,
        retryCount: f.retryCount,
        lastAttempt: f.timestamp,
      })),
    };
  }
}
