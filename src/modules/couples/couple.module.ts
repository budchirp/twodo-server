import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../core/auth/auth.module';
import { CouplesController } from './couple.controller';
import { CouplesService } from './couple.service';
import { Couple } from './entities/couple.entity';
import { CoupleMember } from './entities/couple-member.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Couple, CoupleMember])],
  controllers: [CouplesController],
  providers: [CouplesService],
})
export class CouplesModule {}
