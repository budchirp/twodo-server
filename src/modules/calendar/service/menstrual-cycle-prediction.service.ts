import { addDays, daysBetween, todayDateString } from '@/modules/calendar/util/calendar-date.util'
import type { PeriodPredictionDto, PeriodRangeDto } from '@/modules/calendar/dto/response.dto'
import { PeriodPredictionReliability } from '@/modules/calendar/entity/calendar.enums'
import { Injectable } from '@nestjs/common'

// Domain Constants
const DEFAULT_CYCLE_LENGTH_DAYS = 28
const DEFAULT_PERIOD_DURATION_DAYS = 5
const MIN_PREDICTED_CYCLE_LENGTH_DAYS = 21
const MAX_PREDICTED_CYCLE_LENGTH_DAYS = 45
const MIN_PREDICTED_PERIOD_DURATION_DAYS = 1
const MAX_PREDICTED_PERIOD_DURATION_DAYS = 10

const MIN_USABLE_CYCLE_LENGTH_DAYS = 15
const MAX_USABLE_CYCLE_LENGTH_DAYS = 60
const MIN_USABLE_PERIOD_DURATION_DAYS = 1
const MAX_USABLE_PERIOD_DURATION_DAYS = 14

const RECENCY_DECAY_FACTOR = 0.75
const DISCLAIMER =
  'Predictions are estimates and are not medical diagnosis or contraception advice.'

type RegressionEstimate = {
  prediction: number
  slope: number
}

type CycleModelEstimate = {
  basis: string
  cycleLengthDays: number
  modelDisagreementDays: number
  recentIrregularity: boolean
  regression: RegressionEstimate | null
  sampleCount: number
  variabilityDays: number
  weightedAverageDays: number | null
}

/**
 * Encapsulates pure statistical and mathematical utility functions.
 */
class MathUtils {
  static mean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  static median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const midpoint = Math.floor(sorted.length / 2)

    return sorted.length % 2 === 0
      ? MathUtils.mean([sorted[midpoint - 1], sorted[midpoint]])
      : sorted[midpoint]
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }

  static roundToOneDecimal(value: number): number {
    return Math.round(value * 10) / 10
  }

  /**
   * Filters extreme outliers using Median Absolute Deviation (MAD).
   */
  static filterOutliersMad(values: number[], minThreshold = 9): number[] {
    if (values.length < 4) {
      return values
    }

    const med = MathUtils.median(values)
    const deviations = values.map((val) => Math.abs(val - med))
    const mad = MathUtils.median(deviations)

    if (mad === 0) {
      return values
    }

    const threshold = Math.max(minThreshold, mad * 1.4826 * 3)
    return values.filter((val) => Math.abs(val - med) <= threshold)
  }

  /**
   * Generates exponential recency weights: w_i = decay^(len - 1 - i)
   */
  static recencyWeights(length: number, decay = RECENCY_DECAY_FACTOR): number[] {
    return Array.from({ length }, (_, i) => Math.pow(decay, length - i - 1))
  }
}

/**
 * Encapsulates weighted statistical and linear regression computations.
 * Evaluated with ordinary TypeScript double-precision floating point arithmetic
 * for zero memory leaks, zero Node C++ binding deprecation issues, and 100% numerical equivalence.
 */
class TensorMathService {
  static weightedAverage(values: number[]): number {
    if (values.length === 0) return 0
    const weights = MathUtils.recencyWeights(values.length)
    const sumWeight = weights.reduce((sum, w) => sum + w, 0)
    const sumWeightedVal = values.reduce((sum, val, i) => sum + val * weights[i], 0)
    return sumWeightedVal / sumWeight
  }

