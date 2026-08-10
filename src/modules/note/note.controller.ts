import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ProfileCompletionGuard } from '@/modules/auth/guard/profile-completion.guard'
import { ApiSuccessResponse } from '@/core/openapi/api-success-response.decorator'
import { CreateNoteDto, UpdateNoteDto } from '@/modules/note/dto/request.dto'
import { NoteService } from '@/modules/note/service/note.service'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { AuthGuard } from '@/modules/auth/guard/auth.guard'
import { ApiErrorEnvelopeDto } from '@/core/openapi/api-response.dto'
import { NoteDto } from '@/modules/note/dto/response.dto'

@Controller('notes')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('notes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Get()
  @ApiOperation({ summary: 'List notes for the current couple' })
  @ApiSuccessResponse({ isArray: true, type: NoteDto })
  listNotes(@Req() request: AuthenticatedRequest): Promise<NoteDto[]> {
    return this.noteService.listNotes(request.auth.user)
  }

  @Post()
  @ApiOperation({ summary: 'Create a note for the current couple' })
  @ApiSuccessResponse({ status: 201, type: NoteDto })
  createNote(@Req() request: AuthenticatedRequest, @Body() body: CreateNoteDto): Promise<NoteDto> {
    return this.noteService.createNote(request.auth.user, body)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse({ type: NoteDto })
  getNote(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<NoteDto> {
    return this.noteService.getNote(request.auth.user, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse({ type: NoteDto })
  updateNote(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateNoteDto
  ): Promise<NoteDto> {
    return this.noteService.updateNote(request.auth.user, id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiSuccessResponse()
  deleteNote(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<null> {
    return this.noteService.deleteNote(request.auth.user, id)
  }
}
