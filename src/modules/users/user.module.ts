import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../core/auth/auth.module';
import { Couple } from '../couples/entities/couple.entity';
import { CoupleMember } from '../couples/entities/couple-member.entity';
import { User } from './entities/user.entity';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Couple, CoupleMember])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
