import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '../core/auth/auth.module';
import { DbModule } from '../core/db/db.module';
import { EnvValidator } from '../core/env/env.validator';
import { ApiExceptionFilter } from '../core/filters/api-exception.filter';
import { I18nModule } from '../core/i18n/i18n.module';
import { ApiResponseInterceptor } from '../core/interceptors/api-response.interceptor';
import { CouplesModule } from './couples/couple.module';
import { InvitesModule } from './invites/invite.module';
import { NotesModule } from './notes/note.module';
import { ServerModule } from './server/server.module';
import { UsersModule } from './users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: EnvValidator.validate,
    }),
    DbModule,
    I18nModule,
    AuthModule,
    ServerModule,
    UsersModule,
    CouplesModule,
    InvitesModule,
    NotesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
  ],
})
export class AppModule {}
