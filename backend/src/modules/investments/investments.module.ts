import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { Investment } from './entities/investment.entity';
import { Ativo } from './entities/ativo.entity';
import { FixedIncomeInvestment } from './entities/fixed-income.entity';
import { BrapiService } from './services/brapi.service';
import { FixedIncomeService } from './services/fixed-income.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Investment, Ativo, FixedIncomeInvestment]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, BrapiService, FixedIncomeService],
  exports: [InvestmentsService, BrapiService, FixedIncomeService],
})
export class InvestmentsModule {}
