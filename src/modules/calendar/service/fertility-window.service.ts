import type {
  FertilityWindowEstimateDto,
  PeriodPredictionDto
} from '@/modules/calendar/dto/response.dto'
import { PeriodPredictionReliability } from '@/modules/calendar/entity/calendar.enums'
import { addDays } from '@/modules/calendar/util/calendar-date.util'
import { Injectable } from '@nestjs/common'

@Injectable()
export class FertilityWindowService {
  estimateFertilityWindow(prediction: PeriodPredictionDto): FertilityWindowEstimateDto {
    if (!prediction.hasEnoughData || !prediction.expectedPeriodStartDate) {
      return {
        ovulationDate: prediction.ovulationWindow
          ? addDays(prediction.ovulationWindow.startDate, 5)
          : null,
        fertileWindowStartDate: prediction.ovulationWindow?.startDate ?? null,
        fertileWindowEndDate: prediction.ovulationWindow?.endDate ?? null,
        uncertaintyDays: prediction.predictionUncertaintyDays ?? 4,
        reliability: prediction.reliability,
        hasEnoughData: false,
        explanation:
          'Insufficient historical period data. Baseline estimates are based on a standard 28-day cycle model.'
      }
    }

    const ovulationDate = addDays(prediction.expectedPeriodStartDate, -14)
    const fertileWindowStartDate = addDays(ovulationDate, -5)
    const fertileWindowEndDate = addDays(ovulationDate, 1)
    const uncertaintyDays = prediction.predictionUncertaintyDays ?? 2

    let explanation = `Estimated ovulation on ${ovulationDate}. Fertile window is ${fertileWindowStartDate} to ${fertileWindowEndDate}.`
    if (prediction.reliability === PeriodPredictionReliability.Low) {
      explanation += ` Note: High cycle variability (±${uncertaintyDays} days uncertainty).`
    } else if (prediction.reliability === PeriodPredictionReliability.High) {
      explanation += ` High confidence cycle prediction (±${uncertaintyDays} days uncertainty).`
    }

    return {
      ovulationDate,
      fertileWindowStartDate,
      fertileWindowEndDate,
      uncertaintyDays,
      reliability: prediction.reliability,
      hasEnoughData: true,
      explanation
    }
  }
}
