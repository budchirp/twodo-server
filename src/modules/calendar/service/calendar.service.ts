import {
  CalendarActivityType,
  CalendarEjaculationLocation,
  CalendarFlowLevel,
  CalendarPeriodEvent,
  CalendarPeriodSymptom,
  CalendarProtectionMethod
} from '@/modules/calendar/entity/calendar.enums'
import type {
  CalendarEntryDto,
  PeriodPredictionDto,
  PeriodRangeDto,
  PeriodTrackerSummaryDto
} from '@/modules/calendar/dto/response.dto'
import type {
  CreateCalendarEntryDto,
  ListCalendarEntriesDto,
  UpdateCalendarEntryDto
} from '@/modules/calendar/dto/request.dto'
import { MenstrualCyclePredictionService } from '@/modules/calendar/service/menstrual-cycle-prediction.service'
import {
  addDays,
  datesBetweenInclusive,
  daysBetween,
  parseDateString
} from '@/modules/calendar/util/calendar-date.util'
import { CalendarSexualActivityDetail } from '@/modules/calendar/entity/calendar-sexual-activity-detail.entity'
import { Between, DataSource, EntityManager, LessThanOrEqual, Repository } from 'typeorm'
import { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import { PeriodTrackerService } from '@/modules/calendar/service/period-tracker.service'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { isUserProfileCompleted } from '@/modules/user/util/user-profile.util'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { User, UserGender } from '@/modules/user/entity/user.entity'
import { ApiException } from '@/core/exception/api.exception'
import { CalendarMapper } from '@/modules/calendar/calendar.mapper'
import { InjectRepository } from '@nestjs/typeorm'
import { HttpStatus, Injectable } from '@nestjs/common'

const maxPeriodRangeDays = 14

@Injectable()
export class CalendarService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly predictions: MenstrualCyclePredictionService,
    private readonly periodTracker: PeriodTrackerService,
    @InjectRepository(CalendarEntry)
    private readonly entries: Repository<CalendarEntry>,
    @InjectRepository(CoupleMember)
    private readonly members: Repository<CoupleMember>
  ) {}

  async createEntry(user: User | null, body: CreateCalendarEntryDto): Promise<CalendarEntryDto> {
    const currentUser = this.completedUser(user)
    const membership = await this.currentMembership(currentUser)
    this.validateDate(body.date)
    this.validateCreatePayload(body)

    if (body.type === CalendarActivityType.Period) {
      this.assertCanManagePeriod(currentUser)
      this.validatePeriodDateRange(body.date, body.period?.endDate, body.period?.event)
      await this.assertPeriodEndHasStart(membership.coupleId, body.date, body.period?.event)
    }

    const entryId = await this.dataSource.transaction(async (manager) => {
      if (body.type === CalendarActivityType.Period && body.period?.endDate) {
        return this.savePeriodDateRange(manager, {
          coupleId: membership.coupleId,
          createdByUserId: currentUser.id,
          startDate: body.date,
          endDate: body.period.endDate,
          notes: body.notes ?? '',
          flowLevel: body.period.flowLevel ?? null,
          symptoms: body.period.symptoms ?? []
        })
      }

      const entry = await manager.save(
        CalendarEntry,
        manager.create(CalendarEntry, {
          coupleId: membership.coupleId,
          createdByUserId: currentUser.id,
          date: body.date,
          notes: body.notes ?? '',
          type: body.type
        })
      )

      if (body.type === CalendarActivityType.Period && body.period) {
        await manager.save(
          CalendarPeriodDetail,
          manager.create(CalendarPeriodDetail, {
            entryId: entry.id,
            event: body.period.event,
            flowLevel: body.period.flowLevel ?? null,
            symptoms: body.period.symptoms ?? []
          })
        )
      }

      if (body.type === CalendarActivityType.SexualActivity && body.sexualActivity) {
        await manager.save(
          CalendarSexualActivityDetail,
          manager.create(CalendarSexualActivityDetail, {
            entryId: entry.id,
            ...this.createSexualActivityDetail(body.sexualActivity)
          })
        )
      }

      return entry.id
    })

    return CalendarMapper.toCalendarEntryResponse(await this.entryById(entryId))
  }

  async listEntries(user: User | null, query: ListCalendarEntriesDto): Promise<CalendarEntryDto[]> {
    const currentUser = this.completedUser(user)
    const membership = await this.currentMembership(currentUser)
    this.validateDateRange(query.startDate, query.endDate)

    const startDate = query.startDate ?? '1970-01-01'
    const endDate = query.endDate ?? '2099-12-31'

    const entries = await this.entries.find({
      where: {
        coupleId: membership.coupleId,
        date: Between(startDate, endDate)
      },
      relations: {
        createdByUser: true,
        periodDetail: true,
        sexualActivityDetail: true
      },
      order: { date: 'ASC', createdAt: 'ASC' }
    })

    const resultEntries = entries.map((entry) => CalendarMapper.toCalendarEntryResponse(entry))

    try {
      const ranges = await this.periodRanges(user)
      if (ranges.length > 0) {
        const prediction = this.predictions.predict(ranges)
        if (
          prediction.expectedPeriodStartDate &&
          prediction.cycleLengthDays &&
          prediction.periodDurationDays
        ) {
          let projectedStart = prediction.expectedPeriodStartDate
          const cycleLength = prediction.cycleLengthDays
          const periodDuration = prediction.periodDurationDays

          for (let cycle = 0; cycle < 12; cycle++) {
            if (projectedStart > endDate) {
              break
            }

            const projectedEnd = addDays(projectedStart, periodDuration - 1)
            const peakOvulationDate = addDays(projectedStart, -14)
            const ovulationStartDate = addDays(peakOvulationDate, -5)
            const ovulationEndDate = addDays(peakOvulationDate, 1)

            // Period prediction entries
            const periodDates = datesBetweenInclusive(projectedStart, projectedEnd)
            for (const date of periodDates) {
              if (date >= startDate && date <= endDate) {
                const exists = resultEntries.some(
                  (e) =>
                    e.date === date &&
                    (e.type === CalendarActivityType.Period ||
                      e.type === CalendarActivityType.PeriodPrediction)
                )
                if (!exists) {
                  resultEntries.push({
                    id: `period-prediction-${date}`,
                    date,
                    type: CalendarActivityType.PeriodPrediction,
                    notes: 'Estimated Period',
                    createdBy: null,
                    period: null,
                    sexualActivity: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                }
              }
            }

            // Ovulation entries
            const ovulationDates = datesBetweenInclusive(ovulationStartDate, ovulationEndDate)
            for (const date of ovulationDates) {
              if (date >= startDate && date <= endDate) {
                const exists = resultEntries.some(
                  (e) => e.date === date && e.type === CalendarActivityType.Ovulation
                )
                if (!exists) {
                  resultEntries.push({
                    id: `ovulation-${date}`,
                    date,
                    type: CalendarActivityType.Ovulation,
                    notes:
                      date === peakOvulationDate ? 'Estimated Ovulation Day' : 'Fertile Window',
                    createdBy: null,
                    period: null,
                    sexualActivity: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                }
              }
            }

            projectedStart = addDays(projectedStart, cycleLength)
          }
        }
      }
    } catch {
      // Ignore prediction errors when there is insufficient period history
    }

    resultEntries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))

    return resultEntries
  }

  async getEntry(user: User | null, id: string): Promise<CalendarEntryDto> {
    const currentUser = this.completedUser(user)
    const membership = await this.currentMembership(currentUser)
    const entry = await this.entryForCouple(id, membership.coupleId)

    return CalendarMapper.toCalendarEntryResponse(entry)
  }

  async updateEntry(
    user: User | null,
    id: string,
    body: UpdateCalendarEntryDto
  ): Promise<CalendarEntryDto> {
    const currentUser = this.completedUser(user)
    const membership = await this.currentMembership(currentUser)
    const entry = await this.entryForCouple(id, membership.coupleId)
    const nextType = body.type ?? entry.type

    if (body.date !== undefined) {
      this.validateDate(body.date)
    }
    this.validateUpdatePayload(entry, body, nextType)

    if (
      entry.type === CalendarActivityType.Period ||
      nextType === CalendarActivityType.Period ||
      body.period !== undefined
    ) {
      this.assertCanManagePeriod(currentUser)
      this.validatePeriodDateRange(
        body.date ?? entry.date,
        body.period?.endDate,
        body.period?.event ?? entry.periodDetail?.event
      )
      await this.assertPeriodEndHasStart(
        membership.coupleId,
        body.date ?? entry.date,
        body.period?.event ?? entry.periodDetail?.event,
        entry.id
      )
    }

    await this.dataSource.transaction(async (manager) => {
      entry.type = nextType
      if (body.date !== undefined) {
        entry.date = body.date
      }
      if (body.notes !== undefined) {
        entry.notes = body.notes
      }

      await manager.save(CalendarEntry, entry)

      if (nextType !== CalendarActivityType.Period) {
        await manager.delete(CalendarPeriodDetail, { entryId: entry.id })
      } else if (body.period?.endDate) {
        await this.savePeriodDateRange(manager, {
          coupleId: membership.coupleId,
          createdByUserId: currentUser.id,
          startDate: entry.date,
          endDate: body.period.endDate,
          notes: entry.notes,
          flowLevel: body.period.flowLevel ?? entry.periodDetail?.flowLevel ?? null,
          startEntryId: entry.id,
          symptoms: body.period.symptoms ?? entry.periodDetail?.symptoms ?? []
        })
      } else {
        await this.savePeriodDetail(manager, entry, body)
      }

      if (nextType !== CalendarActivityType.SexualActivity) {
        await manager.delete(CalendarSexualActivityDetail, { entryId: entry.id })
      } else {
        await this.saveSexualActivityDetail(manager, entry, body)
      }
    })

    return CalendarMapper.toCalendarEntryResponse(await this.entryById(entry.id))
  }

  async deleteEntry(user: User | null, id: string): Promise<null> {
    const currentUser = this.completedUser(user)
    const membership = await this.currentMembership(currentUser)
    const entry = await this.entryForCouple(id, membership.coupleId)

    if (entry.type === CalendarActivityType.Period) {
      this.assertCanManagePeriod(currentUser)
    }

    await this.entries.remove(entry)
    return null
  }

  async getPeriodTrackerSummary(user: User | null): Promise<PeriodTrackerSummaryDto> {
    const ranges = await this.periodRanges(user)
    const cycles = this.periodTracker.cycleHistory(ranges)
    const prediction = ranges.length > 0 ? this.predictions.predict(ranges) : null

    return {
      ranges,
      cycles,
      averageCycleLengthDays: prediction?.cycleLengthDays ?? null,
      averagePeriodDurationDays: prediction?.periodDurationDays ?? null,
      prediction
    }
  }

  async getPeriodPrediction(user: User | null): Promise<PeriodPredictionDto> {
    const ranges = await this.periodRanges(user)
    if (ranges.length === 0) {
      throw new ApiException('error.prediction_unavailable', HttpStatus.CONFLICT)
    }

    return this.predictions.predict(ranges)
  }

  private async periodRanges(user: User | null): Promise<PeriodRangeDto[]> {
    const currentUser = this.completedUser(user)
    const membership = await this.currentMembership(currentUser)
    const entries = await this.entries.find({
      where: {
        coupleId: membership.coupleId,
        type: CalendarActivityType.Period
      },
      relations: { periodDetail: true },
      order: { date: 'ASC', createdAt: 'ASC' }
    })

    return this.periodTracker.buildPeriodRanges(entries)
  }

  private completedUser(user: User | null): User {
    if (!user || !isUserProfileCompleted(user)) {
      throw new ApiException('error.profile_required', HttpStatus.FORBIDDEN)
    }

    return user
  }

  private async currentMembership(user: User): Promise<CoupleMember> {
    const membership = await this.members.findOne({ where: { userId: user.id } })
    if (!membership) {
      throw new ApiException('error.couple_membership_required', HttpStatus.FORBIDDEN)
    }

    return membership
  }

  private assertCanManagePeriod(user: User): void {
    if (user.gender !== UserGender.Female) {
      throw new ApiException('error.period_management_forbidden', HttpStatus.FORBIDDEN)
    }
  }

  private async entryForCouple(id: string, coupleId: string): Promise<CalendarEntry> {
    const entry = await this.entryById(id)
    if (entry.coupleId !== coupleId) {
      throw new ApiException('error.couple_membership_required', HttpStatus.FORBIDDEN)
    }

    return entry
  }

  private async entryById(id: string): Promise<CalendarEntry> {
    const entry = await this.entries.findOne({
      where: { id },
      relations: {
        createdByUser: true,
        periodDetail: true,
        sexualActivityDetail: true
      }
    })

    if (!entry) {
      throw new ApiException('error.calendar_entry_not_found', HttpStatus.NOT_FOUND)
    }

    return entry
  }

  private async assertPeriodEndHasStart(
    coupleId: string,
    date: string,
    event?: CalendarPeriodEvent,
    excludeEntryId?: string
  ): Promise<void> {
    if (event !== CalendarPeriodEvent.End) {
      return
    }

    const entries = await this.entries.find({
      where: {
        coupleId,
        date: LessThanOrEqual(date),
        type: CalendarActivityType.Period
      },
      relations: { periodDetail: true }
    })
    const hasStart = entries.some(
      (entry) =>
        entry.id !== excludeEntryId && entry.periodDetail?.event === CalendarPeriodEvent.Start
    )

    if (!hasStart) {
      throw new ApiException('error.invalid_period_range', HttpStatus.BAD_REQUEST)
    }
  }

  private validateCreatePayload(body: CreateCalendarEntryDto): void {
    if (body.type === CalendarActivityType.Period) {
      if (!body.period || body.sexualActivity) {
        throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
      }
      return
    }

    if (body.type === CalendarActivityType.SexualActivity) {
      if (!body.sexualActivity || body.period) {
        throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
      }
      this.validateSexualActivityPayload(body.sexualActivity)
      return
    }

    if (body.period || body.sexualActivity) {
      throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
    }
  }

  private validateUpdatePayload(
    entry: CalendarEntry,
    body: UpdateCalendarEntryDto,
    nextType: CalendarActivityType
  ): void {
    if (nextType === CalendarActivityType.Period) {
      const hasPeriodDetail = !!body.period || !!entry.periodDetail
      const canCreatePeriodDetail = !!entry.periodDetail || !!body.period?.event
      if (!hasPeriodDetail || !canCreatePeriodDetail || body.sexualActivity) {
        throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
      }
      return
    }

    if (nextType === CalendarActivityType.SexualActivity) {
      const hasSexualActivityDetail = !!body.sexualActivity || !!entry.sexualActivityDetail
      const canCreateSexualActivityDetail =
        !!entry.sexualActivityDetail ||
        (body.sexualActivity?.sexOccurred !== undefined &&
          body.sexualActivity.protectionMethod !== undefined &&
          body.sexualActivity.ejaculationLocation !== undefined)
      if (!hasSexualActivityDetail || !canCreateSexualActivityDetail || body.period) {
        throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
      }
      if (body.sexualActivity) {
        this.validateSexualActivityPayload(this.mergeSexualActivityDetail(entry, body))
      }
      return
    }

    if (body.period || body.sexualActivity) {
      throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
    }
  }

  private validateSexualActivityPayload(detail: Partial<CalendarSexualActivityDetail>): void {
    const sexOccurred = detail.sexOccurred ?? false
    const protectionMethod = detail.protectionMethod ?? CalendarProtectionMethod.None
    const ejaculationLocation = detail.ejaculationLocation ?? CalendarEjaculationLocation.None

    if (
      !sexOccurred &&
      (protectionMethod !== CalendarProtectionMethod.None ||
        ejaculationLocation !== CalendarEjaculationLocation.None)
    ) {
      throw new ApiException('error.invalid_activity_payload', HttpStatus.BAD_REQUEST)
    }
  }

  private validateDateRange(startDate?: string, endDate?: string): void {
    if (startDate) {
      this.validateDate(startDate)
    }
    if (endDate) {
      this.validateDate(endDate)
    }

    if (startDate && endDate && startDate > endDate) {
      throw new ApiException('error.invalid_calendar_date_range', HttpStatus.BAD_REQUEST)
    }
  }

  private validateDate(date: string): void {
    if (!parseDateString(date)) {
      throw new ApiException('error.invalid_calendar_date_range', HttpStatus.BAD_REQUEST)
    }
  }

  private validatePeriodDateRange(
    startDate: string,
    endDate?: string,
    event?: CalendarPeriodEvent
  ): void {
    if (!endDate) {
      return
    }

    this.validateDate(endDate)

    if (event !== CalendarPeriodEvent.Start || startDate > endDate) {
      throw new ApiException('error.invalid_period_range', HttpStatus.BAD_REQUEST)
    }

    if (daysBetween(startDate, endDate) + 1 > maxPeriodRangeDays) {
      throw new ApiException('error.invalid_period_range', HttpStatus.BAD_REQUEST)
    }
  }

  private async savePeriodDateRange(
    manager: EntityManager,
    options: {
      coupleId: string
      createdByUserId: string
      endDate: string
      flowLevel: CalendarFlowLevel | null
      notes: string
      startDate: string
      startEntryId?: string
      symptoms: CalendarPeriodSymptom[]
    }
  ): Promise<string> {
    const dates = datesBetweenInclusive(options.startDate, options.endDate)
    const existingEntries = await manager.find(CalendarEntry, {
      where: {
        coupleId: options.coupleId,
        date: Between(options.startDate, options.endDate),
        type: CalendarActivityType.Period
      },
      relations: { periodDetail: true },
      order: { createdAt: 'ASC' }
    })
    let startEntryId = options.startEntryId

    for (const [index, date] of dates.entries()) {
      const isStartDate = date === options.startDate
      let entry = this.periodEntryForDate(
        existingEntries,
        date,
        isStartDate ? options.startEntryId : undefined
      )

      if (!entry) {
        entry = await manager.save(
          CalendarEntry,
          manager.create(CalendarEntry, {
            coupleId: options.coupleId,
            createdByUserId: options.createdByUserId,
            date,
            notes: isStartDate ? options.notes : '',
            type: CalendarActivityType.Period
          })
        )
        existingEntries.push(entry)
      } else if (isStartDate) {
        entry.notes = options.notes
        entry.type = CalendarActivityType.Period
        await manager.save(CalendarEntry, entry)
      }

      if (isStartDate) {
        startEntryId = entry.id
      }

      await this.saveGeneratedPeriodDetail(manager, entry, {
        event: this.periodEventForDateIndex(index, dates.length),
        flowLevel: options.flowLevel,
        symptoms: options.symptoms
      })
    }

    return startEntryId ?? existingEntries[0].id
  }

  private periodEntryForDate(
    entries: CalendarEntry[],
    date: string,
    preferredEntryId?: string
  ): CalendarEntry | null {
    const sameDateEntries = entries.filter((entry) => entry.date === date)

    return (
      sameDateEntries.find((entry) => entry.id === preferredEntryId) ?? sameDateEntries[0] ?? null
    )
  }

  private periodEventForDateIndex(index: number, length: number): CalendarPeriodEvent {
    if (index === 0) {
      return CalendarPeriodEvent.Start
    }
    if (index === length - 1) {
      return CalendarPeriodEvent.End
    }
    return CalendarPeriodEvent.Day
  }

  private async saveGeneratedPeriodDetail(
    manager: EntityManager,
    entry: CalendarEntry,
    values: {
      event: CalendarPeriodEvent
      flowLevel: CalendarFlowLevel | null
      symptoms: CalendarPeriodSymptom[]
    }
  ): Promise<void> {
    const detail =
      entry.periodDetail ??
      manager.create(CalendarPeriodDetail, {
        entryId: entry.id
      })

    detail.event = values.event
    detail.flowLevel = values.flowLevel
    detail.symptoms = values.symptoms
    entry.periodDetail = detail

    await manager.save(CalendarPeriodDetail, detail)
  }

  private createSexualActivityDetail(
    detail: Partial<CalendarSexualActivityDetail>
  ): Partial<CalendarSexualActivityDetail> {
    const protectionMethod = detail.protectionMethod ?? CalendarProtectionMethod.None

    return {
      sexOccurred: detail.sexOccurred ?? false,
      protectionMethod,
      ejaculationLocation: detail.ejaculationLocation ?? CalendarEjaculationLocation.None
    }
  }

  private mergeSexualActivityDetail(
    entry: CalendarEntry,
    body: UpdateCalendarEntryDto
  ): Partial<CalendarSexualActivityDetail> {
    return {
      ...(entry.sexualActivityDetail ?? {}),
      ...(body.sexualActivity ?? {})
    }
  }

  private async savePeriodDetail(
    manager: EntityManager,
    entry: CalendarEntry,
    body: UpdateCalendarEntryDto
  ): Promise<void> {
    if (!body.period && entry.periodDetail) {
      return
    }

    const detail =
      entry.periodDetail ??
      manager.create(CalendarPeriodDetail, {
        entryId: entry.id
      })

    detail.event = body.period?.event ?? detail.event
    detail.flowLevel = body.period?.flowLevel ?? detail.flowLevel ?? null
    detail.symptoms = body.period?.symptoms ?? detail.symptoms ?? []

    await manager.save(CalendarPeriodDetail, detail)
  }

  private async saveSexualActivityDetail(
    manager: EntityManager,
    entry: CalendarEntry,
    body: UpdateCalendarEntryDto
  ): Promise<void> {
    if (!body.sexualActivity && entry.sexualActivityDetail) {
      return
    }

    const merged = this.createSexualActivityDetail(this.mergeSexualActivityDetail(entry, body))
    const detail =
      entry.sexualActivityDetail ??
      manager.create(CalendarSexualActivityDetail, { entryId: entry.id })

    Object.assign(detail, merged)
    await manager.save(CalendarSexualActivityDetail, detail)
  }
}
