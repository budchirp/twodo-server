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
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { CreateInviteDto, HandleInviteDto } from './dtos/request.dto';
import { InvitesService } from './invite.service';

@Controller('invites')
@UseGuards(AuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  listInvites(@Req() request: AuthenticatedRequest) {
    return this.invitesService.listInvites(request.auth.user);
  }

  @Post()
  createInvite(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateInviteDto,
  ) {
    return this.invitesService.createInvite(request.auth.user, body);
  }

  @Patch(':id')
  handleInvite(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: HandleInviteDto,
  ) {
    return this.invitesService.handleInvite(request.auth.user, id, body);
  }
}
