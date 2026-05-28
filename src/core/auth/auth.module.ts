import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { ProfileCompletionGuard } from './profile-completion.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthGuard, AuthService, ProfileCompletionGuard],
  exports: [AuthGuard, AuthService, ProfileCompletionGuard],
})
export class AuthModule {}
