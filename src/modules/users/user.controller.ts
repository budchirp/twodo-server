import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { ApiErrorEnvelopeDto } from '../../core/openapi/api-response.dto';
import { ApiSuccessResponse } from '../../core/openapi/api-success-response.decorator';
import { UpdateUserProfileDto } from './dtos/request.dto';
import { UserDto } from './dtos/response.dto';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard)
@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiSuccessResponse({ type: UserDto })
  getCurrentUser(@Req() request: AuthenticatedRequest): Promise<UserDto> {
    return this.usersService.getCurrentUser(request.auth.user);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize the authenticated user profile' })
  @ApiSuccessResponse({ status: 201, type: UserDto })
  initialize(@Req() request: AuthenticatedRequest): Promise<UserDto> {
    return this.usersService.initialize(request.auth.externalUser);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ type: UserDto })
  updateCurrentUserProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateUserProfileDto,
  ): Promise<UserDto> {
    return this.usersService.updateCurrentUserProfile(request.auth.user, body);
  }
}
