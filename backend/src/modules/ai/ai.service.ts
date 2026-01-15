import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Groq from 'groq-sdk';
import { AiCategoryCache } from './entities/ai-category-cache.entity';
import { Category } from '../categories/entities/category.entity';

interface CategorizationResult {
  categoryId: string;
  descriptionClean: string;
  confidence: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private groq: Groq;
  private isConfigured: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiCategoryCache)
    private cacheRepository: Repository<AiCategoryCache>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not configured. AI features disabled.');
      this.isConfigured = false;
      return;
    }
    
    this.groq = new Groq({ apiKey });
    this.isConfigured = true;
  }

  /**
   * Limpa e normaliza a descrição da transação
   */
  async cleanDescription(rawDescription: string): Promise<string> {
    if (!this.isConfigured) {
      return rawDescription.trim();
    }

    try {
      const prompt = `Você é um assistente que limpa descrições de transações bancárias.
      
Regras:
- Remover códigos, datas, números de estabelecimento
- Manter apenas o nome do estabelecimento ou categoria
- Responder SOMENTE com o texto limpo, sem explicações

Descrição: "${rawDescription}"
Texto limpo:`;

      const message = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        max_tokens: 100,
      });
      
      const cleanText = (message.choices[0]?.message?.content || rawDescription).trim();
      this.logger.debug(`Cleaned: "${rawDescription}" -> "${cleanText}"`);
      return cleanText;
    } catch (error) {
      this.logger.error('Error cleaning description:', error.message);
      return rawDescription.trim();
    }
  }

  /**
   * Categoriza uma transação usando cache primeiro, depois IA
   */
  async categorizeTransaction(
    descriptionRaw: string,
    userId?: string,
  ): Promise<CategorizationResult> {
    // 1. Limpar descrição
    const descriptionClean = await this.cleanDescription(descriptionRaw);

    // 2. Verificar cache
    const cached = await this.cacheRepository.findOne({
      where: { descriptionClean },
      relations: ['category'],
    });

    if (cached) {
      // Incrementar contador de uso
      cached.occurrenceCount += 1;
      await this.cacheRepository.save(cached);

      this.logger.debug(`Cache hit for: ${descriptionClean}`);
      return {
        categoryId: cached.categoryId,
        descriptionClean,
        confidence: cached.confidenceScore || 0.95,
      };
    }

    // 3. Usar IA para categorizar
    return this.categorizeWithAI(descriptionClean);
  }

  /**
   * Categoriza usando IA e salva no cache
   */
  private async categorizeWithAI(
    descriptionClean: string,
  ): Promise<CategorizationResult> {
    if (!this.isConfigured) {
      throw new Error('AI not configured');
    }

    const categories = await this.categoryRepository.find();
    const categoryList = categories.map((c) => c.name).join(', ');

    try {
      const prompt = `Você é um especialista em categorização de despesas pessoais.

Categorias disponíveis: ${categoryList}

Regras:
- Analise a descrição da transação
- Escolha a categoria mais apropriada da lista
- Responda APENAS com o nome exato da categoria
- Se não tiver certeza, escolha "Outras"

Descrição: "${descriptionClean}"
Categoria:`;

      const message = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        max_tokens: 50,
      });
      
      const categoryName = (message.choices[0]?.message?.content || '').trim();

      // Encontrar categoria
      let category = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      );

      if (!category) {
        category = categories.find((c) => c.name === 'Outras');
      }

      if (!category) {
        throw new Error('No valid category found');
      }

      // Salvar no cache
      const cache = this.cacheRepository.create({
        descriptionClean,
        categoryId: category.id,
        confidenceScore: 0.85,
        occurrenceCount: 1,
        isGlobal: false,
      });
      await this.cacheRepository.save(cache);

      this.logger.debug(`AI categorized: ${descriptionClean} -> ${categoryName}`);

      return {
        categoryId: category.id,
        descriptionClean,
        confidence: 0.85,
      };
    } catch (error) {
      this.logger.error('Error in AI categorization:', error.message);
      
      // Fallback: categoria "Outras"
      const fallbackCategory = categories.find((c) => c.name === 'Outras');
      return {
        categoryId: fallbackCategory?.id || categories[0].id,
        descriptionClean,
        confidence: 0.3,
      };
    }
  }

  /**
   * Gera relatório financeiro mensal usando IA
   */
  async generateMonthlyReport(data: {
    totalIncome: number;
    totalExpenses: number;
    topCategories: Array<{ category: string; amount: number }>;
    netWorth: number;
  }): Promise<string> {
    if (!this.isConfigured) {
      return 'AI not configured for reports.';
    }

    try {
      const prompt = `Você é um analista financeiro pessoal.

Dados do mês:
- Receitas: R$ ${data.totalIncome.toFixed(2)}
- Despesas: R$ ${data.totalExpenses.toFixed(2)}
- Patrimônio Líquido: R$ ${data.netWorth.toFixed(2)}
- Principais gastos: ${data.topCategories.map((c) => `${c.category} (R$ ${c.amount.toFixed(2)})`).join(', ')}

Gere um relatório breve (3-4 parágrafos) com:
1. Resumo do mês
2. Insights sobre os gastos
3. Sugestões de melhoria

Use tom profissional mas acessível.`;

      const message = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        max_tokens: 500,
      });
      
      return message.choices[0]?.message?.content || 'Erro ao gerar relatório.';
    } catch (error) {
      this.logger.error('Error generating report:', error.message);
      return 'Erro ao gerar relatório.';
    }
  }
}
