import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(
    readonly messageKey: string,
    status: HttpStatus,
    readonly data: unknown = null,
  ) {
    super({ messageKey, data }, status);
  }
}
