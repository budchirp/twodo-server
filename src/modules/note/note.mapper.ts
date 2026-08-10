import type { Note } from '@/modules/note/entity/note.entity'
import type { NoteDto } from '@/modules/note/dto/response.dto'

export class NoteMapper {
  static toNoteResponse(note: Note): NoteDto {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString()
    }
  }
}
