import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { InviteService } from '@/modules/invite/service/invite.service'
import { InviteController } from '@/modules/invite/invite.controller'
import { Invite } from '@/modules/invite/entity/invite.entity'
import { Couple } from '@/modules/couple/entity/couple.entity'
import { AuthModule } from '@/modules/auth/auth.module'
import { User } from '@/modules/user/entity/user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Invite, User, Couple, CoupleMember])],
  controllers: [InviteController],
  providers: [InviteService]
})
export class InviteModule {}
