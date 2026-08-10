import {
  CalendarFlowLevel,
  CalendarPeriodEvent,
  CalendarPeriodSymptom
} from '@/modules/calendar/entity/calendar.enums'
import type { CycleHistoryDto, PeriodRangeDto } from '@/modules/calendar/dto/response.dto'
import type { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { daysBetween } from '@/modules/calendar/util/calendar-date.util'
import { Injectable } from '@nestjs/common'

type PeriodRangeBuilder = {
  startDate: string
  endDate: string
  hasEnd: boolean
  flowLevels: Set<CalendarFlowLevel>
  symptoms: Set<CalendarPeriodSymptom>
}

@Injectable()
export class PeriodTrackerService {
  buildPeriodRanges(entries: CalendarEntry[]): PeriodRangeDto[] {
    const ranges: PeriodRangeDto[] = []
    let current: PeriodRangeBuilder | null = null

    for (const entry of entries) {
      const detail = entry.periodDetail
      if (!detail) {
        continue
      }

      if (detail.event === CalendarPeriodEvent.Start) {
        if (current) {
          ranges.push(this.toPeriodRange(current))
        }
        current = this.createPeriodRange(entry.date)
      }

      if (!current) {
        current = this.createPeriodRange(entry.date)
      }

      this.addPeriodEntry(current, entry)

      if (detail.event === CalendarPeriodEvent.End) {
        current.endDate = entry.date
        current.hasEnd = true
        ranges.push(this.toPeriodRange(current))
        current = null
      }
    }

    if (current) {
      ranges.push(this.toPeriodRange(current))
    }

    return ranges
  }

  cycleHistory(ranges: PeriodRangeDto[]): CycleHistoryDto[] {
    return ranges.map((range, index) => ({
      periodStartDate: range.startDate,
      periodEndDate: range.endDate,
      periodDurationDays: range.durationDays,
      cycleLengthDays:
        index === 0 ? null : daysBetween(ranges[index - 1].startDate, range.startDate)
    }))
  }

  private createPeriodRange(startDate: string): PeriodRangeBuilder {
    return {
      startDate,
      endDate: startDate,
      hasEnd: false,
      flowLevels: new Set(),
      symptoms: new Set()
    }
  }

  private addPeriodEntry(range: PeriodRangeBuilder, entry: CalendarEntry): void {
    const detail = entry.periodDetail
    if (!detail) {
      return
    }

    if (entry.date > range.endDate) {
      range.endDate = entry.date
    }
    if (detail.flowLevel) {
      range.flowLevels.add(detail.flowLevel)
    }
    for (const symptom of detail.symptoms ?? []) {
      range.symptoms.add(symptom)
    }
  }

  private toPeriodRange(range: PeriodRangeBuilder): PeriodRangeDto {
    return {
      startDate: range.startDate,
      endDate: range.endDate,
      durationDays: daysBetween(range.startDate, range.endDate) + 1,
      isComplete: range.hasEnd,
      flowLevels: [...range.flowLevels],
      symptoms: [...range.symptoms]
    }
  }
}
