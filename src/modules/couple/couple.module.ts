import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { CoupleService } from '@/modules/couple/service/couple.service'
import { CoupleController } from '@/modules/couple/couple.controller'
import { Couple } from '@/modules/couple/entity/couple.entity'
import { AuthModule } from '@/modules/auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Couple, CoupleMember])],
  controllers: [CoupleController],
  providers: [CoupleService]
})
export class CoupleModule {}
