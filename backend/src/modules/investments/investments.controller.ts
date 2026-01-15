import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvestmentsService } from './investments.service';

@ApiTags('investments')
@Controller('investments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List investments' })
  async findAll(@Request() req) {
    return this.investmentsService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create investment' })
  async create(@Request() req, @Body() createDto: any) {
    return this.investmentsService.create(req.user.id, createDto);
  }
}
