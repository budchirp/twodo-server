import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiException } from '../../core/exceptions/api.exception';
import { CoupleMember } from '../couples/entities/couple-member.entity';
import { User } from '../users/entities/user.entity';
import { CreateNoteDto, UpdateNoteDto } from './dtos/request.dto';
import { NoteDto } from './dtos/response.dto';
import { Note } from './entities/note.entity';
import { NoteMapper } from './note.mapper';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notes: Repository<Note>,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>,
  ) {}

  async listNotes(user: User | null): Promise<NoteDto[]> {
    const coupleId = await this.currentCoupleId(user);
    const notes = await this.notes.find({
      where: { coupleId },
      order: { createdAt: 'DESC' },
    });

    return notes.map((note) => NoteMapper.toNoteResponse(note));
  }

  async createNote(user: User | null, body: CreateNoteDto): Promise<NoteDto> {
    const coupleId = await this.currentCoupleId(user);
    const note = await this.notes.save(
      this.notes.create({
        coupleId,
        title: body.title,
        content: body.content ?? '',
      }),
    );

    return NoteMapper.toNoteResponse(note);
  }

  async getNote(user: User | null, id: string): Promise<NoteDto> {
    const coupleId = await this.currentCoupleId(user);
    const note = await this.noteForCouple(id, coupleId);

    return NoteMapper.toNoteResponse(note);
  }

  async updateNote(
    user: User | null,
    id: string,
    body: UpdateNoteDto,
  ): Promise<NoteDto> {
    const coupleId = await this.currentCoupleId(user);
    const note = await this.noteForCouple(id, coupleId);

    if (body.title !== undefined) {
      note.title = body.title;
    }
    if (body.content !== undefined) {
      note.content = body.content;
    }
    return NoteMapper.toNoteResponse(await this.notes.save(note));
  }

  async deleteNote(user: User | null, id: string) {
    const coupleId = await this.currentCoupleId(user);
    const note = await this.noteForCouple(id, coupleId);

    await this.notes.remove(note);
    return null;
  }

  private async currentCoupleId(user: User | null): Promise<string> {
    if (!user) {
      throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND);
    }

    const membership = await this.members.findOne({ where: { userId: user.id } });
    if (!membership) {
      throw new ApiException('error.user_no_couple', HttpStatus.FORBIDDEN);
    }

    return membership.coupleId;
  }

  private async noteForCouple(id: string, coupleId: string): Promise<Note> {
    const note = await this.notes.findOne({ where: { id } });
    if (!note) {
      throw new ApiException('error.note_not_found', HttpStatus.NOT_FOUND);
    }

    if (note.coupleId !== coupleId) {
      throw new ApiException('error.not_note_owner', HttpStatus.FORBIDDEN);
    }

    return note;
  }
}
