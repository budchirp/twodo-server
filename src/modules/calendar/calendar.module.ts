import { MenstrualCyclePredictionService } from '@/modules/calendar/service/menstrual-cycle-prediction.service'
import { CalendarSexualActivityDetail } from '@/modules/calendar/entity/calendar-sexual-activity-detail.entity'
import { PregnancyAssessmentService } from '@/modules/calendar/service/pregnancy-assessment.service'
import { CalendarPeriodDetail } from '@/modules/calendar/entity/calendar-period-detail.entity'
import { FertilityWindowService } from '@/modules/calendar/service/fertility-window.service'
import { ConceptionRiskService } from '@/modules/calendar/service/conception-risk.service'
import { PeriodTrackerService } from '@/modules/calendar/service/period-tracker.service'
import { CoupleMember } from '@/modules/couple/entity/couple-member.entity'
import { CalendarService } from '@/modules/calendar/service/calendar.service'
import { CalendarController } from '@/modules/calendar/calendar.controller'
import { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { TensorflowModule } from '@/core/tensorflow/tensorflow.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    AuthModule,
    TensorflowModule,
    TypeOrmModule.forFeature([
      CalendarEntry,
      CalendarPeriodDetail,
      CalendarSexualActivityDetail,
      CoupleMember
    ])
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    MenstrualCyclePredictionService,
    FertilityWindowService,
    ConceptionRiskService,
    PregnancyAssessmentService,
    PeriodTrackerService
  ]
})
export class CalendarModule {}
