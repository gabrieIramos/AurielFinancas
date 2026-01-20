import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { Investment } from './entities/investment.entity';
import { Ativo } from './entities/ativo.entity';
import { BrapiService } from './services/brapi.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Investment, Ativo]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, BrapiService],
  exports: [InvestmentsService, BrapiService],
})
export class InvestmentsModule {}
