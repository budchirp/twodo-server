import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { ProfileCompletionGuard } from '../../core/auth/profile-completion.guard';
import { ApiErrorEnvelopeDto } from '../../core/openapi/api-response.dto';
import { ApiSuccessResponse } from '../../core/openapi/api-success-response.decorator';
import { CreateInviteDto, HandleInviteDto } from './dtos/request.dto';
import { InviteDto } from './dtos/response.dto';
import { InvitesService } from './invite.service';

@Controller('invites')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('invites')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  @ApiOperation({ summary: 'List sent and received invites' })
  @ApiSuccessResponse({ isArray: true, type: InviteDto })
  listInvites(@Req() request: AuthenticatedRequest): Promise<InviteDto[]> {
    return this.invitesService.listInvites(request.auth.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create an invite' })
  @ApiSuccessResponse({ status: 201, type: InviteDto })
  createInvite(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateInviteDto,
  ): Promise<InviteDto> {
    return this.invitesService.createInvite(request.auth.user, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Accept or reject an invite' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse()
  handleInvite(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: HandleInviteDto,
  ): Promise<null> {
    return this.invitesService.handleInvite(request.auth.user, id, body);
  }
}
