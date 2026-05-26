import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import { slugify } from '../utils/slugify';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        error: false,
        code: slugify('success'),
        message: this.i18n.translate(
          'success',
          request.headers['accept-language'],
        ),
        data: data ?? null,
      })),
    );
  }
}
