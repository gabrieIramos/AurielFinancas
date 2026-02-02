import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(BetterAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  async getProfile(@Request() req) {
    // req.user já vem do BetterAuthGuard
    return {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      fullName: req.user.fullName || req.user.name,
      image: req.user.image,
    };
  }
}
