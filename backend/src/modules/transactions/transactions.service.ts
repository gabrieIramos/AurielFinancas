import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { AiService } from '../ai/ai.service';
import * as crypto from 'crypto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private aiService: AiService,
  ) {}

  /**
   * Gera hash único para deduplicação
   */
  private generateTransactionHash(
    accountId: string,
    amount: number,
    date: Date,
    description: string,
  ): string {
    const data = `${accountId}|${amount}|${date.toISOString().split('T')[0]}|${description}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Cria nova transação com categorização automática
   */
  async create(
    userId: string,
    accountId: string,
    data: {
      fitid?: string;
      descriptionRaw: string;
      amount: number;
      date: Date;
    },
  ): Promise<Transaction> {
    // Verificar se conta existe e pertence ao usuário
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Gerar hash para deduplicação
    const transactionHash = this.generateTransactionHash(
      accountId,
      data.amount,
      data.date,
      data.descriptionRaw,
    );

    // Verificar duplicação
    const existing = await this.transactionRepository.findOne({
      where: { transactionHash },
    });

    if (existing) {
      return existing;
    }

    // Categorizar com IA
    const categorization = await this.aiService.categorizeTransaction(
      data.descriptionRaw,
      userId,
    );

    // Criar transação
    const transaction = this.transactionRepository.create({
      userId,
      accountId,
      fitid: data.fitid,
      transactionHash,
      descriptionRaw: data.descriptionRaw,
      descriptionClean: categorization.descriptionClean,
      amount: data.amount,
      date: data.date,
      categoryId: categorization.categoryId,
      categoryConfidence: categorization.confidence,
      needsReview: categorization.confidence < 0.8,
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Lista transações do usuário
   */
  async findAll(
    userId: string,
    filters?: {
      accountId?: string;
      categoryId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Transaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.account', 'account')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId });

    if (filters?.accountId) {
      query.andWhere('transaction.accountId = :accountId', {
        accountId: filters.accountId,
      });
    }

    if (filters?.categoryId) {
      query.andWhere('transaction.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.startDate) {
      query.andWhere('transaction.date >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return query.orderBy('transaction.date', 'DESC').getMany();
  }

  /**
   * Detectar transferências entre contas do mesmo usuário
   */
  async detectTransfers(userId: string): Promise<void> {
    const transactions = await this.findAll(userId);

    // Agrupar por data e valor absoluto
    const grouped = new Map<string, Transaction[]>();

    transactions.forEach((t) => {
      const key = `${t.date.toISOString().split('T')[0]}|${Math.abs(t.amount)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(t);
    });

    // Detectar pares de transferência (débito + crédito mesmo valor/data)
    for (const [, group] of grouped) {
      if (group.length < 2) continue;

      const debits = group.filter((t) => t.amount < 0);
      const credits = group.filter((t) => t.amount > 0);

      for (const debit of debits) {
        for (const credit of credits) {
          if (Math.abs(debit.amount) === credit.amount) {
            // Marcar como transferência
            debit.transferId = credit.id;
            credit.transferId = debit.id;
            await this.transactionRepository.save([debit, credit]);
          }
        }
      }
    }
  }
}
