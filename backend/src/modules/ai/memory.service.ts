import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserMemory } from './entities/user-memory.entity';
import Groq from 'groq-sdk';
import { ConfigService } from '@nestjs/config';

interface ExtractedFact {
  fact: string;
  category: string;
  context?: string;
  relevance: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  eventDate?: string;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private groq: Groq;
  private isConfigured: boolean;

  constructor(
    @InjectRepository(UserMemory)
    private readonly memoryRepository: Repository<UserMemory>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    this.isConfigured = !!apiKey;
    
    if (this.isConfigured) {
      this.groq = new Groq({ apiKey });
    } else {
      this.logger.warn('GROQ_API_KEY não configurada. Extração de memórias desabilitada.');
    }
  }

  /**
   * Extrai fatos relevantes de uma conversa usando IA
   */
  async extractRelevantFacts(
    userMessage: string,
    aiResponse: string,
  ): Promise<ExtractedFact[]> {
    if (!this.isConfigured) {
      return [];
    }

    const prompt = `Você é um assistente especializado em extrair informações ÚNICAS e IMPORTANTES de conversas financeiras.

CONVERSA:
Usuário: "${userMessage}"
Assistente: "${aiResponse}"

TAREFA: Extraia APENAS os fatos CONCRETOS e ESPECÍFICOS mencionados pelo USUÁRIO que sejam realmente úteis para lembrar em conversas futuras.

📌 EXTRAIR COM MODERAÇÃO - Foco em QUALIDADE, não quantidade:

✅ EXTRAIR (apenas fatos concretos e específicos):
- Dívidas reais com valor e contexto: "Tenho R$ 10.000 de dívida no cartão"
- Despesas emergenciais já ocorridas: "Gastei R$ 2.000 com conserto do carro"
- Planos concretos com data e valor: "Vou viajar no carnaval e gastarei R$ 3.000"
- Mudanças salariais: "Recebi promoção com aumento para R$ 5.000/mês"
- Objetivos claros com detalhes: "Quero comprar imóvel até 2028"
- Informações sobre dependentes: "Tenho 2 filhos"
- Situação profissional que impacta finança: "Sou freelancer"

❌ NÃO EXTRAIR (remove ruído):
- Perguntas genéricas: "Como investir?", "Quanto poupar?"
- Respostas da IA ou perguntas retóricas da IA
- Confirmações: "entendi", "ok", "certo"
- Informações derivadas/calculadas (percentuais, projeções)
- Oferecimento de ajuda ou frases motivacionais genéricas
- Fatos já implícitos no perfil
- Valores estimados ou aproximados ("uns R$ 1.000", "por volta de")
- Duplicatas ou variações do mesmo fato
- Frases genéricas da IA como explicações

📊 DETECÇÃO DE DUPLICATAS:
- Se já foi extraído "aporte de R$ 1.700 a R$ 2.200", NÃO EXTRAIA "aporte de R$ 1.500 a R$ 2.000"
- Se já foi extraído "carnaval custará R$ 1.000", NÃO EXTRAIA "viagem no carnaval com R$ 1.000"
- Se já foi extraído "dívida de R$ 2.000", NÃO EXTRAIA "duas dívidas pontuais de R$ 1.000 cada"

CATEGORIAS:
- emergency: Emergências, imprevistos (carro quebrou, doença)
- debt: Dívidas existentes (valores específicos)
- goal: Objetivos de médio/longo prazo
- plan: Planos específicos com data e valor
- finance: Mudanças de renda ou situação financeira
- personal: Informações pessoais relevantes (família, profissão)
- family: Dependentes, filhos, cônjuge
- career: Profissão, mudanças profissionais

RELEVÂNCIA ESTAR REALISTA:
- 95-100: Dívidas, emergências, planos imediatos (próximos 3 meses)
- 75-94: Objetivos próximos (6-12 meses), mudanças financeiras importantes
- 50-74: Objetivos de médio prazo, informações de contexto úteis
- 30-49: Detalhes secundários
- Menos de 30: NÃO EXTRAIR

SENTIMENTO:
- positive: Coisas boas (herança, promoção, conquista)
- negative: Problemas (dívida, gasto emergencial, perda)
- neutral: Fatos neutros

⚠️ IMPORTANTE:
- Responda APENAS com JSON válido
- Se houver dúvida, NÃO extraia (melhor ser conservador)
- Máximo 5-7 fatos por conversa (qualidade > quantidade)
- Cada fato deve ser único e não duplicar outros

FORMATO DE RESPOSTA:
{
  "facts": [
    {
      "fact": "Descrição concisa do fato (máx 150 caracteres)",
      "category": "categoria",
      "relevance": 85,
      "sentiment": "neutral"
    }
  ]
}`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em extrair fatos únicos e importantes. Seja SELETIVO - qualidade importa mais que quantidade. Extraia APENAS fatos concretos do usuário, ignorando respostas da IA. Responda APENAS com JSON válido, sem explicações.',
          },
          { role: 'user', content: prompt },
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 600,
      });

      const responseText = completion.choices[0].message.content || '';
      
      // Tentar extrair JSON
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonStr);
      
      if (parsed.facts && Array.isArray(parsed.facts) && parsed.facts.length > 0) {
        this.logger.log(`✅ Extraídos ${parsed.facts.length} fatos únicos:`);
        parsed.facts.forEach((fact, idx) => {
          this.logger.log(`   ${idx + 1}. [${fact.category}] ${fact.fact}`);
        });
        return parsed.facts;
      }

      this.logger.debug('Nenhum fato único extraído desta conversa (conversação genérica)');
      return [];
    } catch (error) {
      this.logger.error(`Erro ao extrair fatos: ${error.message}`);
      return [];
    }
  }

  /**
   * Calcula similaridade entre dois textos (0-1)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const s1 = text1.toLowerCase().trim();
    const s2 = text2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    
    // Verificar se um contém o outro
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Calcular palavras em comum
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const common = words1.filter(w => words2.includes(w)).length;
    const total = Math.max(words1.length, words2.length);
    
    return common / total;
  }

  /**
   * Salva fatos relevantes no banco de dados com deduplicação
   */
  async saveMemories(userId: string, facts: ExtractedFact[]): Promise<void> {
    if (!facts || facts.length === 0) {
      return;
    }

    try {
      // Buscar memórias existentes do usuário para detectar duplicatas
      const existingMemories = await this.memoryRepository.find({
        where: { userId, isActive: true },
      });

      // Filtrar fatos duplicados
      const uniqueFacts: ExtractedFact[] = [];
      for (const fact of facts) {
        // Verificar se este fato é similar a algum existente
        let isDuplicate = false;
        
        for (const existing of existingMemories) {
          const similarity = this.calculateSimilarity(fact.fact, existing.fact);
          if (similarity > 0.7) { // 70% de similaridade = duplicata
            this.logger.debug(`⚠️  Fato duplicado detectado: "${fact.fact}" similaridade ${(similarity * 100).toFixed(0)}%`);
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          uniqueFacts.push(fact);
        }
      }

      if (uniqueFacts.length === 0) {
        this.logger.debug('ℹ️  Todos os fatos extraídos são duplicatas de memórias existentes');
        return;
      }

      // Salvar apenas os fatos únicos
      const memories = uniqueFacts.map(fact => {
        const memory = this.memoryRepository.create({
          userId,
          fact: fact.fact,
          category: fact.category,
          context: fact.context,
          relevance: fact.relevance || 50,
          sentiment: fact.sentiment,
          eventDate: fact.eventDate ? new Date(fact.eventDate) : null,
        });
        return memory;
      });

      await this.memoryRepository.save(memories);
      this.logger.log(`💾 Salvos ${memories.length}/${facts.length} fatos únicos na memória do usuário ${userId.substring(0, 8)}...`);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar memórias: ${error.message}`);
    }
  }

  /**
   * Busca memórias relevantes do usuário
   */
  async getRelevantMemories(
    userId: string,
    limit: number = 10,
  ): Promise<UserMemory[]> {
    try {
      // Buscar memórias ativas, ordenadas por relevância e data
      const memories = await this.memoryRepository.find({
        where: {
          userId,
          isActive: true,
        },
        order: {
          relevance: 'DESC',
          createdAt: 'DESC',
        },
        take: limit,
      });

      return memories;
    } catch (error) {
      this.logger.error(`Erro ao buscar memórias: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca memórias recentes (últimos 30 dias)
   */
  async getRecentMemories(userId: string, days: number = 30): Promise<UserMemory[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

      const memories = await this.memoryRepository.find({
        where: {
          userId,
          isActive: true,
          createdAt: MoreThan(thirtyDaysAgo),
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return memories;
    } catch (error) {
      this.logger.error(`Erro ao buscar memórias recentes: ${error.message}`);
      return [];
    }
  }

  /**
   * Formata memórias para contexto da IA
   */
  formatMemoriesForContext(memories: UserMemory[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const formatted = memories.map(m => {
      const date = m.eventDate 
        ? ` (${m.eventDate.toLocaleDateString('pt-BR')})`
        : '';
      const sentiment = m.sentiment ? ` [${m.sentiment}]` : '';
      return `• ${m.fact}${date}${sentiment}`;
    }).join('\n');

    return `\n\n🧠 MEMÓRIAS IMPORTANTES DO USUÁRIO:\n${formatted}\n\nUse essas informações para personalizar ainda mais suas respostas e demonstrar que você lembra de conversas anteriores.`;
  }

  /**
   * Desativa uma memória (marca como não ativa)
   */
  async deactivateMemory(memoryId: string): Promise<void> {
    try {
      await this.memoryRepository.update(memoryId, { isActive: false });
    } catch (error) {
      this.logger.error(`Erro ao desativar memória: ${error.message}`);
    }
  }

  /**
   * Remove memórias antigas (opcional - manutenção)
   */
  async cleanOldMemories(userId: string, daysOld: number = 180): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.memoryRepository
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId })
        .andWhere('created_at < :cutoffDate', { cutoffDate })
        .andWhere('relevance < :relevance', { relevance: 30 })
        .execute();

      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Erro ao limpar memórias antigas: ${error.message}`);
      return 0;
    }
  }
}
