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

  /**
   * Mapeamento local de palavras-chave para categorias
   * Prioridade: verificado ANTES de chamar a IA (economia de tokens)
   */
  private readonly categoryKeywords: Record<string, string[]> = {
    // Alimentação
    'Alimentação': [
      'IFOOD', 'UBER EATS', 'RAPPI', 'ZDELIVERY', 'AIQFOME',
      'MCDONALDS', 'MCDONALD', 'BURGER KING', 'BK ', 'SUBWAY', 'KFC',
      'STARBUCKS', 'OUTBACK', 'MADERO', 'SPOLETO', 'GIRAFFAS', 'HABIBS', 'HABIB',
      'PIZZA HUT', 'DOMINOS', 'DOMINO', 'PIZZARIA',
      'RESTAURANTE', 'REST ', 'LANCHONETE', 'LANCH ', 'PADARIA', 'PAD ',
      'SORVETERIA', 'SORVETE', 'AÇAI', 'ACAI', 'DOCERIA', 'CONFEITARIA',
      'CAFETERIA', 'CAFE ', 'CAFÉ', 'BARZINHO', 'BAR ', 'BOTECO', 'PUB ',
      'CHURRASCARIA', 'CHURRAS', 'RODIZIO', 'BUFFET',
      'SUSHI', 'JAPONÊS', 'JAPONES', 'CHINES', 'CHINÊS', 'MEXICANO',
      'CANTINA', 'SELF SERVICE', 'PRATO FEITO', 'PF ',
    ],

    // Transporte
    'Transporte': [
      'UBER', '99 ', '99APP', '99POP', 'CABIFY', 'INDRIVE', 'LYFT',
      'TAXI', 'TÁXI', 'MOTO ', 'MOTOFRETE',
      'POSTO', 'IPIRANGA', 'SHELL', 'PETROBRAS', 'BR DISTRIBUIDORA', 'ALE ',
      'COMBUSTIVEL', 'COMBUSTÍVEL', 'GASOLINA', 'ETANOL', 'DIESEL', 'GNV',
      'ESTACIONAMENTO', 'ESTAPAR', 'PARK', 'PARKING',
      'PEDAGIO', 'PEDÁGIO', 'CONECTCAR', 'SEMPARAR', 'VELOE', 'MOVE MAIS',
      'METRO', 'METRÔ', 'BILHETE UNICO', 'VEM ', 'RIOCARD', 'SPTRANS',
      'ONIBUS', 'ÔNIBUS', 'VIACAO', 'VIAÇÃO',
    ],

    // Mercado
    'Mercado': [
      'CARREFOUR', 'EXTRA', 'PAO DE ACUCAR', 'PÃO DE AÇÚCAR', 'ASSAI', 'ASSAÍ',
      'ATACADAO', 'ATACADÃO', 'MAKRO', 'SAMS CLUB', 'SAM\'S CLUB', 'COSTCO',
      'BIG ', 'WALMART', 'SUPERMARKET', 'SUPERMERCADO', 'MERCADO',
      'HIPER', 'HIPERMERCADO', 'MINI MERCADO', 'MINIMERCADO', 'MERCEARIA',
      'HORTIFRUTI', 'SACOLAO', 'SACOLÃO', 'FEIRA', 'QUITANDA',
      'CASA DE CARNES', 'ACOUGUE', 'AÇOUGUE', 'PEIXARIA',
      'DIA ', 'ALDI', 'LIDL', 'NATURAL DA TERRA', 'ZONA SUL', 'PREZUNIC',
      'GUANABARA', 'MUNDIAL', 'PRINCESA', 'BARBOSA', 'SONDA', 'HIROTA',
    ],

    // Assinaturas
    'Assinaturas': [
      'NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'PRIME VIDEO', 'DISNEY', 'HBO',
      'GLOBOPLAY', 'PARAMOUNT', 'APPLE TV', 'YOUTUBE PREMIUM', 'DEEZER', 'TIDAL',
      'CRUNCHYROLL', 'STAR+', 'DISCOVERY', 'TELECINE',
      'XBOX GAME PASS', 'PLAYSTATION', 'PSN', 'STEAM', 'EPIC GAMES', 'EA PLAY',
      'ADOBE', 'MICROSOFT 365', 'OFFICE 365', 'GOOGLE ONE', 'ICLOUD', 'DROPBOX',
      'NOTION', 'CANVA', 'FIGMA', 'CHATGPT', 'OPENAI',
      'AMAZON MUSIC', 'APPLE MUSIC', 'AUDIBLE', 'KINDLE UNLIMITED',
      'GYMPASS', 'TOTALPASS', 'WELLHUB',
    ],

    // Contas e Serviços
    'Contas e Serviços': [
      'ENEL', 'CPFL', 'CEMIG', 'COELBA', 'CELPE', 'COPEL', 'LIGHT', 'ELETROPAULO',
      'ENERGIA', 'ELETRICA', 'ELÉTRICA', 'LUZ ',
      'SABESP', 'CEDAE', 'COPASA', 'SANEPAR', 'EMBASA', 'CAGECE',
      'AGUA', 'ÁGUA', 'SANEAMENTO',
      'COMGAS', 'COMGÁS', 'CEG', 'NATURGY', 'GAS NATURAL', 'GÁS',
      'CLARO', 'VIVO', 'TIM ', 'OI ', 'NEXTEL', 'ALGAR',
      'TELEFONE', 'CELULAR', 'MOVEL', 'MÓVEL', 'TELECOM',
      'NET ', 'SKY', 'INTERNET', 'BANDA LARGA', 'FIBRA',
      'CONDOMINIO', 'CONDOMÍNIO', 'COND ', 'IPTU', 'ALUGUEL',
    ],

    // Saúde
    'Saúde': [
      'FARMACIA', 'FARMÁCIA', 'DROGARIA', 'DROGASIL', 'DROGA RAIA', 'RAIA',
      'PACHECO', 'SAO PAULO', 'PAGUE MENOS', 'EXTRAFARMA', 'PANVEL', 'NISSEI',
      'ULTRAFARMA', 'DROGAL', 'ONOFRE',
      'HOSPITAL', 'HOSP ', 'CLINICA', 'CLÍNICA', 'CONSULTORIO', 'CONSULTÓRIO',
      'MEDICO', 'MÉDICO', 'DR.', 'DRA.', 'DOUTOR', 'DOUTORA',
      'DENTISTA', 'ODONTO', 'ORTODONTIA', 'DENTAL',
      'LABORATORIO', 'LABORATÓRIO', 'LAB ', 'EXAME', 'DIAGNÓSTICO',
      'UNIMED', 'AMIL', 'BRADESCO SAUDE', 'SULAMERICA', 'NOTREDAME', 'HAPVIDA',
      'PSICÓLOGO', 'PSICOLOGO', 'PSIQUIATRA', 'TERAPIA', 'TERAPEUTA',
      'ACADEMIA', 'SMART FIT', 'BLUEFIT', 'BODYTECH', 'BIO RITMO', 'SELFIT',
      'CROSSFIT', 'PILATES', 'YOGA', 'NATAÇÃO', 'NATACAO',
      'OTICA', 'ÓTICA', 'OTICAS', 'ÓTICAS', 'OCULOS', 'ÓCULOS', 'LENTES',
    ],

    // Compras
    'Compras': [
      'MERCADO LIVRE', 'MERCADOLIVRE', 'MELI ', 'ML ',
      'AMAZON', 'AMZN', 'SHOPEE', 'ALIEXPRESS', 'SHEIN', 'WISH', 'TEMU',
      'MAGAZINE LUIZA', 'MAGALU', 'CASAS BAHIA', 'PONTO FRIO', 'EXTRA.COM',
      'AMERICANAS', 'SUBMARINO', 'SHOPTIME', 'LOJAS AMERICANAS',
      'KABUM', 'PICHAU', 'TERABYTE', 'INFORMATICA', 'INFORMÁTICA',
      'RENNER', 'C&A', 'CEA ', 'RIACHUELO', 'MARISA', 'HERING',
      'ZARA', 'FOREVER 21', 'H&M', 'FARM', 'ANIMALE', 'SHOULDER',
      'CENTAURO', 'NETSHOES', 'DECATHLON', 'NIKE', 'ADIDAS', 'PUMA',
      'LEROY MERLIN', 'TELHA NORTE', 'C&C', 'CASA SHOW', 'TUMELERO',
      'KALUNGA', 'PAPELARIA', 'LIVRARIA', 'SARAIVA', 'CULTURA',
      'JOALHERIA', 'VIVARA', 'PANDORA', 'MONTE CARLO', 'HSTERN',
      'HAVAIANAS', 'MELISSA', 'AREZZO', 'SCHUTZ', 'DEMOCRATA',
      'TOK STOK', 'TOKSTOK', 'ETNA', 'CAMICADO', 'SPICY', 'MOBLY',
    ],

    // Transferências
    'Transferências': [
      'PIX', 'TED', 'DOC', 'TRANSFERENCIA', 'TRANSFERÊNCIA', 'TRANSF ',
      'ENVIO', 'RECEBIMENTO', 'P2P',
      'NUBANK', 'INTER', 'C6 BANK', 'NEXT', 'ORIGINAL', 'NEON', 'PICPAY',
      'MERCADO PAGO', 'PAGBANK', 'PAGSEGURO', 'STONE', 'CIELO', 'REDE',
      'ITAU', 'ITAÚ', 'BRADESCO', 'SANTANDER', 'BB ', 'BANCO DO BRASIL', 'CAIXA',
    ],

    // Lazer
    'Lazer': [
      'CINEMA', 'CINEMARK', 'CINEPOLIS', 'UCI', 'KINOPLEX', 'CINESYSTEM',
      'INGRESSO', 'SYMPLA', 'EVENTIM', 'TICKET', 'ENTRADA',
      'TEATRO', 'SHOW', 'CONCERT', 'FESTIVAL', 'EVENTO',
      'PARQUE', 'DIVERSAO', 'DIVERSÃO', 'ENTRETENIMENTO',
      'BOLICHE', 'SINUCA', 'BILHAR', 'ESCAPE ROOM', 'LASER TAG',
      'MUSEU', 'EXPOSICAO', 'EXPOSIÇÃO', 'GALERIA',
      'ZOOLOGICO', 'ZOOLÓGICO', 'AQUARIO', 'AQUÁRIO',
    ],

    // Viagens
    'Viagens': [
      'HOTEL', 'POUSADA', 'HOSTEL', 'RESORT', 'HOSPEDAGEM',
      'AIRBNB', 'BOOKING', 'EXPEDIA', 'TRIVAGO', 'HOTELS.COM', 'DECOLAR',
      'LATAM', 'GOL', 'AZUL', 'AVIANCA', 'TAP', 'AMERICAN AIRLINES', 'COPA',
      'PASSAGEM', 'PASSAGENS', 'AEREO', 'AÉREO', 'VOAR', 'VOO',
      'ALUGUEL DE CARRO', 'RENT A CAR', 'LOCALIZA', 'MOVIDA', 'UNIDAS', 'HERTZ',
      'RODOVIARIA', 'RODOVIÁRIO', 'ONIBUS VIAGEM',
      'CRUZEIRO', 'MSC', 'COSTA', 'ROYAL CARIBBEAN',
      'CVC', 'HURB', 'MAXMILHAS', 'SUBMARINO VIAGENS', '123MILHAS',
    ],

    // Educação
    'Educação': [
      'ESCOLA', 'COLEGIO', 'COLÉGIO', 'FACULDADE', 'UNIVERSIDADE', 'UNIV ',
      'CURSO', 'CURSINHO', 'AULA', 'PROFESSOR', 'MENTORIA',
      'UDEMY', 'COURSERA', 'ALURA', 'ROCKETSEAT', 'ORIGAMID', 'DIO',
      'DESCOMPLICA', 'ESTRATEGIA', 'GRAN CURSOS', 'QCONCURSOS',
      'LIVRO', 'LIVRARIA', 'AMAZON KINDLE', 'ESTANTE VIRTUAL',
      'MATERIAL ESCOLAR', 'APOSTILA', 'CADERNO',
      'DUOLINGO', 'BABBEL', 'CAMBLY', 'OPEN ENGLISH', 'WIZARD', 'CCAA', 'FISK',
      'MBA', 'POS GRADUACAO', 'PÓS-GRADUAÇÃO', 'MESTRADO', 'DOUTORADO',
    ],

    // Pets
    'Pets': [
      'PET', 'PETSHOP', 'PET SHOP', 'PETZ', 'COBASI', 'PETLAND', 'ANIMALE',
      'RACAO', 'RAÇÃO', 'PET FOOD',
      'VETERINARIO', 'VETERINÁRIO', 'VET ', 'CLINICA VET', 'HOSPITAL VET',
      'BANHO E TOSA', 'GROOMING', 'DOG', 'CAT', 'CAES', 'GATOS',
    ],

    // Seguros
    'Seguros': [
      'SEGURO', 'SEGUROS', 'SEGURADORA',
      'PORTO SEGURO', 'BRADESCO SEGUROS', 'ITAU SEGUROS', 'SULAMERICA',
      'AZUL SEGUROS', 'LIBERTY', 'TOKIO MARINE', 'MAPFRE', 'ALLIANZ', 'ZURICH',
      'VIDA ', 'AUTO ', 'RESIDENCIAL', 'VIAGEM',
    ],

    // Impostos
    'Impostos': [
      'IPVA', 'IPTU', 'IR ', 'IRPF', 'IMPOSTO', 'TRIBUTO', 'TAXA',
      'DETRAN', 'LICENCIAMENTO', 'MULTA', 'INFRAÇÃO', 'INFRACAO',
      'DARF', 'DAS ', 'SIMPLES NACIONAL', 'INSS', 'FGTS',
      'RECEITA FEDERAL', 'PREFEITURA', 'SEFAZ',
    ],

    // Presentes
    'Presentes': [
      'PRESENTE', 'GIFT', 'LEMBRANCA', 'LEMBRANÇA',
      'FLORES', 'FLORICULTURA', 'FLORIST', 'BOUQUET',
      'BOMBONIERE', 'CHOCOLATE', 'DOCE', 'CESTA',
      'CARTAO PRESENTE', 'GIFT CARD', 'VALE PRESENTE',
    ],
  };

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

  /**
   * Tenta categorizar localmente usando a lista de palavras-chave
   * Retorna null se não encontrar match
   */
  private async matchLocalCategory(descriptionClean: string): Promise<{ categoryName: string; confidence: number } | null> {
    const upperDesc = descriptionClean.toUpperCase();

    for (const [categoryName, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        // Match exato ou como parte de palavra
        if (upperDesc.includes(keyword)) {
          this.logger.debug(`📋 Local match: "${keyword}" -> ${categoryName}`);
          return { categoryName, confidence: 0.95 };
        }
      }
    }

    return null;
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

    // 3. PRIORIDADE 3: Match local (lista de palavras-chave)
    const localMatch = await this.matchLocalCategory(fastClean);
    if (localMatch) {
      const category = await this.categoryRepository.findOne({
        where: { name: localMatch.categoryName },
      });

      if (category) {
        this.logger.log(`📋 Local Match: "${fastClean}" -> ${category.name}`);
        
        // Salvar no cache global para acelerar próximas consultas
        await this.cacheRepository.upsert({
          descriptionClean: fastClean,
          userId: null,
          categoryId: category.id,
          confidenceScore: localMatch.confidence,
          occurrenceCount: 1,
          isUserDefined: false,
        }, ['descriptionClean', 'userId']);

        return {
          categoryId: category.id,
          descriptionClean: fastClean,
          confidence: localMatch.confidence,
        };
      }
    }

    // 4. PRIORIDADE 4: Chamar IA (último recurso)
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

    // Prompt ENXUTO - a maioria das transações conhecidas já foi tratada pelo match local
    const prompt = `Categorize esta transação brasileira: "${raw}"

Categorias: [${categoryNames.join(', ')}]

Regras:
- Restaurante/Delivery/Bar → Alimentação
- Uber/99/Combustível → Transporte  
- Netflix/Spotify/Streaming → Assinaturas
- Supermercado → Mercado
- Luz/Água/Telefone → Contas e Serviços
- Farmácia/Médico/Academia → Saúde
- Loja/E-commerce → Compras
- PIX/TED → Transferências
- Desconhecido → Outras

JSON: {"merchant":"NOME","category":"Categoria","confidence":0.9}`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Classificador especializado financeiro BR. Retorne APENAS JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const res = JSON.parse(completion.choices[0].message.content);
      
      let category = categories.find(c => c.name.toLowerCase() === res.category?.toLowerCase());
      if (!category) category = categories.find(c => c.name === 'Outras');

      const finalDescription = res.merchant?.toUpperCase() || fastClean;

      // Salvar no cache global
      await this.cacheRepository.upsert({
        descriptionClean: fastClean,
        userId: null,
        categoryId: category.id,
        confidenceScore: res.confidence || 0.8,
        occurrenceCount: 1,
        isUserDefined: false,
      }, ['descriptionClean', 'userId']);

      this.logger.log(`🤖 IA: "${raw}" -> ${category.name} (${(res.confidence * 100).toFixed(0)}%)`);

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

  /**
   * Categoriza múltiplas transações em lote (mais eficiente)
   * Agrupa até 10 transações por chamada à IA
   */
  async categorizeTransactionsBatch(
    transactions: Array<{ descriptionRaw: string; index: number }>,
    userId?: string,
  ): Promise<Map<number, CategorizationResult>> {
    const results = new Map<number, CategorizationResult>();
    const toProcess: Array<{ descriptionRaw: string; fastClean: string; index: number }> = [];
    const categories = await this.categoryRepository.find();

    // Primeiro, tentar resolver pelo cache e match local
    for (const tx of transactions) {
      const fastClean = this.preClean(tx.descriptionRaw);

      // 1. Tentar cache do usuário
      if (userId) {
        const userCache = await this.cacheRepository.findOne({
          where: { descriptionClean: fastClean, userId },
        });
        if (userCache) {
          results.set(tx.index, {
            categoryId: userCache.categoryId,
            descriptionClean: fastClean,
            confidence: userCache.isUserDefined ? 1.0 : Number(userCache.confidenceScore),
          });
          continue;
        }
      }

      // 2. Tentar cache global
      const globalCache = await this.cacheRepository.findOne({
        where: { descriptionClean: fastClean, userId: IsNull() },
      });
      if (globalCache) {
        results.set(tx.index, {
          categoryId: globalCache.categoryId,
          descriptionClean: fastClean,
          confidence: Number(globalCache.confidenceScore),
        });
        continue;
      }

      // 3. Tentar match local
      const localMatch = await this.matchLocalCategory(fastClean);
      if (localMatch) {
        const category = categories.find(c => c.name === localMatch.categoryName);
        if (category) {
          // Salvar no cache global
          await this.cacheRepository.upsert({
            descriptionClean: fastClean,
            userId: null,
            categoryId: category.id,
            confidenceScore: localMatch.confidence,
            occurrenceCount: 1,
            isUserDefined: false,
          }, ['descriptionClean', 'userId']);

          results.set(tx.index, {
            categoryId: category.id,
            descriptionClean: fastClean,
            confidence: localMatch.confidence,
          });
          continue;
        }
      }

      // 4. Adicionar à lista para processar via IA
      toProcess.push({ ...tx, fastClean });
    }

    this.logger.log(`📊 Batch: ${results.size} resolvidos localmente, ${toProcess.length} para IA`);

    // Se não há nada para processar via IA, retornar
    if (toProcess.length === 0) {
      return results;
    }

    // Processar em lotes de 10
    const BATCH_SIZE = 10;
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE);
      const batchResults = await this.processWithAIBatch(batch);
      
      for (const [index, result] of batchResults) {
        results.set(index, result);
      }
    }

    return results;
  }

  /**
   * Processa um lote de transações via IA (prompt enxuto)
   */
  private async processWithAIBatch(
    transactions: Array<{ descriptionRaw: string; fastClean: string; index: number }>,
  ): Promise<Map<number, CategorizationResult>> {
    const results = new Map<number, CategorizationResult>();

    if (!this.isConfigured) {
      for (const tx of transactions) {
        results.set(tx.index, await this.fallback(tx.fastClean));
      }
      return results;
    }

    const categories = await this.categoryRepository.find();
    const categoryNames = categories.map(c => c.name);

    const transactionsList = transactions
      .map((tx, i) => `${i + 1}. "${tx.descriptionRaw}"`)
      .join('\n');

    // Prompt ENXUTO para batch
    const prompt = `Categorize estas transações BR:
${transactionsList}

Categorias: [${categoryNames.join(', ')}]

Regras rápidas:
- Restaurante/Delivery → Alimentação
- Uber/99/Combustível → Transporte
- Netflix/Spotify → Assinaturas
- Supermercado → Mercado
- Luz/Água/Telefone → Contas e Serviços
- Farmácia/Médico → Saúde
- Loja/E-commerce → Compras
- PIX/TED → Transferências
- Desconhecido → Outras

JSON: {"results":[{"index":1,"merchant":"NOME","category":"Cat","confidence":0.9}]}`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { 
            role: 'system', 
            content: 'Classificador financeiro BR. Retorne APENAS JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 500,
      });

      const res = JSON.parse(completion.choices[0].message.content);
      
      for (const item of res.results || []) {
        const tx = transactions[item.index - 1];
        if (!tx) continue;

        let category = categories.find(c => c.name.toLowerCase() === item.category?.toLowerCase());
        if (!category) category = categories.find(c => c.name === 'Outras');

        const finalDescription = item.merchant?.toUpperCase() || tx.fastClean;

        // Salvar no cache global
        await this.cacheRepository.upsert({
          descriptionClean: tx.fastClean,
          userId: null,
          categoryId: category.id,
          confidenceScore: item.confidence || 0.8,
          occurrenceCount: 1,
          isUserDefined: false,
        }, ['descriptionClean', 'userId']);

        results.set(tx.index, {
          categoryId: category.id,
          descriptionClean: finalDescription,
          confidence: item.confidence || 0.8,
        });
      }

      // Fallback para transações não retornadas
      for (const tx of transactions) {
        if (!results.has(tx.index)) {
          results.set(tx.index, await this.fallback(tx.fastClean));
        }
      }

      this.logger.log(`🤖 IA batch: ${transactions.length} transações categorizadas`);

    } catch (error) {
      this.logger.error(`AI Batch Error: ${error.message}`);
      for (const tx of transactions) {
        results.set(tx.index, await this.fallback(tx.fastClean));
      }
    }

    return results;
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
6. Quando perguntado sobre ativos específicos, use os dados detalhados acima
7. Forneça notícias de mercado se relevante para a pergunta`;

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