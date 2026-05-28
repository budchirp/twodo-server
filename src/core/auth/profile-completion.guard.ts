import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../exceptions/api.exception';
import type { AuthenticatedRequest } from './auth.types';
import { isUserProfileCompleted } from '../../modules/users/user-profile.util';

@Injectable()
export class ProfileCompletionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!isUserProfileCompleted(request.auth.user)) {
      throw new ApiException('error.profile_required', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
