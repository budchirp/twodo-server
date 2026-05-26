import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../core/auth/auth.module';
import { CoupleMember } from '../couples/entities/couple-member.entity';
import { Note } from './entities/note.entity';
import { NotesController } from './note.controller';
import { NotesService } from './note.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Note, CoupleMember])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
