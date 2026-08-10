import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { UserService } from '@/modules/user/service/user.service'
import { Couple } from '@/modules/couple/entity/couple.entity'
import { UserController } from '@/modules/user/user.controller'
import { AuthModule } from '@/modules/auth/auth.module'
import { User } from '@/modules/user/entity/user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Couple, CoupleMember])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
