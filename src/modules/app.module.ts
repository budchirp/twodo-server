import { ApiResponseInterceptor } from '@/core/interceptor/api-response.interceptor'
import { ApiExceptionFilter } from '@/core/filter/api-exception.filter'
import { CalendarModule } from '@/modules/calendar/calendar.module'
import { ServerModule } from '@/modules/server/server.module'
import { CoupleModule } from '@/modules/couple/couple.module'
import { InviteModule } from '@/modules/invite/invite.module'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { NoteModule } from '@/modules/note/note.module'
import { UserModule } from '@/modules/user/user.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { EnvValidator } from '@/core/env/env.validator'
import { I18nModule } from '@/core/i18n/i18n.module'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from '@/core/db/db.module'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: EnvValidator.validate
    }),
    DbModule,
    I18nModule,
    AuthModule,
    ServerModule,
    UserModule,
    CoupleModule,
    InviteModule,
    NoteModule,
    CalendarModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor
    }
  ]
})
export class AppModule {}
