import { ServerController } from '@/modules/server/server.controller'
import { Module } from '@nestjs/common'

@Module({
  controllers: [ServerController]
})
export class ServerModule {}
