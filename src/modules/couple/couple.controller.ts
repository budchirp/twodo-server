import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { ProfileCompletionGuard } from '@/modules/auth/guard/profile-completion.guard'
import { ApiSuccessResponse } from '@/core/openapi/api-success-response.decorator'
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { CoupleService } from '@/modules/couple/service/couple.service'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { AuthGuard } from '@/modules/auth/guard/auth.guard'
import { ApiErrorEnvelopeDto } from '@/core/openapi/api-response.dto'
import { CoupleDto } from '@/modules/couple/dto/response.dto'

@Controller('couples')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('couples')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class CoupleController {
  constructor(private readonly coupleService: CoupleService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user couple' })
  @ApiSuccessResponse({ nullable: true, type: CoupleDto })
  getCurrentCouple(@Req() request: AuthenticatedRequest): Promise<CoupleDto | null> {
    return this.coupleService.getCurrentCouple(request.auth.user)
  }

  @Post('leave')
  @ApiOperation({ summary: 'Leave the current couple' })
  @ApiSuccessResponse({ status: 201 })
  leaveCouple(@Req() request: AuthenticatedRequest): Promise<null> {
    return this.coupleService.leaveCouple(request.auth.user)
  }
}
