import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import Groq from 'groq-sdk';
import { AiCategoryCache } from './entities/ai-category-cache.entity';
import { Category } from '../categories/entities/category.entity';

interface CategorizationResult {
  categoryId: string;
  descriptionClean: string;
  confidence: number;
}

interface FinancialKPIs {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  topExpenseCategories: { name: string; amount: number; percentage: number }[];
  portfolioValue: number;
  portfolioProfitLoss: number;
  portfolioProfitLossPercentage: number;
  portfolioDistribution: { tipo: string; value: number; percentage: number }[];
  assets: {
    ticker: string;
    nome: string;
    tipo: string;
    quantidade: number;
    precoMedio: number;
    precoAtual: number;
    valorTotal: number;
    lucroPerda: number;
    lucroPerdaPercentual: number;
  }[];
  totalAssets: number;
  periodStart: string;
  periodEnd: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIInsight {
  id: string;
  tipo: 'alerta' | 'oportunidade' | 'info';
  titulo: string;
  descricao: string;
  valor?: string;
}

interface AIRiskAnalysis {
  id: string;
  nivel: 'baixo' | 'medio' | 'alto';
  titulo: string;
  descricao: string;
}

interface AIInitialInsights {
  alertas: AIInsight[];
  analiseRisco: AIRiskAnalysis[];
  sugestoes: AIInsight[];
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
   * Remove elementos variáveis que não afetam a categorização
   */
  private preClean(description: string): string {
    return description
      .toUpperCase()
      .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')  // Datas (DD/MM ou DD/MM/YYYY)
      .replace(/\*+/g, ' ')                       // Asteriscos (UBER* TRIP)
      .replace(/-+/g, ' ')                        // Hífens
      .replace(/\d{10,}/g, '')                    // Números longos (CNPJs, etc)
      .replace(/\d+[A-Z]*\d+/g, '')               // Códigos alfanuméricos
      .replace(/\b\d{4}\b/g, '')                  // 4 dígitos (final cartão)
      .replace(/PARCELA?\s*\d+\/\d+/gi, '')       // Parcela X/Y
      .replace(/\b(PAG|PAGTO|PAGAMENTO)\b/gi, '') // Prefixos de pagamento
      .replace(/\bCOMP\s*\d+/gi, '')              // COMP seguido de números
      .replace(/\s+/g, ' ')                       // Espaços múltiplos
      .trim();
  }

  async categorizeTransaction(descriptionRaw: string, userId?: string): Promise<CategorizationResult> {
    const fastClean = this.preClean(descriptionRaw);
    
    this.logger.debug(`Categorizando: raw="${descriptionRaw}" clean="${fastClean}" userId=${userId || 'N/A'}`);

    // 1. PRIORIDADE 1: Cache do usuário específico (se userId fornecido)
    if (userId) {
      const userCache = await this.cacheRepository.findOne({
        where: { descriptionClean: fastClean, userId },
        relations: ['category'],
      });

      this.logger.debug(`User cache search: found=${!!userCache} descClean="${fastClean}" userId="${userId}"`);

      if (userCache) {
        this.logger.log(`✅ User Cache Hit: "${fastClean}" -> ${userCache.category?.name} (user: ${userId})`);
        await this.cacheRepository.update(userCache.id, { 
          occurrenceCount: userCache.occurrenceCount + 1 
        });
        return {
          categoryId: userCache.categoryId,
          descriptionClean: fastClean,
          confidence: userCache.isUserDefined ? 1.0 : Number(userCache.confidenceScore),
        };
      }
    }

    // 2. PRIORIDADE 2: Cache global (userId = null)
    const globalCache = await this.cacheRepository.findOne({
      where: { descriptionClean: fastClean, userId: IsNull() },
      relations: ['category'],
    });

    this.logger.debug(`Global cache search: found=${!!globalCache} descClean="${fastClean}"`);

    if (globalCache) {
      this.logger.log(`✅ Global Cache Hit: "${fastClean}" -> ${globalCache.category?.name}`);
      await this.cacheRepository.update(globalCache.id, { 
        occurrenceCount: globalCache.occurrenceCount + 1 
      });
      return {
        categoryId: globalCache.categoryId,
        descriptionClean: fastClean,
        confidence: Number(globalCache.confidenceScore),
      };
    }

    // 3. PRIORIDADE 3: Chamar IA
    return this.processWithAI(descriptionRaw, fastClean);
  }

