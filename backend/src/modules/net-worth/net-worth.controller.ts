import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { NetWorthService } from './net-worth.service';

@ApiTags('net-worth')
@Controller('net-worth')
@UseGuards(BetterAuthGuard)
@ApiBearerAuth()
export class NetWorthController {
  constructor(private readonly netWorthService: NetWorthService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get net worth history with current snapshot' })
  async getHistory(@Request() req, @Query('limit') limit?: number) {
    return this.netWorthService.getHistoryWithCurrent(req.user.id, limit || 12);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current net worth snapshot (calculated)' })
  async getCurrentSnapshot(@Request() req) {
    return this.netWorthService.calculateCurrentSnapshot(req.user.id);
  }

  @Post('snapshot')
  @ApiOperation({ summary: 'Save current month snapshot' })
  async saveSnapshot(@Request() req) {
    return this.netWorthService.saveCurrentMonthSnapshot(req.user.id);
  }
}
