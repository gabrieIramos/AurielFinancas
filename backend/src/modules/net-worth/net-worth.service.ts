import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetWorthHistory } from './entities/net-worth-history.entity';

@Injectable()
export class NetWorthService {
  constructor(
    @InjectRepository(NetWorthHistory)
    private netWorthRepository: Repository<NetWorthHistory>,
  ) {}

  async findHistory(userId: string, limit = 12): Promise<NetWorthHistory[]> {
    return this.netWorthRepository.find({
      where: { userId },
      order: { snapshotDate: 'DESC' },
      take: limit,
    });
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
