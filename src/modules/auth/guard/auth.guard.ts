import { AuthService } from '@/modules/auth/service/auth.service'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    request.auth = await this.authService.authenticate(request.headers.authorization)

    return true
  }
}
