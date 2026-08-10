import { addDays, daysBetween, todayDateString } from '@/modules/calendar/util/calendar-date.util'
import type { PeriodPredictionDto, PeriodRangeDto } from '@/modules/calendar/dto/response.dto'
import type { WeightedRegressionEstimate } from '@/core/tensorflow/tensorflow.types'
import { PeriodPredictionReliability } from '@/modules/calendar/entity/calendar.enums'
import { TensorflowService } from '@/core/tensorflow/tensorflow.service'
import { Injectable } from '@nestjs/common'

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

type CycleModelEstimate = {
  basis: string
  cycleLengthDays: number
  modelDisagreementDays: number
  recentIrregularity: boolean
  regression: WeightedRegressionEstimate | null
  sampleCount: number
  variabilityDays: number
  weightedAverageDays: number | null
}

class MathUtils {
  static mean(values: number[]): number {
    return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length
  }

  static median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? MathUtils.mean([sorted[mid - 1], sorted[mid]]) : sorted[mid]
  }

  static clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val))
  }

  static roundToOneDecimal(val: number): number {
    return Math.round(val * 10) / 10
  }

  static filterOutliersMad(values: number[], minThreshold = 9): number[] {
    if (values.length < 4) return values
    const med = MathUtils.median(values)
    const mad = MathUtils.median(values.map((v) => Math.abs(v - med)))
    if (mad === 0) return values
    const threshold = Math.max(minThreshold, mad * 1.4826 * 3)
    return values.filter((v) => Math.abs(v - med) <= threshold)
  }

  static recencyWeights(length: number): number[] {
    return Array.from({ length }, (_, i) => RECENCY_DECAY_FACTOR ** (length - i - 1))
  }
}

@Injectable()
export class MenstrualCyclePredictionService {
  constructor(private readonly tensorflow: TensorflowService) {}

  predict(ranges: PeriodRangeDto[]): PeriodPredictionDto {
    const sorted = [...ranges].sort((a, b) => a.startDate.localeCompare(b.startDate))
    if (sorted.length === 0) return this.buildEmptyPrediction()

    const rawCycleLengths = sorted
      .slice(1)
      .map((r, i) => daysBetween(sorted[i].startDate, r.startDate))
      .filter((l) => l >= MIN_USABLE_CYCLE_LENGTH_DAYS && l <= MAX_USABLE_CYCLE_LENGTH_DAYS)

    const filteredCycleLengths = MathUtils.filterOutliersMad(rawCycleLengths)
    const completedDurations = sorted
      .filter((r) => r.isComplete)
      .map((r) => r.durationDays)
      .filter((d) => d >= MIN_USABLE_PERIOD_DURATION_DAYS && d <= MAX_USABLE_PERIOD_DURATION_DAYS)

    const cycleModel = this.estimateCycleModel(filteredCycleLengths)
    const periodDurationDays = this.estimatePeriodDuration(completedDurations)
    const reliability = this.evaluateReliability(cycleModel)

    const expectedPeriodStartDate = this.nextFutureStartDate(
      sorted[sorted.length - 1].startDate,
      cycleModel.cycleLengthDays
    )
    const expectedPeriodEndDate = addDays(expectedPeriodStartDate, periodDurationDays - 1)
    const ovulationDate = addDays(expectedPeriodStartDate, -14)

    return {
      hasEnoughData: cycleModel.sampleCount >= 2,
      reliability,
      nextPeriodWindow: { startDate: expectedPeriodStartDate, endDate: expectedPeriodEndDate },
      ovulationWindow: {
        startDate: addDays(ovulationDate, -5),
        endDate: addDays(ovulationDate, 1)
      },
      expectedPeriodStartDate,
      expectedPeriodEndDate,
      cycleLengthDays: cycleModel.cycleLengthDays,
      periodDurationDays,
      cycleLengthVariabilityDays: cycleModel.sampleCount > 1 ? cycleModel.variabilityDays : null,
      predictionUncertaintyDays: this.calculateUncertaintyDays(reliability, cycleModel),
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

    const weights = MathUtils.recencyWeights(cycleLengths.length)
    const weightedAverage = this.tensorflow.weightedAverage(cycleLengths, weights)

    const regression =
      cycleLengths.length >= 3
        ? this.tensorflow.weightedLinearRegression(
            cycleLengths,
            weights,
            MIN_PREDICTED_CYCLE_LENGTH_DAYS,
            MAX_PREDICTED_CYCLE_LENGTH_DAYS
          )
        : null

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
      cycleLengths.length > 1 ? this.tensorflow.weightedStandardDeviation(cycleLengths, weights) : 0
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
    const filtered = MathUtils.filterOutliersMad(completedDurations)
    if (filtered.length === 0) return DEFAULT_PERIOD_DURATION_DAYS
    return MathUtils.clamp(
      Math.round(
        this.tensorflow.weightedAverage(filtered, MathUtils.recencyWeights(filtered.length))
      ),
      MIN_PREDICTED_PERIOD_DURATION_DAYS,
      MAX_PREDICTED_PERIOD_DURATION_DAYS
    )
  }

  private evaluateReliability(model: CycleModelEstimate): PeriodPredictionReliability {
    if (model.sampleCount === 0) return PeriodPredictionReliability.InsufficientData
    if (model.sampleCount === 1 || model.variabilityDays > 7 || model.modelDisagreementDays > 5)
      return PeriodPredictionReliability.Low
    if (model.sampleCount >= 4 && model.variabilityDays <= 3 && model.modelDisagreementDays <= 2)
      return PeriodPredictionReliability.High
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
    if (reliability === PeriodPredictionReliability.High) return MathUtils.clamp(uncertainty, 1, 2)
    if (reliability === PeriodPredictionReliability.Medium)
      return MathUtils.clamp(uncertainty, 2, 4)
    if (reliability === PeriodPredictionReliability.Low) return MathUtils.clamp(uncertainty, 3, 6)
    return 4
  }
}
