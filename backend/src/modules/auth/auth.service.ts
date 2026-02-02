import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

// Autenticação agora é gerenciada pelo BetterAuth
// Este service mantém compatibilidade para operações internas
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
  ) {}

  async findUserById(id: string) {
    return this.usersService.findById(id);
  }

  async findUserByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }
}
