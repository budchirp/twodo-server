import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { NoteService } from '@/modules/note/service/note.service'
import { NoteController } from '@/modules/note/note.controller'
import { AuthModule } from '@/modules/auth/auth.module'
import { Note } from '@/modules/note/entity/note.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Note, CoupleMember])],
  controllers: [NoteController],
  providers: [NoteService]
})
export class NoteModule {}
