// Contract between /api/economy and the Vue client.

export type EconomyGroup = 'inflation' | 'jobs' | 'rates'

// percent: 3.1 → 3.1%. thousands: a count already in thousands (payroll change).
// count: a plain count (jobless claims). index: a unitless index (sentiment).
export type EconomyUnit = 'percent' | 'thousands' | 'count' | 'index'

export type EconomyFrequency = 'weekly' | 'monthly' | 'quarterly'

export interface EconomyIndicatorInfo {
  id: string
  name: string
  detail: string
  group: EconomyGroup
  unit: EconomyUnit
  frequency: EconomyFrequency
  // A reference level drawn on the chart, such as the Fed's 2% inflation target.
  target: number | null
  // Signed values, like a monthly change, read better with an explicit + sign.
  signed: boolean
}

export interface EconomyPoint {
  // The start of the period the value covers, as YYYY-MM-DD.
  date: string
  value: number
}

export type EconomyIndicator = EconomyIndicatorInfo &
  ({ status: 'ok'; points: EconomyPoint[] } | { status: 'unavailable' })

export interface EconomySnapshot {
  generatedAt: string
  indicators: EconomyIndicator[]
}
