import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

// DEPRECATED: Autenticação agora é gerenciada pelo BetterAuth
// Este arquivo é mantido apenas para compatibilidade com módulos Passport existentes
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    // BetterAuth gerencia validação via /api/auth/sign-in/email
    return null;
  }
}
