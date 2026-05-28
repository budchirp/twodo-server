import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CalendarActivityType,
  CalendarEjaculationLocation,
  CalendarFlowLevel,
  CalendarPeriodEvent,
  CalendarPeriodSymptom,
  CalendarProtectionMethod,
} from '../entities/calendar.enums';

const dateExample = '2026-05-28';
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class CalendarPeriodDetailsDto {
  @ApiProperty({ enum: CalendarPeriodEvent })
  @IsEnum(CalendarPeriodEvent)
  event: CalendarPeriodEvent;

  @ApiPropertyOptional({ example: '2026-05-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  endDate?: string;

  @ApiPropertyOptional({ enum: CalendarFlowLevel, nullable: true })
  @IsOptional()
  @IsEnum(CalendarFlowLevel)
  flowLevel?: CalendarFlowLevel;

  @ApiPropertyOptional({ enum: CalendarPeriodSymptom, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CalendarPeriodSymptom, { each: true })
  symptoms?: CalendarPeriodSymptom[];
}

export class UpdateCalendarPeriodDetailsDto {
  @ApiPropertyOptional({ enum: CalendarPeriodEvent })
  @IsOptional()
  @IsEnum(CalendarPeriodEvent)
  event?: CalendarPeriodEvent;

  @ApiPropertyOptional({ example: '2026-05-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  endDate?: string;

  @ApiPropertyOptional({ enum: CalendarFlowLevel, nullable: true })
  @IsOptional()
  @IsEnum(CalendarFlowLevel)
  flowLevel?: CalendarFlowLevel;

  @ApiPropertyOptional({ enum: CalendarPeriodSymptom, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CalendarPeriodSymptom, { each: true })
  symptoms?: CalendarPeriodSymptom[];
}

export class CalendarSexualActivityDetailsDto {
  @ApiProperty()
  @IsBoolean()
  sexOccurred: boolean;

  @ApiProperty({ enum: CalendarProtectionMethod })
  @IsEnum(CalendarProtectionMethod)
  protectionMethod: CalendarProtectionMethod;

  @ApiProperty({ enum: CalendarEjaculationLocation })
  @IsEnum(CalendarEjaculationLocation)
  ejaculationLocation: CalendarEjaculationLocation;
}

export class UpdateCalendarSexualActivityDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sexOccurred?: boolean;

  @ApiPropertyOptional({ enum: CalendarProtectionMethod })
  @IsOptional()
  @IsEnum(CalendarProtectionMethod)
  protectionMethod?: CalendarProtectionMethod;

  @ApiPropertyOptional({ enum: CalendarEjaculationLocation })
  @IsOptional()
  @IsEnum(CalendarEjaculationLocation)
  ejaculationLocation?: CalendarEjaculationLocation;
}

export class CreateCalendarEntryDto {
  @ApiProperty({ example: dateExample, format: 'date' })
  @IsDateString()
  @Matches(datePattern)
  date: string;

  @ApiProperty({ enum: CalendarActivityType })
  @IsEnum(CalendarActivityType)
  type: CalendarActivityType;

  @ApiPropertyOptional({ example: 'Mild cramps' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ type: () => CalendarPeriodDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarPeriodDetailsDto)
  period?: CalendarPeriodDetailsDto;

  @ApiPropertyOptional({ type: () => CalendarSexualActivityDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CalendarSexualActivityDetailsDto)
  sexualActivity?: CalendarSexualActivityDetailsDto;
}

export class UpdateCalendarEntryDto {
  @ApiPropertyOptional({ example: dateExample, format: 'date' })
  @IsOptional()
  @IsDateString()
  @Matches(datePattern)
  date?: string;

  @ApiPropertyOptional({ enum: CalendarActivityType })
  @IsOptional()
  @IsEnum(CalendarActivityType)
  type?: CalendarActivityType;

  @ApiPropertyOptional({ example: 'Updated notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ type: () => UpdateCalendarPeriodDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCalendarPeriodDetailsDto)
  period?: UpdateCalendarPeriodDetailsDto;

  @ApiPropertyOptional({ type: () => UpdateCalendarSexualActivityDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCalendarSexualActivityDetailsDto)
  sexualActivity?: UpdateCalendarSexualActivityDetailsDto;
}

export class ListCalendarEntriesDto {
  @ApiProperty({ example: '2026-05-01', format: 'date' })
  @IsDateString()
  @Matches(datePattern)
  startDate: string;

  @ApiProperty({ example: '2026-05-31', format: 'date' })
  @IsDateString()
  @Matches(datePattern)
  endDate: string;
}
