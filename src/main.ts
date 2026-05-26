import { HttpStatus, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ApiException } from './core/exceptions/api.exception';
import { AppModule } from './modules/app.module';

function createValidationDetails(errors: ValidationError[]) {
  return errors.map((error) => ({
    field: error.property,
    messages: Object.values(error.constraints ?? {}),
  }));
}

async function main() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) =>
        new ApiException(
          'error.validation_failed',
          HttpStatus.BAD_REQUEST,
          createValidationDetails(errors),
        ),
    }),
  );

  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('PORT'));
}

void main();
