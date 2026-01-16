import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CsvParserService, ParsedTransaction } from './services/csv-parser.service';
import { OfxParserService } from './services/ofx-parser.service';
import type { Multer } from 'multer';

type BankType = 'C6' | 'INTER' | 'NUBANK';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly csvParserService: CsvParserService,
    private readonly ofxParserService: OfxParserService,
  ) { }

  @Get()
  async findAll(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.transactionsService.listByUser(req.user.id, {
      startDate,
      endDate,
      accountId,
      categoryId,
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importTransactions(
    @UploadedFile() file: Multer.File,
    @Body('accountId') accountId: string,
    @Body('bankType') bankType: BankType,
    @Request() req,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    if (!accountId) throw new BadRequestException('Conta não enviada');

    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Usuário não identificado');

    const fileContent = file.buffer.toString('utf-8');
    let parsedData = [] as ParsedTransaction[];

    try {
      parsedData = this.parseByBank(bankType, fileContent, file.originalname);

      const normalizedTransactions = parsedData.map((item) => ({
        date: new Date(item.date),
        descriptionRaw: item.description,
        amount: item.type === 'expense'
          ? -Math.abs(item.amount)
          : Math.abs(item.amount),
        fitid: item.fitid,
        additionalInfo: item.additionalInfo,
      }));
      
      return await this.transactionsService.processImport(
        userId,
        accountId,
        normalizedTransactions,
      );
    } catch (error) {
      throw new BadRequestException(`Erro ao processar arquivo: ${error.message}`);
    }
  }

  private parseByBank(
    bankType: BankType,
    content: string,
    filename?: string,
  ): ParsedTransaction[] {
    if (bankType === 'C6') {
      return this.parseC6Csv(content);
    }

    if (bankType === 'INTER' || bankType === 'NUBANK') {
      return this.ofxParserService.parse(content);
    }

    const name = filename?.toLowerCase() || '';
    if (name.endsWith('.csv')) {
      return this.csvParserService.parse(content);
    }

    if (name.endsWith('.ofx')) {
      return this.ofxParserService.parse(content);
    }

    throw new BadRequestException('Banco ou formato não suportado');
  }

  private parseC6Csv(content: string): ParsedTransaction[] {
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const dataLines = lines.slice(1);

    return dataLines
      .map(line => {
        const cols = line.split(';').map(col => col.trim());
        if (cols.length < 9) return null;

        const [day, month, year] = cols[0].split('/');
        if (!day || !month || !year) return null;

        let amount = parseFloat(cols[8].replace('.', '').replace(',', '.'));
        if (Number.isNaN(amount)) return null;

        const description = cols[4] || 'Sem descrição';
        const isPayment = description.toUpperCase().includes('PAGAMENTO');
        if (!isPayment) amount = amount * -1;

        return {
          date: `${year}-${month}-${day}`,
          description,
          amount: Math.abs(amount),
          type: amount < 0 ? 'expense' : 'income',
          additionalInfo: {
            parcela: cols[5],
            cartaoFinal: cols[2],
          },
        } as ParsedTransaction;
      })
      .filter((item): item is ParsedTransaction => item !== null);
  }
}