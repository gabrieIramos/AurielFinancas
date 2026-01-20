import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

interface ChatRequest {
  message: string;
  kpis: FinancialKPIs;
  conversationHistory: ChatMessage[];
}

interface InsightsRequest {
  kpis: FinancialKPIs;
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

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: ChatRequest, @Request() req): Promise<{ response: string }> {
    return this.aiService.chat(body.message, body.kpis, body.conversationHistory);
  }

  @Post('insights')
  async generateInsights(@Body() body: InsightsRequest, @Request() req): Promise<AIInitialInsights> {
    return this.aiService.generateInsights(body.kpis);
  }
}
