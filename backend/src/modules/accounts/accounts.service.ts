import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(
    userId: string,
    data: {
      name: string;
      type: AccountType;
      institutionId?: string;
      initialBalance?: number;
    },
  ): Promise<Account> {
    const account = this.accountRepository.create({
      userId,
      name: data.name,
      type: data.type,
      institutionId: data.institutionId,
      initialBalance: data.initialBalance || 0,
    });
    const saved = await this.accountRepository.save(account);
    return this.findOne(saved.id, userId);
  }

  async findAll(userId: string): Promise<Account[]> {
    const accounts = await this.accountRepository.find({
      where: { userId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });

    // Calcular saldo de cada conta
    for (const account of accounts) {
      account.calculatedBalance = await this.calculateBalance(account.id, userId);
    }

    return accounts;
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
      relations: ['institution'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Calcular saldo
    account.calculatedBalance = await this.calculateBalance(id, userId);

    return account;
  }

  async updateInitialBalance(id: string, userId: string, initialBalance: number): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    account.initialBalance = initialBalance;
    await this.accountRepository.save(account);
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id, userId);
    await this.accountRepository.remove(account);
  }

  /**
   * Calcula o saldo atual da conta baseado nas transações
   * Saldo = saldoInicial + receitas - despesas
   * 
   * No banco, o amount é sempre o valor absoluto.
   * Se amount > 0, é receita (entrada)
   * Se amount < 0, é despesa (saída)
   */
  async calculateBalance(accountId: string, userId: string): Promise<number> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      return 0;
    }

    // Buscar todas as transações desta conta
    const transactions = await this.transactionRepository.find({
      where: { accountId, userId },
    });   

    // Somar transações considerando o sinal do amount
    // amount positivo = entrada (receita)
    // amount negativo = saída (despesa)
    const transactionSum = transactions.reduce((sum, t) => {
      return sum + Number(t.amount);
    }, 0);

    const calculatedBalance = Number(account.initialBalance) + transactionSum;
    
    console.log(`Soma das transações: ${transactionSum}`);
    console.log(`Saldo calculado: ${calculatedBalance}`);
    console.log(`=== FIM DEBUG ===\n`);

    // Saldo = inicial + soma das transações
    return calculatedBalance;
  }
}
