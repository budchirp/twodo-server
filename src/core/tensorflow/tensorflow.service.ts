import type { WeightedRegressionEstimate } from '@/core/tensorflow/tensorflow.types'
import { Injectable } from '@nestjs/common'
import * as util from 'node:util'

if (typeof (util as any).isNullOrUndefined !== 'function') {
  ;(util as any).isNullOrUndefined = (val: unknown) => val === null || val === undefined
}

@Injectable()
export class TensorflowService {
  weightedAverage(values: number[], weights: number[]): number {
    if (values.length === 0 || values.length !== weights.length) return 0
    const sumWeight = weights.reduce((sum, w) => sum + w, 0)
    return sumWeight === 0
      ? 0
      : values.reduce((sum, val, i) => sum + val * weights[i], 0) / sumWeight
  }

  weightedStandardDeviation(values: number[], weights: number[]): number {
    if (values.length <= 1 || values.length !== weights.length) return 0
    const sumWeight = weights.reduce((sum, w) => sum + w, 0)
    if (sumWeight === 0) return 0
    const avg = this.weightedAverage(values, weights)
    const weightedVar = values.reduce((sum, val, i) => sum + weights[i] * (val - avg) ** 2, 0)
    return Math.sqrt(weightedVar / sumWeight)
  }

  weightedLinearRegression(
    values: number[],
    weights: number[],
    minPrediction: number,
    maxPrediction: number
  ): WeightedRegressionEstimate {
    if (values.length === 0 || values.length !== weights.length) return { prediction: 0, slope: 0 }

    const sumWeight = weights.reduce((sum, w) => sum + w, 0)
    const sumX = values.reduce((sum, _, i) => sum + i * weights[i], 0)
    const sumY = values.reduce((sum, val, i) => sum + val * weights[i], 0)
    const sumXX = values.reduce((sum, _, i) => sum + i * i * weights[i], 0)
    const sumXY = values.reduce((sum, val, i) => sum + i * val * weights[i], 0)
    const denominator = sumWeight * sumXX - sumX * sumX

    if (Math.abs(denominator) < Number.EPSILON) {
      return { prediction: this.weightedAverage(values, weights), slope: 0 }
    }

    const slope = (sumWeight * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / sumWeight
    const rawPrediction = intercept + slope * values.length

    return {
      prediction: Math.min(maxPrediction, Math.max(minPrediction, rawPrediction)),
      slope
    }
  }
}
