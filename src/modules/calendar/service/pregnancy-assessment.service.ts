import type {
  ConceptionRiskAssessmentDto,
  FertilityWindowEstimateDto,
  PeriodPredictionDto,
  PregnancyAssessmentDto
} from '@/modules/calendar/dto/response.dto'
import {
  ConceptionRiskLevel,
  PregnancyAssessmentStatus
} from '@/modules/calendar/entity/calendar.enums'
import { daysBetween, todayDateString } from '@/modules/calendar/util/calendar-date.util'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PregnancyAssessmentService {
  assessPregnancyStatus(
    prediction: PeriodPredictionDto,
    fertilityWindow: FertilityWindowEstimateDto,
    conceptionRisk: ConceptionRiskAssessmentDto
  ): PregnancyAssessmentDto {
    if (!prediction.hasEnoughData || !prediction.expectedPeriodStartDate) {
      return {
        status: PregnancyAssessmentStatus.Unknown,
        confidence: 'low',
        expectedPeriodDate: null,
        daysLate: 0,
        conceptionRisk,
        needsPregnancyTest: false,
        explanation:
          'Insufficient cycle data to determine period timeliness or pregnancy likelihood.'
      }
    }

    const expectedPeriodDate = prediction.expectedPeriodStartDate
    const daysDiff = daysBetween(expectedPeriodDate, todayDateString())
    const daysLate = Math.max(0, daysDiff)

    let status = PregnancyAssessmentStatus.NotDue
    let needsPregnancyTest = false
    let explanation = `Expected period date: ${expectedPeriodDate}.`

    if (daysDiff > 3) {
      if (
        conceptionRisk.level === ConceptionRiskLevel.High ||
        conceptionRisk.level === ConceptionRiskLevel.Moderate
      ) {
        status = PregnancyAssessmentStatus.PossiblePregnancy
        needsPregnancyTest = true
        explanation += ` Period is ${daysLate} day(s) late with recorded ${conceptionRisk.level} risk intercourse during the fertile window. A home pregnancy test is recommended.`
      } else {
        status = PregnancyAssessmentStatus.PeriodLate
        needsPregnancyTest = daysLate >= 7
        explanation += ` Period is ${daysLate} day(s) late. No high-risk intercourse recorded during the fertile window.`
      }
    } else if (daysDiff >= -2) {
      status = PregnancyAssessmentStatus.PeriodDue
      explanation += ' Period is currently due or expected within the next 2 days.'
    } else {
      explanation += ' Period is not yet due.'
    }

    return {
      status,
      confidence:
        prediction.reliability === 'high' && conceptionRisk.confidence === 'high'
          ? 'high'
          : 'medium',
      expectedPeriodDate,
      daysLate,
      conceptionRisk,
      needsPregnancyTest,
      explanation
    }
  }
}
