import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { UsersService } from './users.service';
import { CreateFinancialProfileDto, UpdateFinancialProfileDto } from './dto/financial-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  async getProfile(@Request() req) {
    // req.user já vem do BetterAuthGuard
    const hasFinancialProfile = await this.usersService.hasCompletedFinancialProfile(req.user.id);
    
    return {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      fullName: req.user.fullName || req.user.name,
      image: req.user.image,
      hasFinancialProfile,
    };
  }

  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Get('financial-profile')
  async getFinancialProfile(@Request() req) {
    const profile = await this.usersService.getFinancialProfile(req.user.id);
    return { profile };
  }

  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Post('financial-profile')
  async createFinancialProfile(
    @Request() req,
    @Body() dto: CreateFinancialProfileDto,
  ) {
    const profile = await this.usersService.createOrUpdateFinancialProfile(req.user.id, dto);
    return { profile };
  }

  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Put('financial-profile')
  async updateFinancialProfile(
    @Request() req,
    @Body() dto: UpdateFinancialProfileDto,
  ) {
    const profile = await this.usersService.createOrUpdateFinancialProfile(req.user.id, dto);
    return { profile };
  }

  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Get('financial-profile/check')
  async checkFinancialProfile(@Request() req) {
    const hasProfile = await this.usersService.hasCompletedFinancialProfile(req.user.id);
    return { hasProfile };
  }
}
