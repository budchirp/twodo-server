import type {
  CalendarEntryDto,
  CalendarPeriodDetailsResponseDto,
  CalendarSexualActivityDetailsResponseDto
} from '@/modules/calendar/dto/response.dto'
import type { CalendarSexualActivityDetail } from '@/modules/calendar/entity/calendar-sexual-activity-detail.entity'
import type { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import type { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { UserMapper } from '@/modules/user/user.mapper'

export class CalendarMapper {
  static toCalendarEntryResponse(entry: CalendarEntry): CalendarEntryDto {
    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      notes: entry.notes,
      createdBy: entry.createdByUser ? UserMapper.toUserSummary(entry.createdByUser) : null,
      period: entry.periodDetail
        ? CalendarMapper.toPeriodDetailsResponse(entry.periodDetail)
        : null,
      sexualActivity: entry.sexualActivityDetail
        ? CalendarMapper.toSexualActivityDetailsResponse(entry.sexualActivityDetail)
        : null,
      createdAt: entry.createdAt ? entry.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : new Date().toISOString()
    }
  }

  private static toPeriodDetailsResponse(
    detail: CalendarPeriodDetail
  ): CalendarPeriodDetailsResponseDto {
    return {
      event: detail.event,
      flowLevel: detail.flowLevel,
      symptoms: detail.symptoms ?? []
    }
  }

  private static toSexualActivityDetailsResponse(
    detail: CalendarSexualActivityDetail
  ): CalendarSexualActivityDetailsResponseDto {
    return {
      sexOccurred: detail.sexOccurred,
      protectionMethod: detail.protectionMethod,
      ejaculationLocation: detail.ejaculationLocation
    }
  }
}
