import { MenstrualCyclePredictionService } from '@/modules/calendar/service/menstrual-cycle-prediction.service'
import { PeriodPredictionReliability } from '@/modules/calendar/entity/calendar.enums'
import type { PeriodRangeDto } from '@/modules/calendar/dto/response.dto'
import assert from 'node:assert/strict'
import { test } from 'node:test'

function makeRange(startDate: string, endDate: string, durationDays: number): PeriodRangeDto {
  return {
    startDate,
    endDate,
    durationDays,
    isComplete: true,
    flowLevels: [],
    symptoms: []
  }
}

test('MenstrualCyclePredictionService', async (t) => {
  const service = new MenstrualCyclePredictionService()

  await t.test('returns empty prediction for no period history', () => {
    const result = service.predict([])

    assert.equal(result.hasEnoughData, false)
    assert.equal(result.reliability, PeriodPredictionReliability.InsufficientData)
    assert.equal(result.nextPeriodWindow, null)
    assert.equal(result.ovulationWindow, null)
    assert.equal(result.expectedPeriodStartDate, null)
    assert.equal(result.expectedPeriodEndDate, null)
    assert.equal(result.cycleLengthDays, null)
    assert.equal(result.periodDurationDays, null)
    assert.equal(result.basis, 'no_period_history')
  })

  await t.test('handles single period range fallback (0 cycle lengths)', () => {
    const ranges: PeriodRangeDto[] = [makeRange('2026-01-01', '2026-01-05', 5)]

    const result = service.predict(ranges)

    assert.equal(result.hasEnoughData, false)
    assert.equal(result.reliability, PeriodPredictionReliability.InsufficientData)
    assert.equal(result.cycleLengthDays, 28)
    assert.equal(result.periodDurationDays, 5)
    assert.ok(result.expectedPeriodStartDate !== null)
    assert.ok(result.ovulationWindow !== null)
  })

  await t.test('predicts accurately with multiple stable cycles', () => {
    const ranges: PeriodRangeDto[] = [
      makeRange('2026-01-01', '2026-01-05', 5),
      makeRange('2026-01-29', '2026-02-02', 5),
      makeRange('2026-02-26', '2026-03-02', 5),
      makeRange('2026-03-26', '2026-03-30', 5),
      makeRange('2026-04-23', '2026-04-27', 5)
    ]

    const result = service.predict(ranges)

    assert.equal(result.hasEnoughData, true)
    assert.equal(result.reliability, PeriodPredictionReliability.High)
    assert.equal(result.cycleLengthDays, 28)
    assert.equal(result.periodDurationDays, 5)
    assert.ok(result.predictionUncertaintyDays! <= 2)
  })

  await t.test('detects recent irregularity for highly variable cycles', () => {
    const ranges: PeriodRangeDto[] = [
      makeRange('2026-01-01', '2026-01-05', 5),
      makeRange('2026-01-20', '2026-01-25', 5), // 19 days
      makeRange('2026-03-01', '2026-03-06', 5), // 40 days
      makeRange('2026-03-22', '2026-03-27', 5) // 21 days
    ]

    const result = service.predict(ranges)

    assert.equal(result.hasEnoughData, true)
    assert.equal(result.recentIrregularity, true)
    assert.ok(
      result.reliability === PeriodPredictionReliability.Low ||
        result.reliability === PeriodPredictionReliability.Medium
    )
  })

  await t.test('filters extreme outliers using MAD when median deviation is non-zero', () => {
    const ranges: PeriodRangeDto[] = [
      makeRange('2026-01-01', '2026-01-05', 5),
      makeRange('2026-01-29', '2026-02-02', 5), // 28 days
      makeRange('2026-02-25', '2026-03-01', 5), // 27 days
      makeRange('2026-03-26', '2026-03-30', 5), // 29 days
      makeRange('2026-05-22', '2026-05-27', 5), // 57 days (outlier)
      makeRange('2026-06-19', '2026-06-23', 5) // 28 days
    ]

    const result = service.predict(ranges)

    assert.equal(result.hasEnoughData, true)
    assert.ok(Math.abs(result.cycleLengthDays! - 28) <= 2)
  })

  await t.test('advances past predictions to today or future date', () => {
    const oldRanges: PeriodRangeDto[] = [
      makeRange('2025-01-01', '2025-01-05', 5),
      makeRange('2025-01-29', '2025-02-02', 5),
      makeRange('2025-02-26', '2025-03-02', 5)
    ]

    const result = service.predict(oldRanges)
    const today = new Date().toISOString().slice(0, 10)

    assert.ok(result.expectedPeriodStartDate! >= today)
  })
})