  /**
   * Salva a preferência de categoria do usuário no cache
   * Chamado quando o usuário altera manualmente a categoria de uma transação
   */
  async saveUserCategoryPreference(
    userId: string,
    descriptionRaw: string,
    categoryId: string,
  ): Promise<void> {
    const fastClean = this.preClean(descriptionRaw);
    
    this.logger.log(`💾 Salvando preferência: raw="${descriptionRaw}" clean="${fastClean}" userId="${userId}" categoryId="${categoryId}"`);

    // Verificar se já existe cache para este usuário + descrição
    const existing = await this.cacheRepository.findOne({
      where: { descriptionClean: fastClean, userId },
    });

    if (existing) {
      // Atualizar existente
      await this.cacheRepository.update(existing.id, {
        categoryId,
        confidenceScore: 1.0,
        isUserDefined: true,
        occurrenceCount: existing.occurrenceCount + 1,
      });
      this.logger.log(`✅ User cache UPDATED: "${fastClean}" -> ${categoryId} (userId: ${userId})`);
    } else {
      // Criar novo
      await this.cacheRepository.save({
        descriptionClean: fastClean,
        userId,
        categoryId,
        confidenceScore: 1.0,
        isUserDefined: true,
        occurrenceCount: 1,
      });
      this.logger.log(`✅ User cache CREATED: "${fastClean}" -> ${categoryId} (userId: ${userId})`);
    }
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
        model: 'llama-3.1-8b-instant', // Mais rápido e barato para JSON simples
        response_format: { type: 'json_object' },
        temperature: 0.1, // Menos criatividade, mais precisão
      });

      const res = JSON.parse(completion.choices[0].message.content);
      
      // Valida se a categoria retornada existe no seu banco
      let category = categories.find(c => c.name.toLowerCase() === res.category.toLowerCase());
      if (!category) category = categories.find(c => c.name === 'Outras');

      const finalDescription = res.merchant.toUpperCase() || fastClean;

      // 3. Salvar no Cache GLOBAL para futuras transações idênticas
      await this.cacheRepository.upsert({
        descriptionClean: fastClean, // Chave do cache é a versão pré-limpa
        userId: null, // Cache global
        categoryId: category.id,
        confidenceScore: res.confidence || 0.8,
        occurrenceCount: 1,
        isUserDefined: false,
      }, ['descriptionClean', 'userId']);

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

