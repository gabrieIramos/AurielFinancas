import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FixedIncomeInvestment, FixedIncomeType, IndexerType } from '../entities/fixed-income.entity';

// Taxa CDI atual (atualizar periodicamente ou integrar com API)
const CURRENT_CDI_RATE = 12.15; // % ao ano
const CURRENT_SELIC_RATE = 12.25; // % ao ano
const CURRENT_IPCA_RATE = 4.50; // % ao ano (projeção)
const POUPANCA_RATE = 6.17; // % ao ano (quando Selic > 8.5%)

export interface CreateFixedIncomeDto {
  name: string;
  type: FixedIncomeType;
  institution?: string;
  investedAmount: number;
  interestRate: number;
  indexer: IndexerType;
  purchaseDate: string;
  maturityDate?: string;
  notes?: string;
}

export interface UpdateFixedIncomeDto {
  name?: string;
  type?: FixedIncomeType;
  institution?: string;
  investedAmount?: number;
  currentAmount?: number;
  interestRate?: number;
  indexer?: IndexerType;
  purchaseDate?: string;
  maturityDate?: string;
  isActive?: boolean;
  notes?: string;
}

@Injectable()
export class FixedIncomeService {
  constructor(
    @InjectRepository(FixedIncomeInvestment)
    private fixedIncomeRepository: Repository<FixedIncomeInvestment>,
  ) {}

  async findAll(userId: string): Promise<FixedIncomeInvestment[]> {
    return this.fixedIncomeRepository.find({
      where: { userId },
      order: { purchaseDate: 'DESC' },
    });
  }

