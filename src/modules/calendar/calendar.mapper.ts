import { UserMapper } from '../users/user.mapper';
import {
  CalendarEntryDto,
  CalendarPeriodDetailsResponseDto,
  CalendarSexualActivityDetailsResponseDto,
} from './dtos/response.dto';
import { CalendarEntry } from './entities/calendar-entry.entity';
import { CalendarPeriodDetail } from './entities/calendar-period-detail.entity';
import { CalendarSexualActivityDetail } from './entities/calendar-sexual-activity-detail.entity';

export class CalendarMapper {
  static toCalendarEntryResponse(entry: CalendarEntry): CalendarEntryDto {
    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      notes: entry.notes,
      createdBy: UserMapper.toUserSummary(entry.createdByUser),
      period: entry.periodDetail
        ? CalendarMapper.toPeriodDetailsResponse(entry.periodDetail)
        : null,
      sexualActivity: entry.sexualActivityDetail
        ? CalendarMapper.toSexualActivityDetailsResponse(
            entry.sexualActivityDetail,
          )
        : null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private static toPeriodDetailsResponse(
    detail: CalendarPeriodDetail,
  ): CalendarPeriodDetailsResponseDto {
    return {
      event: detail.event,
      flowLevel: detail.flowLevel,
      symptoms: detail.symptoms ?? [],
    };
  }

  private static toSexualActivityDetailsResponse(
    detail: CalendarSexualActivityDetail,
  ): CalendarSexualActivityDetailsResponseDto {
    return {
      sexOccurred: detail.sexOccurred,
      protectionMethod: detail.protectionMethod,
      ejaculationLocation: detail.ejaculationLocation,
    };
  }
}
