import type { CreateNoteDto, UpdateNoteDto } from '@/modules/note/dto/request.dto'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { ApiException } from '@/core/exception/api.exception'
import type { User } from '@/modules/user/entity/user.entity'
import { Note } from '@/modules/note/entity/note.entity'
import type { NoteDto } from '@/modules/note/dto/response.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { HttpStatus, Injectable } from '@nestjs/common'
import { NoteMapper } from '@/modules/note/note.mapper'
import type { Repository } from 'typeorm'

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly notes: Repository<Note>,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>
  ) {}

  async listNotes(user: User | null): Promise<NoteDto[]> {
    const coupleId = await this.currentCoupleId(user)
    return (await this.notes.find({ where: { coupleId }, order: { createdAt: 'DESC' } })).map(
      NoteMapper.toNoteResponse
    )
  }

  async createNote(user: User | null, body: CreateNoteDto): Promise<NoteDto> {
    const coupleId = await this.currentCoupleId(user)
    const note = await this.notes.save(
      this.notes.create({ coupleId, title: body.title, content: body.content ?? '' })
    )
    return NoteMapper.toNoteResponse(note)
  }

  async getNote(user: User | null, id: string): Promise<NoteDto> {
    return NoteMapper.toNoteResponse(await this.noteForCouple(id, await this.currentCoupleId(user)))
  }

  async updateNote(user: User | null, id: string, body: UpdateNoteDto): Promise<NoteDto> {
    const note = await this.noteForCouple(id, await this.currentCoupleId(user))
    if (body.title !== undefined) note.title = body.title
    if (body.content !== undefined) note.content = body.content
    return NoteMapper.toNoteResponse(await this.notes.save(note))
  }

  async deleteNote(user: User | null, id: string): Promise<null> {
    const note = await this.noteForCouple(id, await this.currentCoupleId(user))
    await this.notes.remove(note)
    return null
  }

  private async currentCoupleId(user: User | null): Promise<string> {
    if (!user) throw new ApiException('error.user_not_found', HttpStatus.NOT_FOUND)
    const membership = await this.members.findOne({ where: { userId: user.id } })
    if (!membership) throw new ApiException('error.user_no_couple', HttpStatus.FORBIDDEN)
    return membership.coupleId
  }

  private async noteForCouple(id: string, coupleId: string): Promise<Note> {
    const note = await this.notes.findOne({ where: { id } })
    if (!note) throw new ApiException('error.note_not_found', HttpStatus.NOT_FOUND)
    if (note.coupleId !== coupleId)
      throw new ApiException('error.not_note_owner', HttpStatus.FORBIDDEN)
    return note
  }
}
