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

// Intervalo entre requisições (em ms) - 1.5 segundos para respeitar rate limit do plano free
const REQUEST_INTERVAL_MS = 1500;

@Injectable()
export class BrapiService {
  private readonly logger = new Logger(BrapiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://brapi.dev/api';

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
   * Busca cotação de um único ativo na BRAPI (plano free)
   */
  async getQuote(ticker: string): Promise<number | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/quote/${ticker}?token=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        this.logger.error(`BRAPI Error for ${ticker}: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: BrapiQuoteResponse = await response.json();
      
      if (data.results && data.results.length > 0 && data.results[0].regularMarketPrice) {
        return data.results[0].regularMarketPrice;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Erro ao buscar cotação de ${ticker}: ${error.message}`);
      return null;
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Atualiza os preços de todos os ativos no banco de dados
   * Faz uma requisição por ativo com intervalo entre elas (plano free)
   */
  async updateAllPrices(): Promise<{ updated: number; failed: number; total: number }> {
    const result = { updated: 0, failed: 0, total: 0 };

    try {
      // Buscar todos os ativos do banco
      const ativos = await this.ativoRepository.find();
      result.total = ativos.length;

      if (ativos.length === 0) {
        this.logger.log('Nenhum ativo encontrado para atualizar.');
        return result;
      }

      this.logger.log(`📊 Iniciando atualização de ${ativos.length} ativos (intervalo: ${REQUEST_INTERVAL_MS}ms entre requisições)`);

      for (let i = 0; i < ativos.length; i++) {
        const ativo = ativos[i];
        
        try {
          const price = await this.getQuote(ativo.ticker);
          
          if (price !== null) {
            await this.ativoRepository.update(ativo.id, {
              precoAtual: price,
            });
            result.updated++;
            this.logger.log(`✅ [${i + 1}/${ativos.length}] ${ativo.ticker}: R$ ${price.toFixed(2)}`);
          } else {
            result.failed++;
            this.logger.warn(`❌ [${i + 1}/${ativos.length}] ${ativo.ticker}: Falha ao obter preço`);
          }
        } catch (updateError) {
          this.logger.error(`❌ [${i + 1}/${ativos.length}] ${ativo.ticker}: ${updateError.message}`);
          result.failed++;
        }

        // Aguardar intervalo antes da próxima requisição (exceto na última)
        if (i < ativos.length - 1) {
          await this.delay(REQUEST_INTERVAL_MS);
        }
      }

      this.logger.log(`🏁 Atualização concluída: ${result.updated}/${result.total} ativos atualizados, ${result.failed} falhas`);
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
  async forceUpdate(): Promise<{ updated: number; failed: number; total: number }> {
    this.logger.log('🔄 Atualização manual de preços solicitada...');
    return this.updateAllPrices();
  }
}
