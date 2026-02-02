import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { auth } from '../../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        throw new UnauthorizedException('Sessão não encontrada');
      }

      // Anexa o usuário e sessão ao request para uso posterior
      request.user = session.user;
      request.session = session.session;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Não autorizado');
    }
  }
}
