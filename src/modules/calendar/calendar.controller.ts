import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import {
  CreateCalendarEntryDto,
  ListCalendarEntriesDto,
  UpdateCalendarEntryDto
} from '@/modules/calendar/dto/request.dto'
import {
  CalendarEntryDto,
  PeriodPredictionDto,
  PeriodTrackerSummaryDto
} from '@/modules/calendar/dto/response.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common'
import { ProfileCompletionGuard } from '@/modules/auth/guard/profile-completion.guard'
import { ApiSuccessResponse } from '@/core/openapi/api-success-response.decorator'
import { CalendarService } from '@/modules/calendar/service/calendar.service'
import type { AuthenticatedRequest } from '@/modules/auth/auth.types'
import { AuthGuard } from '@/modules/auth/guard/auth.guard'
import { ApiErrorEnvelopeDto } from '@/core/openapi/api-response.dto'

@Controller('calendar')
@UseGuards(AuthGuard, ProfileCompletionGuard)
@ApiTags('calendar')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ApiErrorEnvelopeDto })
@ApiForbiddenResponse({ type: ApiErrorEnvelopeDto })
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @ApiOperation({ summary: 'Create a calendar entry for the current couple' })
  @ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ status: 201, type: CalendarEntryDto })
  createEntry(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateCalendarEntryDto
  ): Promise<CalendarEntryDto> {
    return this.calendarService.createEntry(request.auth.user, body)
  }

  @Get()
  @ApiOperation({ summary: 'List calendar entries for the current couple' })
  @ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ isArray: true, type: CalendarEntryDto })
  listEntries(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListCalendarEntriesDto
  ): Promise<CalendarEntryDto[]> {
    return this.calendarService.listEntries(request.auth.user, query)
  }

  @Get('period-tracker/summary')
  @ApiOperation({ summary: 'Get period tracker summary for the current couple' })
  @ApiSuccessResponse({ type: PeriodTrackerSummaryDto })
  getPeriodTrackerSummary(@Req() request: AuthenticatedRequest): Promise<PeriodTrackerSummaryDto> {
    return this.calendarService.getPeriodTrackerSummary(request.auth.user)
  }

  @Get('period-tracker/prediction')
  @ApiOperation({ summary: 'Get period and ovulation prediction' })
  @ApiConflictResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ type: PeriodPredictionDto })
  getPeriodPrediction(@Req() request: AuthenticatedRequest): Promise<PeriodPredictionDto> {
    return this.calendarService.getPeriodPrediction(request.auth.user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a calendar entry by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ type: CalendarEntryDto })
  getEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string
  ): Promise<CalendarEntryDto> {
    return this.calendarService.getEntry(request.auth.user, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a calendar entry by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBadRequestResponse({ type: ApiErrorEnvelopeDto })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse({ type: CalendarEntryDto })
  updateEntry(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateCalendarEntryDto
  ): Promise<CalendarEntryDto> {
    return this.calendarService.updateEntry(request.auth.user, id, body)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar entry by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ type: ApiErrorEnvelopeDto })
  @ApiSuccessResponse()
  deleteEntry(@Req() request: AuthenticatedRequest, @Param('id') id: string): Promise<null> {
    return this.calendarService.deleteEntry(request.auth.user, id)
  }
}
