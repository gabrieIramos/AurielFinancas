import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { BrapiService } from './services/brapi.service';

@ApiTags('investments')
@Controller('investments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentsController {
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly brapiService: BrapiService,
  ) {}

  // ========== ATIVOS (tabela fixa) ==========

  @Get('ativos')
  @ApiOperation({ summary: 'List all available ativos (stocks, FIIs, etc)' })
  async findAllAtivos(@Query('tipo') tipo?: string) {
    if (tipo) {
      return this.investmentsService.findAtivosByTipo(tipo);
    }
    return this.investmentsService.findAllAtivos();
  }

  @Get('ativos/:id')
  @ApiOperation({ summary: 'Get ativo by ID' })
  async findAtivoById(@Param('id') id: string) {
    return this.investmentsService.findAtivoById(parseInt(id));
  }

  // ========== PORTFOLIO (carteira consolidada) ==========

  @Get('portfolio')
  @ApiOperation({ summary: 'Get consolidated portfolio with profit/loss calculations' })
  async getPortfolio(@Request() req) {
    return this.investmentsService.getPortfolio(req.user.id);
  }

  // ========== INVESTMENTS (transações) ==========

  @Get()
  @ApiOperation({ summary: 'List all investment transactions' })
  async findAll(@Request() req) {
    return this.investmentsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investment transaction by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.investmentsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create investment transaction (buy stock)' })
  async create(
    @Request() req,
    @Body() createDto: {
      ativoId: number;
      quantity: number;
      purchasePrice: number;
      purchaseDate: string;
    },
  ) {
    return this.investmentsService.create(req.user.id, createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update investment transaction' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: Partial<{
      ativoId: number;
      quantity: number;
      purchasePrice: number;
      purchaseDate: string;
    }>,
  ) {
    return this.investmentsService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete investment transaction' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.investmentsService.delete(id, req.user.id);
    return { message: 'Transação removida com sucesso' };
  }

  // ========== BRAPI (atualização de preços) ==========

  @Post('update-prices')
  @ApiOperation({ summary: 'Force update all asset prices from BRAPI' })
  async updatePrices() {
    return this.brapiService.forceUpdate();
  }
}
