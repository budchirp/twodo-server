import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../core/auth/auth.module';
import { Couple } from '../couples/entities/couple.entity';
import { CoupleMember } from '../couples/entities/couple-member.entity';
import { User } from '../users/entities/user.entity';
import { Invite } from './entities/invite.entity';
import { InvitesController } from './invite.controller';
import { InvitesService } from './invite.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Invite, User, Couple, CoupleMember]),
  ],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
