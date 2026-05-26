import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { CreateNoteDto, UpdateNoteDto } from './dtos/request.dto';
import { NotesService } from './note.service';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  listNotes(@Req() request: AuthenticatedRequest) {
    return this.notesService.listNotes(request.auth.user);
  }

  @Post()
  createNote(@Req() request: AuthenticatedRequest, @Body() body: CreateNoteDto) {
    return this.notesService.createNote(request.auth.user, body);
  }

  @Get(':id')
  getNote(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.notesService.getNote(request.auth.user, id);
  }

  @Patch(':id')
  updateNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(request.auth.user, id, body);
  }

  @Delete(':id')
  deleteNote(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.notesService.deleteNote(request.auth.user, id);
  }
}
