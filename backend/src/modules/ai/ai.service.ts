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
    this.isConfigured = !!apiKey;
    if (this.isConfigured) {
      this.groq = new Groq({ apiKey });
    }
  }

  /**
   * Limpeza via Regex para aumentar taxa de acerto do cache sem gastar IA
   */
  private preClean(description: string): string {
    return description
      .toUpperCase()
      .replace(/\d{2}\/\d{2}/g, '') // Datas
      .replace(/\*/g, ' ')          // Asteriscos
      .replace(/-/g, ' ')           // Hífens
      .replace(/\d{10,}/g, '')      // Números longos
      .replace(/\s+/g, ' ')         // Espaços duplos
      .trim();
  }

  async categorizeTransaction(descriptionRaw: string): Promise<CategorizationResult> {
    const fastClean = this.preClean(descriptionRaw);

    //Tentar Cache primeiro
    const cached = await this.cacheRepository.findOne({
      where: { descriptionClean: fastClean },
      relations: ['category'],
    });

    if (cached) {
      this.logger.debug(`Cache Hit: ${fastClean}`);
      await this.cacheRepository.update(cached.id, { 
        occurrenceCount: cached.occurrenceCount + 1 
      });
      return {
        categoryId: cached.categoryId,
        descriptionClean: fastClean,
        confidence: Number(cached.confidenceScore),
      };
    }

    // 2. Se falhar, chamar IA
    return this.processWithAI(descriptionRaw, fastClean);
  }

  private async processWithAI(raw: string, fastClean: string): Promise<CategorizationResult> {
    if (!this.isConfigured) return this.fallback(fastClean);

    const categories = await this.categoryRepository.find();
    const categoryNames = categories.map(c => c.name);

    const prompt = `Analise a transação: "${raw}"
    Categorias aceitas: [${categoryNames.join(', ')}]
    
    Responda EXATAMENTE no formato JSON:
    {
      "merchant": "Nome limpo do estabelecimento",
      "category": "Nome da categoria idêntico à lista",
      "confidence": 0.9
    }`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Você é um classificador de finanças. Responda apenas JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama3-8b-8192', // Mais rápido e barato para JSON simples
        response_format: { type: 'json_object' },
        temperature: 0.1, // Menos criatividade, mais precisão
      });

      const res = JSON.parse(completion.choices[0].message.content);
      
      // Valida se a categoria retornada existe no seu banco
      let category = categories.find(c => c.name.toLowerCase() === res.category.toLowerCase());
      if (!category) category = categories.find(c => c.name === 'Outras');

      const finalDescription = res.merchant.toUpperCase() || fastClean;

      // 3. Salvar no Cache para futuras transações idênticas
      await this.cacheRepository.upsert({
        descriptionClean: fastClean, // Chave do cache é a versão pré-limpa
        categoryId: category.id,
        confidenceScore: res.confidence || 0.8,
        occurrenceCount: 1,
        isGlobal: false,
      }, ['descriptionClean']);

      return {
        categoryId: category.id,
        descriptionClean: finalDescription,
        confidence: res.confidence || 0.8,
      };

    } catch (error) {
      this.logger.error(`AI Error: ${error.message}`);
      return this.fallback(fastClean);
    }
  }

  private async fallback(clean: string): Promise<CategorizationResult> {
    const other = await this.categoryRepository.findOne({ where: { name: 'Outras' } });
    return {
      categoryId: other?.id,
      descriptionClean: clean,
      confidence: 0.1,
    };
  }
}