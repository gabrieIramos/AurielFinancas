import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create account' })
  async create(@Request() req, @Body() createDto: CreateAccountDto) {
    return this.accountsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all accounts' })
  async findAll(@Request() req) {
    return this.accountsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.accountsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  async delete(@Request() req, @Param('id') id: string) {
    await this.accountsService.delete(id, req.user.id);
    return { message: 'Account deleted successfully' };
  }
}
