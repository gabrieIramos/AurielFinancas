import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  Between,
  IsNull,
  Not,
  LessThan,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { AiService } from '../ai/ai.service';
import * as crypto from 'crypto';
import { addDays } from 'date-fns';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private aiService: AiService,
  ) { }

  /**
   * Gera hash único para deduplicação.
   * Prioriza o FITID (OFX), senão usa dados da transação (CSV).
   */
  private generateTransactionHash(
    accountId: string,
    amount: number,
    date: Date,
    description: string,
    fitid?: string,
  ): string {
    const dateStr = date.toISOString().split('T')[0];
    // Se não houver FITID, incluímos o valor e data para evitar colisões
    const fingerprint = fitid
      ? `FITID|${accountId}|${fitid}`
      : `RAW|${accountId}|${amount}|${dateStr}|${description.trim().toUpperCase()}`;

    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Processa a importação de múltiplas transações de uma vez.
   */
  async processImport(
    userId: string,
    accountId: string,
    rawTransactions: Array<{
      date: Date;
      descriptionRaw: string;
      amount: number;
      fitid?: string;
      additionalInfo?: any;
    }>,
  ) {
    // 1. Validar conta
    const account = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Conta não encontrada');

    if (!rawTransactions.length) {
      return {
        totalProcessed: 0,
        newlyImported: 0,
        duplicatesSkipped: 0,
      };
    }

    // 2. filtrar duplicatas já existentes no banco
    const hashes = rawTransactions.map(t =>
      this.generateTransactionHash(accountId, t.amount, t.date, t.descriptionRaw, t.fitid)
    );

    const existingTransactions = await this.transactionRepository.find({
      where: { transactionHash: In(hashes) },
      select: ['transactionHash']
    });

    const existingHashes = new Set(existingTransactions.map(t => t.transactionHash));

    const newTransactions: Transaction[] = [];

    // 3. Iterar sobre as transações que não são duplicadas
    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];
      const hash = hashes[i];

      if (existingHashes.has(hash)) continue;

      // 4. Chamar o AI para categorizar
      const aiResult = await this.aiService.categorizeTransaction(raw.descriptionRaw);

      const transaction = this.transactionRepository.create({
        userId: userId,
        accountId: accountId,
        transactionHash: hash,
        fitid: raw.fitid,
        descriptionRaw: raw.descriptionRaw,
        descriptionClean: aiResult.descriptionClean,
        amount: Number(raw.amount), 
        date: raw.date,
        categoryId: aiResult.categoryId,
        categoryConfidence: aiResult.confidence,
        needsReview: aiResult.confidence < 0.8,
        additionalInfo: raw.additionalInfo || {},
      });

      newTransactions.push(transaction);

      existingHashes.add(hash);
    }

    // 5. Salva em lote 
    if (newTransactions.length > 0) {
      await this.transactionRepository.save(newTransactions);

      // 6. Tentar detectar transferências após o salvamento      
      this.detectTransfers(userId).catch(err => console.error('Transfer detection failed', err));
    }

    return {
      totalProcessed: rawTransactions.length,
      newlyImported: newTransactions.length,
      duplicatesSkipped: rawTransactions.length - newTransactions.length
    };
  }

  async listByUser(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      accountId?: string;
      categoryId?: string;
    },
  ): Promise<Transaction[]> {
    const where: any = { userId };

    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    if (filters?.startDate && filters?.endDate) {
      where.date = Between(new Date(filters.startDate), new Date(filters.endDate));
    } else if (filters?.startDate) {
      where.date = MoreThanOrEqual(new Date(filters.startDate));
    } else if (filters?.endDate) {
      where.date = LessThanOrEqual(new Date(filters.endDate));
    }

    return this.transactionRepository.find({
      where,
      relations: ['category', 'account'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Busca pares de transações que representam movimentação entre contas próprias.
   */
  async detectTransfers(userId: string): Promise<void> {
    const recentExpenses = await this.transactionRepository.find({
      where: { userId, amount: LessThan(0), transferId: IsNull() },
      relations: ['account']
    });

    for (const expense of recentExpenses) {
      const match = await this.transactionRepository.findOne({
        where: {
          userId,
          amount: Math.abs(Number(expense.amount)),
          accountId: Not(expense.accountId),
          transferId: IsNull(),
          date: Between(expense.date, addDays(expense.date, 2))
        }
      });

      if (match) {
        expense.transferId = match.id;
        match.transferId = expense.id;

        await this.transactionRepository.save([expense, match]);
      }
    }
  }
}