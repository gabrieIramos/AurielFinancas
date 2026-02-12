import {
  Controller,
  All,
  Req,
  Res,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { auth } from '../../lib/auth';
import { toNodeHandler } from 'better-auth/node';

@ApiTags('auth')
@Controller('api/auth')
export class BetterAuthController {
  private authHandler = toNodeHandler(auth);

  @All('*')
  @ApiExcludeEndpoint()
  async handleAuth(
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    // Intercepta callback do Google para mobile (iOS/Android)
    if (req.path === '/callback/google' && req.query.state) {
      try {
        // Deixa o BetterAuth processar o callback
        await this.authHandler(req, res);
        
        // Se chegou aqui e não redirecionou, força redirect para frontend
        if (!res.headersSent) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5172';
          return res.redirect(`${frontendUrl}/auth-callback`);
        }
      } catch (error) {
        console.error('Google callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5172';
        return res.redirect(`${frontendUrl}/?error=auth_failed`);
      }
    }
    
    // Para todas as outras rotas, usa o handler padrão
    return this.authHandler(req, res);
  }
}
