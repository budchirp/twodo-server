import {
  CalendarActivityType,
  CalendarFlowLevel,
  CalendarPeriodEvent,
  CalendarPeriodSymptom
} from '@/modules/calendar/entity/calendar.enums'
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

const dateExample = '2026-05-28'
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export class CalendarPeriodDetailsDto {
  @ApiProperty({ enum: CalendarPeriodEvent })
  @IsEnum(CalendarPeriodEvent)
  event: CalendarPeriodEvent

  @ApiPropertyOptional({ example: dateExample, format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  endDate?: string

  @ApiPropertyOptional({ enum: CalendarFlowLevel, nullable: true })
  @IsOptional()
  @IsEnum(CalendarFlowLevel)
  flowLevel?: CalendarFlowLevel

  @ApiPropertyOptional({ enum: CalendarPeriodSymptom, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CalendarPeriodSymptom, { each: true })
  symptoms?: CalendarPeriodSymptom[]
}

export class UpdateCalendarPeriodDetailsDto {
  @ApiPropertyOptional({ enum: CalendarPeriodEvent })
  @IsOptional()
  @IsEnum(CalendarPeriodEvent)
  event?: CalendarPeriodEvent

  @ApiPropertyOptional({ example: '2026-05-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  endDate?: string

  @ApiPropertyOptional({ enum: CalendarFlowLevel, nullable: true })
  @IsOptional()
  @IsEnum(CalendarFlowLevel)
  flowLevel?: CalendarFlowLevel

  @ApiPropertyOptional({ enum: CalendarPeriodSymptom, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CalendarPeriodSymptom, { each: true })
  symptoms?: CalendarPeriodSymptom[]
}

export class CreateCalendarEntryDto {
  @ApiProperty({ example: dateExample, format: 'date' })
  @IsDateString()
  @Matches(datePattern)
  date: string

  @ApiProperty({ enum: CalendarActivityType })
  @IsEnum(CalendarActivityType)
  type: CalendarActivityType

  @ApiPropertyOptional({ example: 'Mild cramps' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string

  @ApiPropertyOptional({ type: () => CalendarPeriodDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarPeriodDetailsDto)
  period?: CalendarPeriodDetailsDto
}

export class UpdateCalendarEntryDto {
  @ApiPropertyOptional({ example: dateExample, format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  date?: string

  @ApiPropertyOptional({ enum: CalendarActivityType })
  @IsOptional()
  @IsEnum(CalendarActivityType)
  type?: CalendarActivityType

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string

  @ApiPropertyOptional({ type: () => UpdateCalendarPeriodDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCalendarPeriodDetailsDto)
  period?: UpdateCalendarPeriodDetailsDto
}

export class ListCalendarEntriesDto {
  @ApiPropertyOptional({ example: '2026-05-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  startDate?: string

  @ApiPropertyOptional({ example: '2026-05-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  endDate?: string
}
