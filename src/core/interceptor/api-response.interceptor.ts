import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { I18nService } from '@/core/i18n/i18n.service'
import { slugify } from '@/core/util/slugify'
import { Injectable } from '@nestjs/common'
import type { Request } from 'express'
import type { Observable } from 'rxjs'
import { map } from 'rxjs'

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>()

    return next.handle().pipe(
      map((data) => ({
        error: false,
        code: slugify('success'),
        message: this.i18n.translate('success', request.headers['accept-language']),
        data: data ?? null
      }))
    )
  }
}
