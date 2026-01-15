import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NetWorthService } from './net-worth.service';
import { NetWorthController } from './net-worth.controller';
import { NetWorthHistory } from './entities/net-worth-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NetWorthHistory])],
  controllers: [NetWorthController],
  providers: [NetWorthService],
  exports: [NetWorthService],
})
export class NetWorthModule {}
