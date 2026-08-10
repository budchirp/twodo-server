import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ApiException } from '@/core/exception/api.exception'
import type { ValidationError } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from '@/modules/app.module'
import { NestFactory } from '@nestjs/core'
import 'reflect-metadata'

function createValidationDetails(errors: ValidationError[]) {
  return errors.map((error) => ({
    field: error.property,
    messages: Object.values(error.constraints ?? {})
  }))
}

async function main() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) =>
        new ApiException(
          'error.validation_failed',
          HttpStatus.BAD_REQUEST,
          createValidationDetails(errors)
        )
    })
  )

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Twodo API')
      .setDescription('HTTP API for Twodo clients')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build()
  )
  SwaggerModule.setup('docs', app, document)

  const config = app.get(ConfigService)
  await app.listen(config.getOrThrow<number>('PORT'))
}

void main()
