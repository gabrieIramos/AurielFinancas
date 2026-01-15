import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async create(
    userId: string,
    data: {
      name: string;
      type: AccountType;
      institutionId?: string;
      currentBalance?: number;
    },
  ): Promise<Account> {
    const account = this.accountRepository.create({
      userId,
      ...data,
    });
    return this.accountRepository.save(account);
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      relations: ['institution'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
      relations: ['institution'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateBalance(id: string, userId: string, balance: number): Promise<Account> {
    const account = await this.findOne(id, userId);
    account.currentBalance = balance;
    return this.accountRepository.save(account);
  }

  async delete(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id, userId);
    await this.accountRepository.remove(account);
  }
}
