import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { entities } from '@/core/db/entities'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.getOrThrow<string>('DATABASE_PATH'),
        entities,
        synchronize: true
      })
    })
  ]
})
export class DbModule {}
