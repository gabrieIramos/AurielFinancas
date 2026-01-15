import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NetWorthService } from './net-worth.service';

@ApiTags('net-worth')
@Controller('net-worth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NetWorthController {
  constructor(private readonly netWorthService: NetWorthService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get net worth history' })
  async getHistory(@Request() req, @Query('limit') limit?: number) {
    return this.netWorthService.findHistory(req.user.id, limit || 12);
  }
}
