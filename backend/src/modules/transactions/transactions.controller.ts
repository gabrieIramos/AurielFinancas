import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create transaction with AI categorization' })
  async create(@Request() req, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(
      req.user.id,
      createDto.accountId,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with filters' })
  async findAll(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.findAll(req.user.id, {
      accountId,
      categoryId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Post('detect-transfers')
  @ApiOperation({ summary: 'Detect transfers between own accounts' })
  async detectTransfers(@Request() req) {
    await this.transactionsService.detectTransfers(req.user.id);
    return { message: 'Transfer detection completed' };
  }
}
