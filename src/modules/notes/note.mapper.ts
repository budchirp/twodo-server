import { NoteDto } from './dtos/response.dto';
import { Note } from './entities/note.entity';

export class NoteMapper {
  static toNoteResponse(note: Note): NoteDto {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }
}
