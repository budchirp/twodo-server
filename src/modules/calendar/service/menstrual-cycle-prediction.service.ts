import { addDays, daysBetween, todayDateString } from '@/modules/calendar/util/calendar-date.util'
import type { PeriodPredictionDto, PeriodRangeDto } from '@/modules/calendar/dto/response.dto'
import { PeriodPredictionReliability } from '@/modules/calendar/entity/calendar.enums'
import { Injectable } from '@nestjs/common'
import * as tf from '@tensorflow/tfjs'

const defaultCycleLengthDays = 28
const defaultPeriodDurationDays = 5
const maxPredictedCycleLengthDays = 45
const maxPredictedPeriodDurationDays = 10
const minPredictedCycleLengthDays = 21
const minPredictedPeriodDurationDays = 1
const disclaimer =
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

@Injectable()
export class MenstrualCyclePredictionService {
  predict(ranges: PeriodRangeDto[]): PeriodPredictionDto {
    const sortedRanges = [...ranges].sort((a, b) => a.startDate.localeCompare(b.startDate))

    if (sortedRanges.length === 0) {
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
        disclaimer
      }
    }

    const cycleLengths = this.filterOutliers(this.cycleLengths(sortedRanges))
    const completedDurations = sortedRanges
      .filter((range) => range.isComplete)
      .map((range) => range.durationDays)
      .filter((duration) => duration >= 1 && duration <= 14)
    const cycleModel = this.estimateCycleModel(cycleLengths)
    const periodDurationDays = this.estimatePeriodDuration(completedDurations)
    const reliability = this.reliability(cycleModel)
    const latestStartDate = sortedRanges[sortedRanges.length - 1].startDate
    const expectedPeriodStartDate = this.nextFutureStartDate(
      latestStartDate,
      cycleModel.cycleLengthDays
    )
    const expectedPeriodEndDate = addDays(expectedPeriodStartDate, periodDurationDays - 1)
    const predictionUncertaintyDays = this.predictionUncertaintyDays(reliability, cycleModel)
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
      disclaimer
    }
  }

  private cycleLengths(ranges: PeriodRangeDto[]): number[] {
    return ranges
      .slice(1)
      .map((range, index) => daysBetween(ranges[index].startDate, range.startDate))
      .filter((length) => length >= 15 && length <= 60)
  }

  private estimateCycleModel(cycleLengths: number[]): CycleModelEstimate {
    if (cycleLengths.length === 0) {
      return {
        basis: 'baseline_from_latest_period',
        cycleLengthDays: defaultCycleLengthDays,
        modelDisagreementDays: 0,
        recentIrregularity: false,
        regression: null,
        sampleCount: 0,
        variabilityDays: 0,
        weightedAverageDays: null
      }
    }

    const weightedAverage = this.tensorWeightedAverage(cycleLengths)
    const regression =
      cycleLengths.length >= 3 ? this.tensorWeightedLinearRegression(cycleLengths) : null
    const stableRegressionPrediction = regression
      ? this.clamp(regression.prediction, weightedAverage - 3, weightedAverage + 3)
      : null
    const regressionWeight = cycleLengths.length >= 5 ? 0.25 : 0.15
    const blendedEstimate =
      stableRegressionPrediction !== null
        ? weightedAverage * (1 - regressionWeight) + stableRegressionPrediction * regressionWeight
        : weightedAverage
    const cycleLengthDays = this.clamp(
      Math.round(blendedEstimate),
      minPredictedCycleLengthDays,
      maxPredictedCycleLengthDays
    )
    const variabilityDays = this.round(
      cycleLengths.length > 1 ? this.tensorWeightedStandardDeviation(cycleLengths) : 0
    )
    const modelDisagreementDays =
      stableRegressionPrediction !== null
        ? this.round(Math.abs(stableRegressionPrediction - weightedAverage))
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
      weightedAverageDays: this.round(weightedAverage)
    }
  }

  private estimatePeriodDuration(durations: number[]): number {
    const filteredDurations = this.filterOutliers(durations)

    if (filteredDurations.length === 0) {
      return defaultPeriodDurationDays
    }

    return this.clamp(
      Math.round(this.tensorWeightedAverage(filteredDurations)),
      minPredictedPeriodDurationDays,
      maxPredictedPeriodDurationDays
    )
  }

  private reliability(model: CycleModelEstimate): PeriodPredictionReliability {
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

  private predictionUncertaintyDays(
    reliability: PeriodPredictionReliability,
    model: CycleModelEstimate
  ): number {
    const uncertainty = Math.ceil(model.variabilityDays * 0.6 + model.modelDisagreementDays * 0.4)

    if (reliability === PeriodPredictionReliability.High) {
      return Math.max(1, Math.min(2, uncertainty))
    }
    if (reliability === PeriodPredictionReliability.Medium) {
      return Math.max(2, Math.min(4, uncertainty))
    }
    if (reliability === PeriodPredictionReliability.Low) {
      return Math.max(3, Math.min(6, uncertainty))
    }
    return 4
  }

  private tensorWeightedAverage(values: number[]): number {
    return tf.tidy(() => {
      const valueTensor = tf.tensor1d(values)
      const weightTensor = tf.tensor1d(this.recencyWeights(values.length))

      return valueTensor.mul(weightTensor).sum().div(weightTensor.sum()).dataSync()[0]
    })
  }

  private tensorWeightedLinearRegression(values: number[]): RegressionEstimate {
    return tf.tidy(() => {
      const x = tf.tensor1d(values.map((_, index) => index))
      const y = tf.tensor1d(values)
      const weight = tf.tensor1d(this.recencyWeights(values.length))
      const sumWeight = weight.sum().dataSync()[0]
      const sumX = x.mul(weight).sum().dataSync()[0]
      const sumY = y.mul(weight).sum().dataSync()[0]
      const sumXX = x.square().mul(weight).sum().dataSync()[0]
      const sumXY = x.mul(y).mul(weight).sum().dataSync()[0]
      const denominator = sumWeight * sumXX - sumX * sumX

      if (Math.abs(denominator) < Number.EPSILON) {
        const prediction = this.tensorWeightedAverage(values)
        return { prediction, slope: 0 }
      }

      const slope = (sumWeight * sumXY - sumX * sumY) / denominator
      const intercept = (sumY - slope * sumX) / sumWeight
      const prediction = intercept + slope * values.length

      return {
        prediction: this.clamp(
          prediction,
          minPredictedCycleLengthDays,
          maxPredictedCycleLengthDays
        ),
        slope
      }
    })
  }

  private tensorWeightedStandardDeviation(values: number[]): number {
    return tf.tidy(() => {
      const valueTensor = tf.tensor1d(values)
      const weightTensor = tf.tensor1d(this.recencyWeights(values.length))
      const average = valueTensor.mul(weightTensor).sum().div(weightTensor.sum())
      const variance = valueTensor
        .sub(average)
        .square()
        .mul(weightTensor)
        .sum()
        .div(weightTensor.sum())

      return variance.sqrt().dataSync()[0]
    })
  }

  private recencyWeights(length: number): number[] {
    return Array.from({ length }, (_, index) => Math.pow(0.75, length - index - 1))
  }

  private filterOutliers(values: number[]): number[] {
    if (values.length < 4) {
      return values
    }

    const median = this.median(values)
    const deviations = values.map((value) => Math.abs(value - median))
    const medianDeviation = this.median(deviations)

    if (medianDeviation === 0) {
      return values
    }

    const threshold = Math.max(9, medianDeviation * 1.4826 * 3)
    return values.filter((value) => Math.abs(value - median) <= threshold)
  }

  private mean(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }

  private median(values: number[]): number {
    const sortedValues = [...values].sort((a, b) => a - b)
    const midpoint = Math.floor(sortedValues.length / 2)

    return sortedValues.length % 2 === 0
      ? this.mean([sortedValues[midpoint - 1], sortedValues[midpoint]])
      : sortedValues[midpoint]
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10
  }
}
