import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException } from '../exceptions/api.exception';
import { I18nService } from '../i18n/i18n.service';
import { slugify } from '../utils/slugify';

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageKey = 'error.internal_server_error';
    let data: unknown = null;

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      messageKey = exception.messageKey;
      data = exception.data;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      messageKey =
        status === HttpStatus.NOT_FOUND
          ? 'error.route_not_found'
          : 'error.internal_server_error';
    }

    response.status(status).json({
      error: true,
      code: slugify(messageKey),
      message: this.i18n.translate(
        messageKey,
        request.headers['accept-language'],
      ),
      data,
    });
  }
}