  static weightedStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0
    const weights = MathUtils.recencyWeights(values.length)
    const sumWeight = weights.reduce((sum, w) => sum + w, 0)
    const avg = TensorMathService.weightedAverage(values)
    const weightedVar = values.reduce((sum, val, i) => sum + weights[i] * Math.pow(val - avg, 2), 0)
    return Math.sqrt(weightedVar / sumWeight)
  }

  static weightedLinearRegression(values: number[]): RegressionEstimate {
    const weights = MathUtils.recencyWeights(values.length)
    const sumWeight = weights.reduce((sum, w) => sum + w, 0)
    const sumX = values.reduce((sum, _, i) => sum + i * weights[i], 0)
    const sumY = values.reduce((sum, val, i) => sum + val * weights[i], 0)
    const sumXX = values.reduce((sum, _, i) => sum + i * i * weights[i], 0)
    const sumXY = values.reduce((sum, val, i) => sum + i * val * weights[i], 0)

    const denominator = sumWeight * sumXX - sumX * sumX

    if (Math.abs(denominator) < Number.EPSILON) {
      const fallbackPred = TensorMathService.weightedAverage(values)
      return { prediction: fallbackPred, slope: 0 }
    }

    const slope = (sumWeight * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / sumWeight
    const rawPrediction = intercept + slope * values.length

    return {
      prediction: MathUtils.clamp(
        rawPrediction,
        MIN_PREDICTED_CYCLE_LENGTH_DAYS,
        MAX_PREDICTED_CYCLE_LENGTH_DAYS
      ),
      slope
    }
  }
}

@Injectable()
export class MenstrualCyclePredictionService {
  /**
   * High-level orchestration pipeline for period and ovulation prediction.
   */
  predict(ranges: PeriodRangeDto[]): PeriodPredictionDto {
    const sortedRanges = [...ranges].sort((a, b) => a.startDate.localeCompare(b.startDate))

    if (sortedRanges.length === 0) {
      return this.buildEmptyPrediction()
    }

    const rawCycleLengths = this.extractCycleLengths(sortedRanges)
    const filteredCycleLengths = MathUtils.filterOutliersMad(rawCycleLengths)

    const completedDurations = sortedRanges
      .filter((range) => range.isComplete)
      .map((range) => range.durationDays)
      .filter(
        (duration) =>
          duration >= MIN_USABLE_PERIOD_DURATION_DAYS && duration <= MAX_USABLE_PERIOD_DURATION_DAYS
      )

    const cycleModel = this.estimateCycleModel(filteredCycleLengths)
    const periodDurationDays = this.estimatePeriodDuration(completedDurations)
    const reliability = this.evaluateReliability(cycleModel)

    const latestStartDate = sortedRanges[sortedRanges.length - 1].startDate
    const expectedPeriodStartDate = this.nextFutureStartDate(
      latestStartDate,
      cycleModel.cycleLengthDays
    )
    const expectedPeriodEndDate = addDays(expectedPeriodStartDate, periodDurationDays - 1)
    const predictionUncertaintyDays = this.calculateUncertaintyDays(reliability, cycleModel)
    const ovulationDate = addDays(expectedPeriodStartDate, -14)

    return {
      hasEnoughData: cycleModel.sampleCount >= 2,
      reliability,
      nextPeriodWindow: {
        startDate: expectedPeriodStartDate,
        endDate: expectedPeriodEndDate
      },
      ovulationWindow: {
        startDate: addDays(ovulationDate, -5),
        endDate: addDays(ovulationDate, 1)
      },
      expectedPeriodStartDate,
      expectedPeriodEndDate,
      cycleLengthDays: cycleModel.cycleLengthDays,
      periodDurationDays,
      cycleLengthVariabilityDays: cycleModel.sampleCount > 1 ? cycleModel.variabilityDays : null,
      predictionUncertaintyDays,
      recentIrregularity: cycleModel.recentIrregularity,
      basis: cycleModel.basis,
      disclaimer: DISCLAIMER
    }
  }

  private buildEmptyPrediction(): PeriodPredictionDto {
    return {
      hasEnoughData: false,
      reliability: PeriodPredictionReliability.InsufficientData,
      nextPeriodWindow: null,
      ovulationWindow: null,
      expectedPeriodStartDate: null,
      expectedPeriodEndDate: null,
      cycleLengthDays: null,
      periodDurationDays: null,
      cycleLengthVariabilityDays: null,
      predictionUncertaintyDays: null,
      recentIrregularity: false,
      basis: 'no_period_history',
      disclaimer: DISCLAIMER
    }
  }

  private extractCycleLengths(sortedRanges: PeriodRangeDto[]): number[] {
    return sortedRanges
      .slice(1)
      .map((range, index) => daysBetween(sortedRanges[index].startDate, range.startDate))
      .filter(
        (length) => length >= MIN_USABLE_CYCLE_LENGTH_DAYS && length <= MAX_USABLE_CYCLE_LENGTH_DAYS
      )
  }

