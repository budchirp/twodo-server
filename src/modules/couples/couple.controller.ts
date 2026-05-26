import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { CouplesService } from './couple.service';

@Controller('couples')
@UseGuards(AuthGuard)
export class CouplesController {
  constructor(private readonly couplesService: CouplesService) {}

  @Get('me')
  getCurrentCouple(@Req() request: AuthenticatedRequest) {
    return this.couplesService.getCurrentCouple(request.auth.user);
  }

  @Post('leave')
  leaveCouple(@Req() request: AuthenticatedRequest) {
    return this.couplesService.leaveCouple(request.auth.user);
  }
}
