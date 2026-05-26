import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return this.usersService.getCurrentUser(request.auth.user);
  }

  @Post('initialize')
  initialize(@Req() request: AuthenticatedRequest) {
    return this.usersService.initialize(request.auth.externalUser);
  }
}