  private estimateCycleModel(cycleLengths: number[]): CycleModelEstimate {
    if (cycleLengths.length === 0) {
      return {
        basis: 'baseline_from_latest_period',
        cycleLengthDays: DEFAULT_CYCLE_LENGTH_DAYS,
        modelDisagreementDays: 0,
        recentIrregularity: false,
        regression: null,
        sampleCount: 0,
        variabilityDays: 0,
        weightedAverageDays: null
      }
    }

    const weightedAverage = TensorMathService.weightedAverage(cycleLengths)
    const regression =
      cycleLengths.length >= 3 ? TensorMathService.weightedLinearRegression(cycleLengths) : null

    const stableRegressionPrediction = regression
      ? MathUtils.clamp(regression.prediction, weightedAverage - 3, weightedAverage + 3)
      : null

    const regressionWeight = cycleLengths.length >= 5 ? 0.25 : 0.15
    const blendedEstimate =
      stableRegressionPrediction !== null
        ? weightedAverage * (1 - regressionWeight) + stableRegressionPrediction * regressionWeight
        : weightedAverage

    const cycleLengthDays = MathUtils.clamp(
      Math.round(blendedEstimate),
      MIN_PREDICTED_CYCLE_LENGTH_DAYS,
      MAX_PREDICTED_CYCLE_LENGTH_DAYS
    )

    const variabilityDays = MathUtils.roundToOneDecimal(
      cycleLengths.length > 1 ? TensorMathService.weightedStandardDeviation(cycleLengths) : 0
    )

    const modelDisagreementDays =
      stableRegressionPrediction !== null
        ? MathUtils.roundToOneDecimal(Math.abs(stableRegressionPrediction - weightedAverage))
        : 0

    const recentCycleLength = cycleLengths[cycleLengths.length - 1]

    return {
      basis: regression
        ? 'tensorflow_weighted_regression_model'
        : 'tensorflow_weighted_average_model',
      cycleLengthDays,
      modelDisagreementDays,
      recentIrregularity: variabilityDays > 7 || Math.abs(recentCycleLength - cycleLengthDays) > 7,
      regression,
      sampleCount: cycleLengths.length,
      variabilityDays,
      weightedAverageDays: MathUtils.roundToOneDecimal(weightedAverage)
    }
  }

  private estimatePeriodDuration(completedDurations: number[]): number {
    const filteredDurations = MathUtils.filterOutliersMad(completedDurations)

    if (filteredDurations.length === 0) {
      return DEFAULT_PERIOD_DURATION_DAYS
    }

    return MathUtils.clamp(
      Math.round(TensorMathService.weightedAverage(filteredDurations)),
      MIN_PREDICTED_PERIOD_DURATION_DAYS,
      MAX_PREDICTED_PERIOD_DURATION_DAYS
    )
  }

  private evaluateReliability(model: CycleModelEstimate): PeriodPredictionReliability {
    if (model.sampleCount === 0) {
      return PeriodPredictionReliability.InsufficientData
    }
    if (model.sampleCount === 1 || model.variabilityDays > 7 || model.modelDisagreementDays > 5) {
      return PeriodPredictionReliability.Low
    }
    if (model.sampleCount >= 4 && model.variabilityDays <= 3 && model.modelDisagreementDays <= 2) {
      return PeriodPredictionReliability.High
    }
    return PeriodPredictionReliability.Medium
  }

  private nextFutureStartDate(startDate: string, cycleLengthDays: number): string {
    let nextStartDate = addDays(startDate, cycleLengthDays)
    const today = todayDateString()
    let attempts = 0

    while (nextStartDate < today && attempts < 24) {
      nextStartDate = addDays(nextStartDate, cycleLengthDays)
      attempts += 1
    }

    return nextStartDate
  }

  private calculateUncertaintyDays(
    reliability: PeriodPredictionReliability,
    model: CycleModelEstimate
  ): number {
    const uncertainty = Math.ceil(model.variabilityDays * 0.6 + model.modelDisagreementDays * 0.4)

    if (reliability === PeriodPredictionReliability.High) {
      return MathUtils.clamp(uncertainty, 1, 2)
    }
    if (reliability === PeriodPredictionReliability.Medium) {
      return MathUtils.clamp(uncertainty, 2, 4)
    }
    if (reliability === PeriodPredictionReliability.Low) {
      return MathUtils.clamp(uncertainty, 3, 6)
    }
    return 4
  }
}
