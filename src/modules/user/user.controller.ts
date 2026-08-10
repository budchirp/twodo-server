import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ApiSuccessResponse } from '@/core/openapi/api-success-response.decorator'
import { UserService } from '@/modules/user/service/user.service'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { AuthGuard } from '@/modules/auth/guard/auth.guard'
import { ApiErrorEnvelopeDto } from '@/core/openapi/api-response.dto'
import { UpdateUserProfileDto } from '@/modules/user/dto/request.dto'
import { UserDto } from '@/modules/user/dto/response.dto'

@Controller('users')
@UseGuards(AuthGuard)
@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiSuccessResponse({ type: UserDto })
  getCurrentUser(@Req() request: AuthenticatedRequest): Promise<UserDto> {
    return this.userService.getCurrentUser(request.auth.user)
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize the authenticated user profile' })
  @ApiSuccessResponse({ status: 201, type: UserDto })
  initialize(@Req() request: AuthenticatedRequest): Promise<UserDto> {
    return this.userService.initialize(request.auth.externalUser)
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ type: UserDto })
  updateCurrentUserProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateUserProfileDto
  ): Promise<UserDto> {
    return this.userService.updateCurrentUserProfile(request.auth.user, body)
  }
}
