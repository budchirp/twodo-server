import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { ProfileCompletionGuard } from '@/modules/auth/guard/profile-completion.guard'
import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { CreateInviteDto, HandleInviteDto } from '@/modules/invite/dto/request.dto'
import { ApiSuccessResponse } from '@/core/openapi/api-success-response.decorator'
import { InviteService } from '@/modules/invite/service/invite.service'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { AuthGuard } from '@/modules/auth/guard/auth.guard'
import { ApiErrorEnvelopeDto } from '@/core/openapi/api-response.dto'
import { InviteDto } from '@/modules/invite/dto/response.dto'

@Controller('invites')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('invites')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Get()
  @ApiOperation({ summary: 'List sent and received invites' })
  @ApiSuccessResponse({ isArray: true, type: InviteDto })
  listInvites(@Req() request: AuthenticatedRequest): Promise<InviteDto[]> {
    return this.inviteService.listInvites(request.auth.user)
  }

  @Post()
  @ApiOperation({ summary: 'Create an invite' })
  @ApiSuccessResponse({ status: 201, type: InviteDto })
  createInvite(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateInviteDto
  ): Promise<InviteDto> {
    return this.inviteService.createInvite(request.auth.user, body)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Accept or reject an invite' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse()
  handleInvite(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: HandleInviteDto
  ): Promise<null> {
    return this.inviteService.handleInvite(request.auth.user, id, body)
  }
}
