import { isUserProfileCompleted } from '@/modules/user/util/user-profile.util'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { ApiException } from '@/core/exception/api.exception'
import { HttpStatus, Injectable } from '@nestjs/common'

@Injectable()
export class ProfileCompletionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!isUserProfileCompleted(request.auth.user)) {
      throw new ApiException('error.profile_required', HttpStatus.FORBIDDEN)
    }

    return true
  }
}
