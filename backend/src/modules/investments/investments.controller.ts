import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { BrapiService } from './services/brapi.service';
import { FixedIncomeService, CreateFixedIncomeDto, UpdateFixedIncomeDto } from './services/fixed-income.service';

@ApiTags('investments')
@Controller('investments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentsController {
  constructor(
    private readonly investmentsService: InvestmentsService,
    private readonly brapiService: BrapiService,
    private readonly fixedIncomeService: FixedIncomeService,
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

  @Get('update-prices/failed')
  @ApiOperation({ summary: 'Get list of assets that failed to update' })
  async getFailedPrices() {
    return this.brapiService.getFailedStats();
  }

  @Post('update-prices/retry')
  @ApiOperation({ summary: 'Retry updating prices for failed assets' })
  async retryFailedPrices() {
    return this.brapiService.retryFailed();
  }

  // ========== RENDA FIXA ==========

  @Get('fixed-income/types')
  @ApiOperation({ summary: 'Get available fixed income types' })
  async getFixedIncomeTypes() {
    return this.fixedIncomeService.getAvailableTypes();
  }

  @Get('fixed-income/indexers')
  @ApiOperation({ summary: 'Get available indexers with current rates' })
  async getFixedIncomeIndexers() {
    return this.fixedIncomeService.getAvailableIndexers();
  }

  @Get('fixed-income/portfolio')
  @ApiOperation({ summary: 'Get consolidated fixed income portfolio with yield calculations' })
  async getFixedIncomePortfolio(@Request() req) {
    return this.fixedIncomeService.getPortfolio(req.user.id);
  }

  @Get('fixed-income')
  @ApiOperation({ summary: 'List all fixed income investments' })
  async findAllFixedIncome(@Request() req, @Query('active') active?: string) {
    if (active === 'true') {
      return this.fixedIncomeService.findActive(req.user.id);
    }
    return this.fixedIncomeService.findAll(req.user.id);
  }

  @Get('fixed-income/:id')
  @ApiOperation({ summary: 'Get fixed income investment by ID' })
  async findOneFixedIncome(@Request() req, @Param('id') id: string) {
    return this.fixedIncomeService.findOne(id, req.user.id);
  }

  @Post('fixed-income')
  @ApiOperation({ summary: 'Create new fixed income investment' })
  async createFixedIncome(@Request() req, @Body() createDto: CreateFixedIncomeDto) {
    return this.fixedIncomeService.create(req.user.id, createDto);
  }

  @Put('fixed-income/:id')
  @ApiOperation({ summary: 'Update fixed income investment' })
  async updateFixedIncome(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateFixedIncomeDto,
  ) {
    return this.fixedIncomeService.update(id, req.user.id, updateDto);
  }

  @Delete('fixed-income/:id')
  @ApiOperation({ summary: 'Delete fixed income investment' })
  async deleteFixedIncome(@Request() req, @Param('id') id: string) {
    await this.fixedIncomeService.delete(id, req.user.id);
    return { message: 'Investimento de renda fixa removido com sucesso' };
  }
}
