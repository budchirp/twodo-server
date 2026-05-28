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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../core/auth/auth.guard';
import type { AuthenticatedRequest } from '../../core/auth/auth.types';
import { ProfileCompletionGuard } from '../../core/auth/profile-completion.guard';
import { ApiErrorEnvelopeDto } from '../../core/openapi/api-response.dto';
import { ApiSuccessResponse } from '../../core/openapi/api-success-response.decorator';
import { CreateNoteDto, UpdateNoteDto } from './dtos/request.dto';
import { NoteDto } from './dtos/response.dto';
import { NotesService } from './note.service';

@Controller('notes')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('notes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List notes for the current couple' })
  @ApiSuccessResponse({ isArray: true, type: NoteDto })
  listNotes(@Req() request: AuthenticatedRequest): Promise<NoteDto[]> {
    return this.notesService.listNotes(request.auth.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a note for the current couple' })
  @ApiSuccessResponse({ status: 201, type: NoteDto })
  createNote(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.createNote(request.auth.user, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse({ type: NoteDto })
  getNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<NoteDto> {
    return this.notesService.getNote(request.auth.user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse({ type: NoteDto })
  updateNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateNoteDto,
  ): Promise<NoteDto> {
    return this.notesService.updateNote(request.auth.user, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse()
  deleteNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<null> {
    return this.notesService.deleteNote(request.auth.user, id);
  }
}
