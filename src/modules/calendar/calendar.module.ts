import { MenstrualCyclePredictionService } from '@/modules/calendar/service/menstrual-cycle-prediction.service'
import { CalendarSexualActivityDetail } from '@/modules/calendar/entity/calendar-sexual-activity-detail.entity'
import { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import { PeriodTrackerService } from '@/modules/calendar/service/period-tracker.service'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { CalendarService } from '@/modules/calendar/service/calendar.service'
import { CalendarController } from '@/modules/calendar/calendar.controller'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { AuthModule } from '@/modules/auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      CalendarEntry,
      CalendarPeriodDetail,
      CalendarSexualActivityDetail,
      CoupleMember
    ])
  ],
  controllers: [CalendarController],
  providers: [CalendarService, MenstrualCyclePredictionService, PeriodTrackerService]
})
export class CalendarModule {}
