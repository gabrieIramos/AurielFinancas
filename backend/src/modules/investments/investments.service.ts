import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from './entities/investment.entity';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private investmentRepository: Repository<Investment>,
  ) {}

  async findAll(userId: string): Promise<Investment[]> {
    return this.investmentRepository.find({
      where: { userId },
      order: { ticker: 'ASC' },
    });
  }

  async create(
    userId: string,
    data: {
      ticker: string;
      type: string;
      quantity: number;
      averagePrice: number;
    },
  ): Promise<Investment> {
    const investment = this.investmentRepository.create({
      userId,
      ...data,
    });
    return this.investmentRepository.save(investment);
  }

  async updatePrice(id: string, userId: string, price: number): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId },
    });
    if (investment) {
      investment.currentPrice = price;
      return this.investmentRepository.save(investment);
    }
    return null;
  }
}
