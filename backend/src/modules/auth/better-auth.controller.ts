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
    // O BetterAuth cuida de todas as rotas de autenticação
    // Incluindo: /api/auth/sign-in/email, /api/auth/sign-up/email,
    // /api/auth/sign-in/social, /api/auth/callback/google, etc.
    return this.authHandler(req, res);
  }
}
