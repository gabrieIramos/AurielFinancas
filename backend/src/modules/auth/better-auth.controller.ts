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
    // Log detalhado para debug OAuth
    if (req.path.includes('callback/google') || req.path.includes('sign-in/social')) {
      console.log('[BetterAuth]', {
        path: req.path,
        method: req.method,
        query: req.query,
        cookies: req.cookies,
        headers: {
          origin: req.headers.origin,
          referer: req.headers.referer,
          userAgent: req.headers['user-agent']?.substring(0, 50),
        },
      });
    }
    
    // Intercepta callback do Google para mobile (iOS/Android)
    if (req.path === '/callback/google' && req.query.state) {
      try {
        console.log('[OAuth Callback] Processando callback Google...');
        
        // Deixa o BetterAuth processar o callback
        await this.authHandler(req, res);
        
        console.log('[OAuth Callback] Processamento concluído, headers sent:', res.headersSent);
        
        // Se chegou aqui e não redirecionou, força redirect para frontend
        if (!res.headersSent) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5172';
          console.log('[OAuth Callback] Redirecionando para:', `${frontendUrl}/auth-callback`);
          return res.redirect(`${frontendUrl}/auth-callback`);
        }
      } catch (error) {
        console.error('[OAuth Callback] Erro:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5172';
        return res.redirect(`${frontendUrl}/?error=auth_failed`);
      }
    }
    
    // Para todas as outras rotas, usa o handler padrão
    return this.authHandler(req, res);
  }
}
