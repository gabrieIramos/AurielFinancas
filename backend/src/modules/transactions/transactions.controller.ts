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
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { ImportService, SupportedBankCode } from './services/import.service';
import type { Multer } from 'multer';

@Controller('transactions')
@UseGuards(BetterAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly importService: ImportService,
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

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.transactionsService.findOne(req.user.id, id);
  }

  /**
   * Atualiza a categoria de uma transação
   * Também salva a preferência do usuário no cache para futuras transações similares
   */
  @Patch(':id/category')
  async updateCategory(
    @Request() req,
    @Param('id') id: string,
    @Body('categoryId') categoryId: string,
  ) {
    if (!categoryId) {
      throw new BadRequestException('categoryId é obrigatório');
    }
    return this.transactionsService.updateCategory(req.user.id, id, categoryId);
  }

  /**
   * Atualiza uma transação (endpoint genérico)
   * Se categoryId for alterado, também salva a preferência do usuário
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: { categoryId?: string; description?: string; amount?: number; date?: string },
  ) {
    // Se está atualizando a categoria, usar o método específico que salva no cache
    if (updateData.categoryId) {
      return this.transactionsService.updateCategory(req.user.id, id, updateData.categoryId);
    }
    
    // Para outros campos, busca e atualiza diretamente
    return this.transactionsService.update(req.user.id, id, updateData);
  }

  /**
   * Lista bancos/formatos suportados para importação
   */
  @Get('import/supported-banks')
  getSupportedBanks() {
    return this.importService.getSupportedBanks();
  }

  /**
   * Preview da importação (não salva no banco)
   * Útil para o usuário ver as transações antes de confirmar
   */
  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @UploadedFile() file: Multer.File,
    @Body('bankCode') bankCode: SupportedBankCode = 'AUTO',
    @Request() req,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');

    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Usuário não identificado');

    const fileContent = file.buffer.toString('utf-8');

    try {
      const result = this.importService.processFile(fileContent, {
        bankCode,
        filename: file.originalname,
        accountId: '', // Não precisa para preview
        userId,
      });

      return {
        success: result.success,
        bankDetected: result.bankDetected,
        summary: result.summary,
        // Retorna apenas primeiras 50 transações no preview
        transactions: result.transactions.slice(0, 50),
        totalTransactions: result.transactions.length,
        errors: result.errors,
        warnings: result.warnings,
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao processar arquivo: ${error.message}`);
    }
  }

  /**
   * Importa transações para uma conta
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importTransactions(
    @UploadedFile() file: Multer.File,
    @Body('accountId') accountId: string,
    @Body('bankCode') bankCode: SupportedBankCode = 'AUTO',
    @Request() req,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    if (!accountId) throw new BadRequestException('Conta não informada');

    const userId = req.user?.id;
    if (!userId) throw new BadRequestException('Usuário não identificado');

    const fileContent = file.buffer.toString('utf-8');

    try {
      // 1. Processar arquivo com o parser correto
      const parseResult = this.importService.processFile(fileContent, {
        bankCode,
        filename: file.originalname,
        accountId,
        userId,
      });

      if (!parseResult.success || parseResult.transactions.length === 0) {
        return {
          success: false,
          message: 'Nenhuma transação válida encontrada',
          errors: parseResult.errors,
          warnings: parseResult.warnings,
        };
      }

      // 2. Normalizar para o formato do TransactionsService
      const normalizedTransactions = this.importService.normalizeForImport(parseResult.transactions);

      // 3. Processar importação (inclui categorização via IA)
      const importResult = await this.transactionsService.processImport(
        userId,
        accountId,
        normalizedTransactions,
      );

      return {
        success: true,
        bankDetected: parseResult.bankDetected,
        ...importResult,
        summary: parseResult.summary,
        warnings: parseResult.warnings,
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao importar: ${error.message}`);
    }
  }
}