import {
  CalendarActivityType,
  CalendarFlowLevel,
  CalendarPeriodEvent,
  CalendarPeriodSymptom,
  PeriodPredictionReliability
} from '@/modules/calendar/entity/calendar.enums'
import { UserSummaryDto } from '@/modules/user/dto/response.dto'
import { ApiProperty } from '@nestjs/swagger'

export class CalendarPeriodDetailsResponseDto {
  @ApiProperty({ enum: CalendarPeriodEvent })
  event: CalendarPeriodEvent

  @ApiProperty({ enum: CalendarFlowLevel, nullable: true })
  flowLevel: CalendarFlowLevel | null

  @ApiProperty({ enum: CalendarPeriodSymptom, isArray: true })
  symptoms: CalendarPeriodSymptom[]
}

export class CalendarEntryDto {
  @ApiProperty()
  id: string

  @ApiProperty({ format: 'date' })
  date: string

  @ApiProperty({ enum: CalendarActivityType })
  type: CalendarActivityType

  @ApiProperty()
  notes: string

  @ApiProperty({ nullable: true, type: () => UserSummaryDto })
  createdBy: UserSummaryDto | null

  @ApiProperty({ nullable: true, type: () => CalendarPeriodDetailsResponseDto })
  period: CalendarPeriodDetailsResponseDto | null

  @ApiProperty({ format: 'date-time' })
  createdAt: string

  @ApiProperty({ format: 'date-time' })
  updatedAt: string
}

export class DateWindowDto {
  @ApiProperty({ format: 'date' })
  startDate: string

  @ApiProperty({ format: 'date' })
  endDate: string
}

export class PeriodRangeDto {
  @ApiProperty({ format: 'date' })
  startDate: string

  @ApiProperty({ format: 'date' })
  endDate: string

  @ApiProperty()
  durationDays: number

  @ApiProperty()
  isComplete: boolean

  @ApiProperty({ enum: CalendarFlowLevel, isArray: true })
  flowLevels: CalendarFlowLevel[]

  @ApiProperty({ enum: CalendarPeriodSymptom, isArray: true })
  symptoms: CalendarPeriodSymptom[]
}

export class CycleHistoryDto {
  @ApiProperty({ format: 'date' })
  periodStartDate: string

  @ApiProperty({ format: 'date' })
  periodEndDate: string

  @ApiProperty()
  periodDurationDays: number

  @ApiProperty({ nullable: true, type: Number })
  cycleLengthDays: number | null
}

export class PeriodPredictionDto {
  @ApiProperty()
  hasEnoughData: boolean

  @ApiProperty({ enum: PeriodPredictionReliability })
  reliability: PeriodPredictionReliability

  @ApiProperty({ nullable: true, type: () => DateWindowDto })
  nextPeriodWindow: DateWindowDto | null

  @ApiProperty({ nullable: true, type: () => DateWindowDto })
  ovulationWindow: DateWindowDto | null

  @ApiProperty({ format: 'date', nullable: true, type: String })
  expectedPeriodStartDate: string | null

  @ApiProperty({ format: 'date', nullable: true, type: String })
  expectedPeriodEndDate: string | null

  @ApiProperty({ nullable: true, type: Number })
  cycleLengthDays: number | null

  @ApiProperty({ nullable: true, type: Number })
  periodDurationDays: number | null

  @ApiProperty({ nullable: true, type: Number })
  cycleLengthVariabilityDays: number | null

  @ApiProperty({ nullable: true, type: Number })
  predictionUncertaintyDays: number | null

  @ApiProperty()
  recentIrregularity: boolean

  @ApiProperty()
  basis: string

  @ApiProperty()
  disclaimer: string
}

export class CalendarPredictionSummaryDto {
  @ApiProperty({ nullable: true, type: () => PeriodPredictionDto })
  cyclePrediction: PeriodPredictionDto

  @ApiProperty({ isArray: true, type: () => PeriodRangeDto })
  ranges: PeriodRangeDto[]

  @ApiProperty({ isArray: true, type: () => CycleHistoryDto })
  cycles: CycleHistoryDto[]
}

export class PeriodTrackerSummaryDto {
  @ApiProperty({ isArray: true, type: () => PeriodRangeDto })
  ranges: PeriodRangeDto[]

  @ApiProperty({ isArray: true, type: () => CycleHistoryDto })
  cycles: CycleHistoryDto[]

  @ApiProperty({ nullable: true, type: Number })
  averageCycleLengthDays: number | null

  @ApiProperty({ nullable: true, type: Number })
  averagePeriodDurationDays: number | null

  @ApiProperty({ nullable: true, type: () => PeriodPredictionDto })
  prediction: PeriodPredictionDto | null
}
