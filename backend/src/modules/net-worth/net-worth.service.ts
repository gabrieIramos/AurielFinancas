import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NetWorthHistory } from './entities/net-worth-history.entity';
import { AccountsService } from '../accounts/accounts.service';
import { InvestmentsService } from '../investments/investments.service';
import { FixedIncomeService } from '../investments/services/fixed-income.service';

export interface NetWorthSnapshot {
  snapshotDate: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    accounts: number;
    variableIncome: number;
    fixedIncome: number;
    creditCardDebt: number;
  };
}

export interface NetWorthHistoryResponse {
  history: NetWorthHistory[];
  currentSnapshot: NetWorthSnapshot;
  hasHistory: boolean;
}

@Injectable()
export class NetWorthService {
  constructor(
    @InjectRepository(NetWorthHistory)
    private netWorthRepository: Repository<NetWorthHistory>,
    @Inject(forwardRef(() => AccountsService))
    private accountsService: AccountsService,
    @Inject(forwardRef(() => InvestmentsService))
    private investmentsService: InvestmentsService,
    @Inject(forwardRef(() => FixedIncomeService))
    private fixedIncomeService: FixedIncomeService,
  ) {}

  async findHistory(userId: string, limit = 12): Promise<NetWorthHistory[]> {
    return this.netWorthRepository.find({
      where: { userId },
      order: { snapshotDate: 'ASC' }, // Ordem cronológica para o gráfico
      take: limit,
    });
  }

  /**
   * Retorna histórico completo com tratamento para usuário novo
   */
  async getHistoryWithCurrent(userId: string, limit = 12): Promise<NetWorthHistoryResponse> {
    // Buscar histórico existente
    const history = await this.findHistory(userId, limit);
    
    // Calcular snapshot atual
    const currentSnapshot = await this.calculateCurrentSnapshot(userId);
    
    return {
      history,
      currentSnapshot,
      hasHistory: history.length > 0,
    };
  }

  /**
   * Calcula o patrimônio atual do usuário
   */
  async calculateCurrentSnapshot(userId: string): Promise<NetWorthSnapshot> {
    // Buscar dados em paralelo
    const [accounts, portfolio, fixedIncomePortfolio] = await Promise.all([
      this.accountsService.findAll(userId),
      this.investmentsService.getPortfolio(userId),
      this.fixedIncomeService.getPortfolio(userId),
    ]);

    // Calcular saldo das contas
    let accountsTotal = 0;
    let creditCardDebt = 0;

    accounts.forEach(account => {
      const saldo = Number(account.calculatedBalance) || 0;
      if (account.type === 'CARTAO_DE_CREDITO') {
        if (saldo < 0) {
          creditCardDebt += Math.abs(saldo);
        }
      } else {
        accountsTotal += saldo;
      }
    });

    // Valor dos investimentos de renda variável
    const variableIncome = portfolio?.summary?.totalValue || 0;

    // Valor dos investimentos de renda fixa
    const fixedIncome = fixedIncomePortfolio?.summary?.totalCurrentValue || 0;

    // Totais
    const totalAssets = accountsTotal + variableIncome + fixedIncome;
    const totalLiabilities = creditCardDebt;
    const netWorth = totalAssets - totalLiabilities;

    return {
      snapshotDate: new Date(),
      totalAssets,
      totalLiabilities,
      netWorth,
      breakdown: {
        accounts: accountsTotal,
        variableIncome,
        fixedIncome,
        creditCardDebt,
      },
    };
  }

  /**
   * Salva ou atualiza o snapshot do mês atual
   */
  async saveCurrentMonthSnapshot(userId: string): Promise<NetWorthHistory> {
    const now = new Date();
    // Primeiro dia do mês atual para identificar o mês
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Verificar se já existe snapshot deste mês
    const existingSnapshot = await this.netWorthRepository.findOne({
      where: {
        userId,
        snapshotDate: monthStart,
      },
    });

    // Calcular valores atuais
    const currentSnapshot = await this.calculateCurrentSnapshot(userId);

    if (existingSnapshot) {
      // Atualizar snapshot existente
      existingSnapshot.totalAssets = currentSnapshot.totalAssets;
      existingSnapshot.totalLiabilities = currentSnapshot.totalLiabilities;
      existingSnapshot.netWorth = currentSnapshot.netWorth;
      return this.netWorthRepository.save(existingSnapshot);
    } else {
      // Criar novo snapshot
      const snapshot = this.netWorthRepository.create({
        userId,
        snapshotDate: monthStart,
        totalAssets: currentSnapshot.totalAssets,
        totalLiabilities: currentSnapshot.totalLiabilities,
        netWorth: currentSnapshot.netWorth,
      });
      return this.netWorthRepository.save(snapshot);
    }
  }

  async createSnapshot(
    userId: string,
    date: Date,
    totalAssets: number,
    totalLiabilities: number,
  ): Promise<NetWorthHistory> {
    const netWorth = totalAssets - totalLiabilities;

    const snapshot = this.netWorthRepository.create({
      userId,
      snapshotDate: date,
      totalAssets,
      totalLiabilities,
      netWorth,
    });

    return this.netWorthRepository.save(snapshot);
  }
}
