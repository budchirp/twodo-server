import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { ProfileCompletionGuard } from '../../core/auth/profile-completion.guard';
import { ApiErrorEnvelopeDto } from '../../core/openapi/api-response.dto';
import { ApiSuccessResponse } from '../../core/openapi/api-success-response.decorator';
import { CoupleDto } from './dtos/response.dto';
import { CouplesService } from './couple.service';

@Controller('couples')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('couples')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class CouplesController {
  constructor(private readonly couplesService: CouplesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user couple' })
  @ApiSuccessResponse({ nullable: true, type: CoupleDto })
  getCurrentCouple(
    @Req() request: AuthenticatedRequest,
  ): Promise<CoupleDto | null> {
    return this.couplesService.getCurrentCouple(request.auth.user);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Leave the current couple' })
  @ApiSuccessResponse({ status: 201 })
  leaveCouple(@Req() request: AuthenticatedRequest): Promise<null> {
    return this.couplesService.leaveCouple(request.auth.user);
  }
}