  async findActive(userId: string): Promise<FixedIncomeInvestment[]> {
    return this.fixedIncomeRepository.find({
      where: { userId, isActive: true },
      order: { purchaseDate: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<FixedIncomeInvestment> {
    const investment = await this.fixedIncomeRepository.findOne({
      where: { id, userId },
    });
    if (!investment) {
      throw new NotFoundException('Investimento de renda fixa não encontrado');
    }
    return investment;
  }

  async create(userId: string, data: CreateFixedIncomeDto): Promise<FixedIncomeInvestment> {
    const investment = this.fixedIncomeRepository.create({
      userId,
      name: data.name,
      type: data.type,
      institution: data.institution,
      investedAmount: data.investedAmount,
      currentAmount: data.investedAmount, // Inicialmente igual ao valor investido
      interestRate: data.interestRate,
      indexer: data.indexer,
      purchaseDate: new Date(data.purchaseDate),
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
      notes: data.notes,
    });

    return this.fixedIncomeRepository.save(investment);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateFixedIncomeDto,
  ): Promise<FixedIncomeInvestment> {
    const investment = await this.findOne(id, userId);

    if (data.name !== undefined) investment.name = data.name;
    if (data.type !== undefined) investment.type = data.type;
    if (data.institution !== undefined) investment.institution = data.institution;
    if (data.investedAmount !== undefined) investment.investedAmount = data.investedAmount;
    if (data.currentAmount !== undefined) investment.currentAmount = data.currentAmount;
    if (data.interestRate !== undefined) investment.interestRate = data.interestRate;
    if (data.indexer !== undefined) investment.indexer = data.indexer;
    if (data.purchaseDate !== undefined) investment.purchaseDate = new Date(data.purchaseDate);
    if (data.maturityDate !== undefined) investment.maturityDate = data.maturityDate ? new Date(data.maturityDate) : null;
    if (data.isActive !== undefined) investment.isActive = data.isActive;
    if (data.notes !== undefined) investment.notes = data.notes;

    return this.fixedIncomeRepository.save(investment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const investment = await this.findOne(id, userId);
    await this.fixedIncomeRepository.remove(investment);
  }

  // Calcular rendimento estimado
  calculateYield(investment: FixedIncomeInvestment): {
    monthlyYield: number;
    yearlyYield: number;
    estimatedCurrentValue: number;
    totalYield: number;
    yieldPercentage: number;
    daysInvested: number;
    annualEffectiveRate: number;
  } {
    const investedAmount = Number(investment.investedAmount);
    const interestRate = Number(investment.interestRate);
    const purchaseDate = new Date(investment.purchaseDate);
    const today = new Date();
    
    // Calcular dias investidos
    const daysInvested = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular taxa anual efetiva baseada no indexador
    let annualEffectiveRate: number;
    
    switch (investment.indexer) {
      case 'CDI':
        annualEffectiveRate = (interestRate / 100) * CURRENT_CDI_RATE;
        break;
      case 'SELIC':
        annualEffectiveRate = (interestRate / 100) * CURRENT_SELIC_RATE;
        break;
      case 'IPCA':
        annualEffectiveRate = CURRENT_IPCA_RATE + interestRate;
        break;
      case 'PREFIXADO':
        annualEffectiveRate = interestRate;
        break;
      case 'POUPANCA':
        annualEffectiveRate = POUPANCA_RATE;
        break;
      default:
        annualEffectiveRate = interestRate;
    }

    // Taxa mensal equivalente (juros compostos)
    const monthlyRate = Math.pow(1 + annualEffectiveRate / 100, 1 / 12) - 1;
    
    // Taxa diária equivalente
    const dailyRate = Math.pow(1 + annualEffectiveRate / 100, 1 / 365) - 1;

    // Rendimento mensal estimado (sobre o valor atual)
    const monthlyYield = investedAmount * monthlyRate;

    // Rendimento anual estimado
    const yearlyYield = investedAmount * (annualEffectiveRate / 100);

    // Valor atual estimado (juros compostos diários)
    const estimatedCurrentValue = investedAmount * Math.pow(1 + dailyRate, daysInvested);

    // Rendimento total até agora
    const totalYield = estimatedCurrentValue - investedAmount;

    // Percentual de rendimento
    const yieldPercentage = (totalYield / investedAmount) * 100;

    return {
      monthlyYield,
      yearlyYield,
      estimatedCurrentValue,
      totalYield,
      yieldPercentage,
      daysInvested,
      annualEffectiveRate,
    };
  }

  // Obter portfolio consolidado de renda fixa
  async getPortfolio(userId: string) {
    const investments = await this.findActive(userId);

    const items = investments.map(investment => {
      const yieldData = this.calculateYield(investment);
      
      return {
        ...investment,
        investedAmount: Number(investment.investedAmount),
        currentAmount: Number(investment.currentAmount) || yieldData.estimatedCurrentValue,
        ...yieldData,
      };
    });

    // Totais
    const totalInvested = items.reduce((acc, item) => acc + item.investedAmount, 0);
    const totalCurrentValue = items.reduce((acc, item) => acc + item.estimatedCurrentValue, 0);
    const totalMonthlyYield = items.reduce((acc, item) => acc + item.monthlyYield, 0);
    const totalYearlyYield = items.reduce((acc, item) => acc + item.yearlyYield, 0);
    const totalYield = totalCurrentValue - totalInvested;

    return {
      items,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalYield,
        totalYieldPercentage: totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0,
        totalMonthlyYield,
        totalYearlyYield,
        assetCount: items.length,
      },
      rates: {
        cdi: CURRENT_CDI_RATE,
        selic: CURRENT_SELIC_RATE,
        ipca: CURRENT_IPCA_RATE,
        poupanca: POUPANCA_RATE,
      },
    };
  }

  // Tipos disponíveis para o frontend
  getAvailableTypes() {
    return [
      { value: 'CDB', label: 'CDB', description: 'Certificado de Depósito Bancário' },
      { value: 'LCI', label: 'LCI', description: 'Letra de Crédito Imobiliário' },
      { value: 'LCA', label: 'LCA', description: 'Letra de Crédito do Agronegócio' },
      { value: 'TESOURO_SELIC', label: 'Tesouro Selic', description: 'Título pós-fixado atrelado à Selic' },
      { value: 'TESOURO_PREFIXADO', label: 'Tesouro Prefixado', description: 'Título com taxa fixa' },
      { value: 'TESOURO_IPCA', label: 'Tesouro IPCA+', description: 'Título atrelado à inflação' },
      { value: 'LC', label: 'LC', description: 'Letra de Câmbio' },
      { value: 'DEBENTURE', label: 'Debênture', description: 'Título de dívida corporativa' },
      { value: 'CRI', label: 'CRI', description: 'Certificado de Recebíveis Imobiliários' },
      { value: 'CRA', label: 'CRA', description: 'Certificado de Recebíveis do Agronegócio' },
      { value: 'POUPANCA', label: 'Poupança', description: 'Caderneta de Poupança' },
    ];
  }

  getAvailableIndexers() {
    return [
      { value: 'CDI', label: 'CDI', rate: CURRENT_CDI_RATE },
      { value: 'SELIC', label: 'Selic', rate: CURRENT_SELIC_RATE },
      { value: 'IPCA', label: 'IPCA+', rate: CURRENT_IPCA_RATE },
      { value: 'PREFIXADO', label: 'Prefixado', rate: null },
      { value: 'POUPANCA', label: 'Poupança', rate: POUPANCA_RATE },
    ];
  }
}
