import {
  CalendarEjaculationLocation,
  CalendarProtectionMethod,
  ConceptionRiskLevel
} from '@/modules/calendar/entity/calendar.enums'
import type {
  ConceptionRiskAssessmentDto,
  FertilityWindowEstimateDto
} from '@/modules/calendar/dto/response.dto'
import type { CalendarEntry } from '@/modules/calendar/entity/calendar-entry.entity'
import { Injectable } from '@nestjs/common'

@Injectable()
export class ConceptionRiskService {
  assessRisk(
    sexualActivityEntries: CalendarEntry[],
    fertilityWindow: FertilityWindowEstimateDto
  ): ConceptionRiskAssessmentDto {
    const activeSexEntries = sexualActivityEntries.filter(
      (entry) => entry.sexualActivityDetail?.sexOccurred
    )

    if (activeSexEntries.length === 0) {
      return {
        level: ConceptionRiskLevel.None,
        confidence: 'high',
        relevantEvents: [],
        fertileWindowOverlap: false,
        explanation: 'No sexual activity recorded for this period.'
      }
    }

    if (
      !fertilityWindow.hasEnoughData ||
      !fertilityWindow.fertileWindowStartDate ||
      !fertilityWindow.fertileWindowEndDate
    ) {
      return {
        level: ConceptionRiskLevel.Unknown,
        confidence: 'low',
        relevantEvents: activeSexEntries.map((e) => e.date),
        fertileWindowOverlap: false,
        explanation:
          'Sexual activity recorded, but cycle history is insufficient to calculate fertile window boundaries accurately.'
      }
    }

    const windowStart = fertilityWindow.fertileWindowStartDate
    const windowEnd = fertilityWindow.fertileWindowEndDate
    const overlapping = activeSexEntries.filter((e) => e.date >= windowStart && e.date <= windowEnd)

    if (overlapping.length === 0) {
      return {
        level: ConceptionRiskLevel.Low,
        confidence: fertilityWindow.uncertaintyDays <= 3 ? 'high' : 'medium',
        relevantEvents: [],
        fertileWindowOverlap: false,
        explanation: 'Sexual activity occurred outside the estimated fertile window.'
      }
    }

    const relevantEventDates = overlapping.map((e) => e.date)
    let maxRisk = ConceptionRiskLevel.Low

    for (const entry of overlapping) {
      const d = entry.sexualActivityDetail
      if (!d) continue

      const isUnprotected = d.protectionMethod === CalendarProtectionMethod.None
      if (isUnprotected && d.ejaculationLocation === CalendarEjaculationLocation.InsideVagina) {
        maxRisk = ConceptionRiskLevel.High
        break
      }
      if (
        isUnprotected ||
        d.protectionMethod === CalendarProtectionMethod.Withdrawal ||
        d.protectionMethod === CalendarProtectionMethod.EmergencyContraception
      ) {
        maxRisk = ConceptionRiskLevel.Moderate
      }
    }

    let explanation = `Sexual activity recorded on ${relevantEventDates.join(', ')} overlapping with the fertile window (${windowStart} to ${windowEnd}).`
    if (maxRisk === ConceptionRiskLevel.High) {
      explanation +=
        ' High exposure risk due to unprotected intercourse with internal ejaculation during fertile window.'
    } else if (maxRisk === ConceptionRiskLevel.Moderate) {
      explanation +=
        ' Moderate exposure risk due to reduced protection efficacy during fertile window.'
    } else {
      explanation += ' Lower risk due to documented effective contraception.'
    }

    return {
      level: maxRisk,
      confidence: fertilityWindow.reliability === 'high' ? 'high' : 'medium',
      relevantEvents: relevantEventDates,
      fertileWindowOverlap: true,
      explanation
    }
  }
}
