import { MenstrualCyclePredictionService } from '@/modules/calendar/service/menstrual-cycle-prediction.service'
import { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import { PeriodTrackerService } from '@/modules/calendar/service/period-tracker.service'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { CalendarService } from '@/modules/calendar/service/calendar.service'
import { CalendarController } from '@/modules/calendar/calendar.controller'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { TensorflowModule } from '@/core/tensorflow/tensorflow.module'
import { I18nModule } from '@/core/i18n/i18n.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    AuthModule,
    I18nModule,
    TensorflowModule,
    TypeOrmModule.forFeature([CalendarEntry, CalendarPeriodDetail, CoupleMember])
  ],
  controllers: [CalendarController],
  providers: [CalendarService, MenstrualCyclePredictionService, PeriodTrackerService]
})
export class CalendarModule {}
