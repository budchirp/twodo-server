import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../core/auth/auth.module';
import { CoupleMember } from '../couples/entities/couple-member.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarEntry } from './entities/calendar-entry.entity';
import { CalendarPeriodDetail } from './entities/calendar-period-detail.entity';
import { CalendarSexualActivityDetail } from './entities/calendar-sexual-activity-detail.entity';
import { MenstrualCyclePredictionService } from './menstrual-cycle-prediction.service';
import { PeriodTrackerService } from './period-tracker.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      CalendarEntry,
      CalendarPeriodDetail,
      CalendarSexualActivityDetail,
      CoupleMember,
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService, MenstrualCyclePredictionService, PeriodTrackerService],
})
export class CalendarModule {}
