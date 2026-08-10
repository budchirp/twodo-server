import { ProfileCompletionGuard } from '@/modules/auth/guard/profile-completion.guard'
import { AuthService } from '@/modules/auth/service/auth.service'
import { AuthGuard } from '@/modules/auth/guard/auth.guard'
import { User } from '@/modules/user/entity/user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthGuard, AuthService, ProfileCompletionGuard],
  exports: [AuthGuard, AuthService, ProfileCompletionGuard]
})
export class AuthModule {}
