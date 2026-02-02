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

    // 3. Filtrar transações novas (não duplicadas)
    const newRawTransactions: Array<{
      raw: typeof rawTransactions[0];
      hash: string;
      index: number;
    }> = [];

    for (let i = 0; i < rawTransactions.length; i++) {
      const hash = hashes[i];
      if (!existingHashes.has(hash)) {
        newRawTransactions.push({
          raw: rawTransactions[i],
          hash,
          index: i,
        });
        existingHashes.add(hash);
      }
    }

    if (newRawTransactions.length === 0) {
      return {
        totalProcessed: rawTransactions.length,
        newlyImported: 0,
        duplicatesSkipped: rawTransactions.length,
      };
    }

    // 4. Categorizar em lote usando IA (mais eficiente)
    const categorizationResults = await this.aiService.categorizeTransactionsBatch(
      newRawTransactions.map(t => ({
        descriptionRaw: t.raw.descriptionRaw,
        index: t.index,
      })),
      userId,
    );

    // 5. Criar as transações com os resultados da categorização
    const newTransactions: Transaction[] = [];

    for (const item of newRawTransactions) {
      const aiResult = categorizationResults.get(item.index) || {
        categoryId: null,
        descriptionClean: item.raw.descriptionRaw,
        confidence: 0,
      };

      const transaction = this.transactionRepository.create({
        userId: userId,
        accountId: accountId,
        transactionHash: item.hash,
        fitid: item.raw.fitid,
        descriptionRaw: item.raw.descriptionRaw,
        descriptionClean: aiResult.descriptionClean,
        amount: Number(item.raw.amount), 
        date: item.raw.date,
        categoryId: aiResult.categoryId,
        categoryConfidence: aiResult.confidence,
        needsReview: aiResult.confidence < 0.8,
        additionalInfo: item.raw.additionalInfo || {},
      });

      newTransactions.push(transaction);
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

  /**
   * Atualiza a categoria de uma transação
   * Também salva no cache de preferências do usuário para futuras transações similares
   */
  async updateCategory(
    userId: string,
    transactionId: string,
    categoryId: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // 1. Atualizar a transação diretamente no banco
    await this.transactionRepository.update(
      { id: transactionId, userId },
      {
        categoryId,
        categoryConfidence: 1.0,
        needsReview: false,
      }
    );

    // 2. Salvar preferência do usuário no cache de IA
    // Isso garante que transações futuras com descrição similar usem esta categoria
    await this.aiService.saveUserCategoryPreference(
      userId,
      transaction.descriptionRaw,
      categoryId,
    );

    // 3. Retornar transação atualizada com relações
    return this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['category', 'account'],
    });
  }

  /**
   * Busca uma transação pelo ID
   */
  async findOne(userId: string, transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
      relations: ['category', 'account'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  /**
   * Atualiza campos gerais de uma transação
   */
  async update(
    userId: string,
    transactionId: string,
    updateData: { description?: string; amount?: number; date?: string },
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
      relations: ['category', 'account'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // Atualizar campos permitidos
    if (updateData.description !== undefined) {
      transaction.descriptionClean = updateData.description;
    }
    if (updateData.amount !== undefined) {
      transaction.amount = updateData.amount;
    }
    if (updateData.date !== undefined) {
      transaction.date = new Date(updateData.date);
    }

    await this.transactionRepository.save(transaction);

    return this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['category', 'account'],
    });
  }
}