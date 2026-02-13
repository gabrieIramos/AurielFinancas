import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserFinancialProfile } from './entities/user-financial-profile.entity';
import { CreateFinancialProfileDto, UpdateFinancialProfileDto } from './dto/financial-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserFinancialProfile)
    private readonly financialProfileRepository: Repository<UserFinancialProfile>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // ========== FINANCIAL PROFILE ==========

  async getFinancialProfile(userId: string): Promise<UserFinancialProfile | null> {
    return this.financialProfileRepository.findOne({ where: { userId } });
  }

  async createOrUpdateFinancialProfile(
    userId: string,
    dto: CreateFinancialProfileDto | UpdateFinancialProfileDto,
  ): Promise<UserFinancialProfile> {
    let profile = await this.financialProfileRepository.findOne({ where: { userId } });

    if (profile) {
      // Atualizar perfil existente
      Object.assign(profile, dto);
      profile.profileCompleted = true;
    } else {
      // Criar novo perfil
      profile = this.financialProfileRepository.create({
        userId,
        ...dto,
        profileCompleted: true,
      });
    }

    return this.financialProfileRepository.save(profile);
  }

  async hasCompletedFinancialProfile(userId: string): Promise<boolean> {
    const profile = await this.financialProfileRepository.findOne({ 
      where: { userId, profileCompleted: true } 
    });
    return !!profile;
  }

  async getFinancialProfileForAI(userId: string): Promise<string | null> {
    const profile = await this.financialProfileRepository.findOne({ where: { userId } });
    
    if (!profile || !profile.profileCompleted) {
      return null;
    }

    // Converte o perfil em texto para a IA usar como contexto
    const parts: string[] = [];

    if (profile.ageRange) {
      const ageMap: Record<string, string> = {
        '18-24': '18 a 24 anos',
        '25-34': '25 a 34 anos',
        '35-44': '35 a 44 anos',
        '45-54': '45 a 54 anos',
        '55-64': '55 a 64 anos',
        '65+': 'mais de 65 anos',
      };
      parts.push(`Faixa etária: ${ageMap[profile.ageRange] || profile.ageRange}`);
    }

    if (profile.occupation) {
      const occMap: Record<string, string> = {
        'employed': 'Empregado CLT',
        'self-employed': 'Autônomo',
        'entrepreneur': 'Empresário',
        'student': 'Estudante',
        'retired': 'Aposentado',
        'other': 'Outro',
      };
      parts.push(`Ocupação: ${occMap[profile.occupation] || profile.occupation}`);
    }

    if (profile.monthlyIncomeRange) {
      const incomeMap: Record<string, string> = {
        'up-to-2k': 'até R$ 2.000',
        '2k-5k': 'R$ 2.000 a R$ 5.000',
        '5k-10k': 'R$ 5.000 a R$ 10.000',
        '10k-20k': 'R$ 10.000 a R$ 20.000',
        '20k-50k': 'R$ 20.000 a R$ 50.000',
        '50k+': 'acima de R$ 50.000',
      };
      parts.push(`Renda mensal: ${incomeMap[profile.monthlyIncomeRange] || profile.monthlyIncomeRange}`);
    }

    if (profile.incomeStability) {
      const stabilityMap: Record<string, string> = {
        'stable': 'estável',
        'variable': 'variável',
        'mostly-stable': 'majoritariamente estável',
        'mostly-variable': 'majoritariamente variável',
      };
      parts.push(`Estabilidade da renda: ${stabilityMap[profile.incomeStability] || profile.incomeStability}`);
    }

    if (profile.monthlyExpensePercentage) {
      const expenseMap: Record<string, string> = {
        'less-30': 'menos de 30%',
        '30-50': '30% a 50%',
        '50-70': '50% a 70%',
        '70-90': '70% a 90%',
        'more-90': 'mais de 90%',
      };
      parts.push(`Percentual de gastos da renda: ${expenseMap[profile.monthlyExpensePercentage] || profile.monthlyExpensePercentage}`);
    }

    parts.push(`Possui dívidas: ${profile.hasDebts ? 'Sim' : 'Não'}`);

    if (profile.hasDebts && profile.debtTypes?.length) {
      const debtMap: Record<string, string> = {
        'credit-card': 'Cartão de crédito',
        'personal-loan': 'Empréstimo pessoal',
        'financing': 'Financiamento',
        'mortgage': 'Financiamento imobiliário',
        'student-loan': 'Empréstimo estudantil',
        'other': 'Outros',
      };
      parts.push(`Tipos de dívidas: ${profile.debtTypes.map(d => debtMap[d] || d).join(', ')}`);
    }

    parts.push(`Possui reserva de emergência: ${profile.hasEmergencyFund ? 'Sim' : 'Não'}`);

    if (profile.emergencyFundMonths) {
      const fundMap: Record<string, string> = {
        'none': 'Não possui',
        'less-3': 'menos de 3 meses',
        '3-6': '3 a 6 meses',
        '6-12': '6 a 12 meses',
        'more-12': 'mais de 12 meses',
      };
      parts.push(`Reserva de emergência: ${fundMap[profile.emergencyFundMonths] || profile.emergencyFundMonths}`);
    }

    if (profile.investmentExperience) {
      const expMap: Record<string, string> = {
        'none': 'Nenhuma',
        'beginner': 'Iniciante',
        'intermediate': 'Intermediário',
        'advanced': 'Avançado',
      };
      parts.push(`Experiência com investimentos: ${expMap[profile.investmentExperience] || profile.investmentExperience}`);
    }

    if (profile.currentInvestments?.length) {
      const invMap: Record<string, string> = {
        'savings': 'Poupança',
        'cdb': 'CDB/RDB',
        'tesouro': 'Tesouro Direto',
        'stocks': 'Ações',
        'fiis': 'FIIs',
        'crypto': 'Criptomoedas',
        'funds': 'Fundos de investimento',
        'other': 'Outros',
      };
      parts.push(`Investimentos atuais: ${profile.currentInvestments.map(i => invMap[i] || i).join(', ')}`);
    }

    if (profile.investmentGoal) {
      const goalMap: Record<string, string> = {
        'emergency-fund': 'Montar reserva de emergência',
        'retirement': 'Aposentadoria',
        'buy-property': 'Comprar imóvel',
        'financial-freedom': 'Independência financeira',
        'passive-income': 'Renda passiva',
        'other': 'Outro',
      };
      parts.push(`Objetivo principal de investimento: ${goalMap[profile.investmentGoal] || profile.investmentGoal}`);
    }

    if (profile.investmentHorizon) {
      const horizonMap: Record<string, string> = {
        'short-term': 'Curto prazo (até 2 anos)',
        'medium-term': 'Médio prazo (2 a 5 anos)',
        'long-term': 'Longo prazo (mais de 5 anos)',
      };
      parts.push(`Horizonte de investimento: ${horizonMap[profile.investmentHorizon] || profile.investmentHorizon}`);
    }

    if (profile.riskTolerance) {
      const riskMap: Record<string, string> = {
        'conservative': 'Conservador',
        'moderate': 'Moderado',
        'aggressive': 'Arrojado',
      };
      parts.push(`Perfil de risco: ${riskMap[profile.riskTolerance] || profile.riskTolerance}`);
    }

    if (profile.mainFinancialGoals?.length) {
      const goalsMap: Record<string, string> = {
        'save-more': 'Economizar mais',
        'invest-better': 'Investir melhor',
        'pay-debts': 'Quitar dívidas',
        'build-emergency': 'Construir reserva de emergência',
        'increase-income': 'Aumentar renda',
        'retire-early': 'Aposentadoria antecipada',
        'buy-house': 'Comprar imóvel',
        'buy-property': 'Comprar imóvel',
        'travel': 'Viajar',
        'buy-car': 'Comprar carro',
        'financial-freedom': 'Liberdade financeira',
      };
      parts.push(`Objetivos financeiros: ${profile.mainFinancialGoals.map(g => goalsMap[g] || g).join(', ')}`);
    }

    if (profile.biggestFinancialChallenge) {
      const challengeMap: Record<string, string> = {
        'control-spending': 'Controlar gastos',
        'save-money': 'Economizar dinheiro',
        'understand-investments': 'Entender investimentos',
        'increase-income': 'Aumentar renda',
        'pay-debts': 'Pagar dívidas',
        'organize-finances': 'Organizar finanças',
        'control-debts': 'Controlar dívidas',
        'optimize-portfolio': 'Otimizar portfólio',
      };
      parts.push(`Maior desafio financeiro: ${challengeMap[profile.biggestFinancialChallenge] || profile.biggestFinancialChallenge}`);
    }

    return parts.join('\n');
  }
}