  /**
   * Chat com IA para responder perguntas sobre finanças
   */
  async chat(message: string, kpis: FinancialKPIs, conversationHistory: ChatMessage[] = []): Promise<{ response: string }> {
    if (!this.isConfigured) {
      return { response: 'Desculpe, o serviço de IA não está configurado no momento.' };
    }

    this.logger.debug(`Chat KPIs recebidos: Income=${kpis.totalIncome}, Expenses=${kpis.totalExpenses}, Transactions=${kpis.transactionCount}, Assets=${kpis.totalAssets}`);

    // Formatar lista de ativos
    const assetsInfo = kpis.assets && kpis.assets.length > 0
      ? kpis.assets.map(a => 
          `  • ${a.ticker} (${a.nome}): ${a.quantidade} unidades, PM R$ ${a.precoMedio.toFixed(2)}, Atual R$ ${a.precoAtual.toFixed(2)}, ${a.lucroPerda >= 0 ? '+' : ''}R$ ${a.lucroPerda.toFixed(2)} (${a.lucroPerdaPercentual.toFixed(2)}%)`
        ).join('\n')
      : 'Nenhum ativo na carteira';

    const systemPrompt = `Você é um assistente financeiro pessoal amigável e experiente.
Você tem acesso aos seguintes dados financeiros do usuário:

RESUMO DOS ÚLTIMOS 30 DIAS:
- Receitas totais: R$ ${kpis.totalIncome.toFixed(2)}
- Despesas totais: R$ ${kpis.totalExpenses.toFixed(2)}
- Saldo do período: R$ ${kpis.balance.toFixed(2)}
- Total de transações: ${kpis.transactionCount}
- Maiores categorias de gastos: ${kpis.topExpenseCategories.map(c => `${c.name} (R$ ${c.amount.toFixed(2)} - ${c.percentage.toFixed(1)}%)`).join(', ') || 'Nenhuma'}

CARTEIRA DE INVESTIMENTOS:
- Valor total: R$ ${kpis.portfolioValue.toFixed(2)}
- Lucro/Prejuízo total: R$ ${kpis.portfolioProfitLoss.toFixed(2)} (${kpis.portfolioProfitLossPercentage.toFixed(2)}%)
- Total de ativos: ${kpis.totalAssets}
- Distribuição por tipo: ${kpis.portfolioDistribution.map(d => `${d.tipo}: ${d.percentage.toFixed(1)}%`).join(', ') || 'Nenhuma'}

ATIVOS NA CARTEIRA (detalhado):
${assetsInfo}

Regras:
1. Responda de forma concisa e direta
2. Use os dados financeiros quando relevante
3. Dê sugestões práticas e personalizadas
4. Seja amigável mas profissional
5. Responda em português brasileiro
6. Quando perguntado sobre ativos específicos, use os dados detalhados acima`;

    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-5).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ];

      const completion = await this.groq.chat.completions.create({
        messages,
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 500,
      });

      return { response: completion.choices[0].message.content || 'Desculpe, não consegui processar sua mensagem.' };
    } catch (error) {
      this.logger.error(`Chat Error: ${error.message}`);
      return { response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.' };
    }
  }

  /**
   * Gera insights iniciais baseados nas KPIs usando IA
   */
  async generateInsights(kpis: FinancialKPIs): Promise<AIInitialInsights> {
    // Se a IA não estiver configurada, usar fallback local
    if (!this.isConfigured) {
      return this.generateLocalInsights(kpis);
    }

    // Formatar lista de ativos detalhada para o prompt
    const assetsDetailed = kpis.assets && kpis.assets.length > 0
      ? kpis.assets.map(a => 
          `• ${a.ticker} (${a.nome}, ${a.tipo}): ${a.quantidade} cotas, Preço Médio R$${a.precoMedio.toFixed(2)}, Preço Atual R$${a.precoAtual.toFixed(2)}, Resultado: ${a.lucroPerda >= 0 ? '+' : ''}R$${a.lucroPerda.toFixed(2)} (${a.lucroPerdaPercentual >= 0 ? '+' : ''}${a.lucroPerdaPercentual.toFixed(1)}%)`
        ).join('\n')
      : 'Nenhum ativo na carteira';

    // Identificar ativos em alta e em baixa
    const ativosEmAlta = kpis.assets?.filter(a => a.lucroPerdaPercentual > 5) || [];
    const ativosEmBaixa = kpis.assets?.filter(a => a.lucroPerdaPercentual < -5) || [];
    const ativosMaiorPosicao = [...(kpis.assets || [])].sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 3);

    const prompt = `Você é um consultor financeiro pessoal. Analise a carteira e finanças do usuário e gere insights ESPECÍFICOS e PERSONALIZADOS.

DADOS FINANCEIROS (últimos 30 dias):
- Receitas: R$ ${kpis.totalIncome.toFixed(2)}
- Despesas: R$ ${kpis.totalExpenses.toFixed(2)}
- Saldo do período: R$ ${kpis.balance.toFixed(2)}
- Total de transações: ${kpis.transactionCount}
- Maiores categorias de gastos: ${kpis.topExpenseCategories.map(c => `${c.name} (R$${c.amount.toFixed(2)} - ${c.percentage.toFixed(0)}%)`).join(', ') || 'Nenhum registro'}

CARTEIRA DE INVESTIMENTOS:
- Valor total investido: R$ ${kpis.portfolioValue.toFixed(2)}
- Resultado total: ${kpis.portfolioProfitLoss >= 0 ? '+' : ''}R$ ${kpis.portfolioProfitLoss.toFixed(2)} (${kpis.portfolioProfitLossPercentage.toFixed(1)}%)
- Quantidade de ativos: ${kpis.totalAssets}
- Distribuição: ${kpis.portfolioDistribution.map(d => `${d.tipo}: ${d.percentage.toFixed(0)}%`).join(', ') || 'N/A'}

DETALHAMENTO DOS ATIVOS:
${assetsDetailed}

${ativosEmAlta.length > 0 ? `ATIVOS EM ALTA (>5%): ${ativosEmAlta.map(a => `${a.ticker} (+${a.lucroPerdaPercentual.toFixed(1)}%)`).join(', ')}` : ''}
${ativosEmBaixa.length > 0 ? `ATIVOS EM BAIXA (<-5%): ${ativosEmBaixa.map(a => `${a.ticker} (${a.lucroPerdaPercentual.toFixed(1)}%)`).join(', ')}` : ''}
${ativosMaiorPosicao.length > 0 ? `MAIORES POSIÇÕES: ${ativosMaiorPosicao.map(a => `${a.ticker} (R$${a.valorTotal.toFixed(2)})`).join(', ')}` : ''}

Retorne APENAS um JSON válido com esta estrutura:
{
  "alertas": [
    {"id": "1", "tipo": "alerta|oportunidade", "titulo": "título", "descricao": "descrição", "valor": "R$ X ou null"}
  ],
  "analiseRisco": [
    {"id": "1", "nivel": "baixo|medio|alto", "titulo": "título", "descricao": "descrição"}
  ],
  "sugestoes": [
    {"id": "1", "tipo": "info|oportunidade", "titulo": "título", "descricao": "descrição", "valor": "R$ X ou null"}
  ]
}

REGRAS IMPORTANTES:
1. Máximo: 3 alertas, 2 análises de risco, 3 sugestões
2. SUGESTÕES DEVEM SER ESPECÍFICAS para os ativos do usuário:
   - Mencione os tickers específicos (ex: "PETR4", "HGLG11")
   - Sugira ações concretas baseadas no desempenho de cada ativo
   - Se um ativo está em alta, sugira realizar lucros parciais ou manter
   - Se um ativo está em baixa, sugira avaliar fundamentos ou fazer preço médio
   - Analise a concentração da carteira e sugira diversificação se necessário
3. NÃO seja genérico. Use os dados reais fornecidos.
4. Responda em português brasileiro`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Você é um consultor financeiro experiente. Gere insights específicos e personalizados baseados nos ativos reais do usuário. Responda APENAS com JSON válido, sem markdown.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0].message.content || '';
      
      // Tentar extrair JSON da resposta
      let jsonStr = responseText.trim();
      
      // Remover possíveis marcadores de código
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      
      return {
        alertas: parsed.alertas || [],
        analiseRisco: parsed.analiseRisco || [],
        sugestoes: parsed.sugestoes || [],
      };
    } catch (error) {
      this.logger.error(`Insights Error: ${error.message}`);
      // Fallback para geração local se a IA falhar
      return this.generateLocalInsights(kpis);
    }
  }

  /**
   * Gera insights localmente (fallback)
   */
  private generateLocalInsights(kpis: FinancialKPIs): AIInitialInsights {
    const alertas: AIInsight[] = [];
    const analiseRisco: AIRiskAnalysis[] = [];
    const sugestoes: AIInsight[] = [];

    // Alertas baseados em gastos
    if (kpis.topExpenseCategories.length > 0) {
      const topCategory = kpis.topExpenseCategories[0];
      if (topCategory.percentage > 30) {
        alertas.push({
          id: '1',
          tipo: 'alerta',
          titulo: `Gastos com ${topCategory.name} Acima da Média`,
          descricao: `${topCategory.percentage.toFixed(0)}% dos seus gastos estão concentrados em ${topCategory.name}. Considere revisar esses gastos.`,
          valor: `R$ ${topCategory.amount.toFixed(2)}`,
        });
      }
    }

    // Oportunidade de economia
    if (kpis.totalExpenses > kpis.totalIncome * 0.7) {
      const potencialEconomia = kpis.totalExpenses * 0.1;
      alertas.push({
        id: '2',
        tipo: 'oportunidade',
        titulo: 'Oportunidade de Economia',
        descricao: 'Seus gastos representam mais de 70% da sua renda. Reduzindo 10% das despesas, você poderia economizar.',
        valor: `R$ ${potencialEconomia.toFixed(2)}`,
      });
    }

    // Saldo negativo
    if (kpis.balance < 0) {
      alertas.push({
        id: '3',
        tipo: 'alerta',
        titulo: 'Saldo Negativo no Período',
        descricao: `Você gastou mais do que recebeu nos últimos 30 dias. Déficit de R$ ${Math.abs(kpis.balance).toFixed(2)}.`,
      });
    }

    // Análise de risco da carteira
    if (kpis.portfolioValue > 0) {
      if (kpis.portfolioDistribution.length === 1) {
        analiseRisco.push({
          id: '1',
          nivel: 'medio',
          titulo: 'Concentração em um Tipo de Ativo',
          descricao: `100% da sua carteira está em ${kpis.portfolioDistribution[0].tipo}. Considere diversificar.`,
        });
      } else if (kpis.portfolioDistribution.length > 1) {
        analiseRisco.push({
          id: '2',
          nivel: 'baixo',
          titulo: 'Boa Diversificação entre Ativos',
          descricao: 'Sua carteira está diversificada entre diferentes tipos de ativos.',
        });
      }

      const maiorConcentracao = kpis.portfolioDistribution.find(d => d.percentage > 70);
      if (maiorConcentracao) {
        analiseRisco.push({
          id: '3',
          nivel: 'medio',
          titulo: `Alta Concentração em ${maiorConcentracao.tipo}`,
          descricao: `${maiorConcentracao.percentage.toFixed(0)}% da sua carteira está em ${maiorConcentracao.tipo}. Considere rebalancear.`,
        });
      }
    } else {
      analiseRisco.push({
        id: '4',
        nivel: 'medio',
        titulo: 'Sem Investimentos Registrados',
        descricao: 'Você ainda não possui investimentos na carteira. Considere começar a investir.',
      });
    }

    // Sugestões personalizadas
    if (kpis.balance > 0) {
      sugestoes.push({
        id: '1',
        tipo: 'info',
        titulo: 'Invista seu Saldo Positivo',
        descricao: `Você teve um saldo positivo de R$ ${kpis.balance.toFixed(2)}. Considere investir parte desse valor.`,
        valor: `R$ ${kpis.balance.toFixed(2)}`,
      });
    }

    if (kpis.portfolioValue > 0 && kpis.portfolioProfitLoss > 0) {
      sugestoes.push({
        id: '2',
        tipo: 'oportunidade',
        titulo: 'Reinvista seus Ganhos',
        descricao: 'Seus investimentos estão com rendimento positivo. Considere reinvestir os ganhos.',
        valor: `+R$ ${kpis.portfolioProfitLoss.toFixed(2)}`,
      });
    }

    if (kpis.topExpenseCategories.length > 0) {
      sugestoes.push({
        id: '3',
        tipo: 'info',
        titulo: 'Monitore seus Maiores Gastos',
        descricao: `Monitore seus gastos com ${kpis.topExpenseCategories[0].name}, que representa sua maior categoria.`,
      });
    }

    if (kpis.transactionCount < 10) {
      sugestoes.push({
        id: '4',
        tipo: 'info',
        titulo: 'Registre mais Transações',
        descricao: 'Registre mais transações para uma análise mais precisa dos seus hábitos financeiros.',
      });
    } else {
      sugestoes.push({
        id: '5',
        tipo: 'info',
        titulo: 'Continue Assim!',
        descricao: 'Continue mantendo suas finanças organizadas. A consistência é a chave para o sucesso financeiro.',
      });
    }

    return { alertas, analiseRisco, sugestoes };
  }
}