import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetterAuthGuard } from './guards/better-auth.guard';

// Rotas de login/register agora são gerenciadas pelo BetterAuth em /api/auth/*
// Este controller mantém apenas rotas auxiliares
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Get('session')
  @ApiOperation({ summary: 'Get current session' })
  async getSession(@Request() req) {
    return {
      user: req.user,
      session: req.session,
    };
  }
}
