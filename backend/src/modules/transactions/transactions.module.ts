import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { AiModule } from '../ai/ai.module';
import { CsvParserService } from './services/csv-parser.service';
import { OfxParserService } from './services/ofx-parser.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account]), AiModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, CsvParserService, OfxParserService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
