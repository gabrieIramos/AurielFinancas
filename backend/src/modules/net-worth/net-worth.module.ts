import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetWorthService } from './net-worth.service';
import { NetWorthController } from './net-worth.controller';
import { NetWorthHistory } from './entities/net-worth-history.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { InvestmentsModule } from '../investments/investments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NetWorthHistory]),
    forwardRef(() => AccountsModule),
    forwardRef(() => InvestmentsModule),
  ],
  controllers: [NetWorthController],
  providers: [NetWorthService],
  exports: [NetWorthService],
})
export class NetWorthModule {}
