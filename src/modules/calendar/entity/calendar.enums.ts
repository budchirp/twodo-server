export enum CalendarActivityType {
  Note = 'note',
  Ovulation = 'ovulation',
  Period = 'period',
  PeriodPrediction = 'period_prediction'
}

export enum CalendarPeriodEvent {
  Day = 'day',
  End = 'end',
  Start = 'start'
}

export enum CalendarFlowLevel {
  Heavy = 'heavy',
  Light = 'light',
  Medium = 'medium',
  Spotting = 'spotting'
}

export enum CalendarPeriodSymptom {
  Acne = 'acne',
  BackPain = 'back_pain',
  Bloating = 'bloating',
  BreastTenderness = 'breast_tenderness',
  Cramps = 'cramps',
  Fatigue = 'fatigue',
  Headache = 'headache',
  MoodChanges = 'mood_changes',
  Nausea = 'nausea'
}

export enum PeriodPredictionReliability {
  High = 'high',
  InsufficientData = 'insufficient_data',
  Low = 'low',
  Medium = 'medium'
}
