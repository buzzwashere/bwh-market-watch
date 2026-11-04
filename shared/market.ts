// Contract between the /api function and the Vue client.

export type MarketCategory = 'stocks' | 'bonds' | 'crypto'

// Drives formatting and how a move is read: a rising yield is neither good nor bad.
export type QuoteKind = 'index' | 'yield' | 'fund' | 'coin' | 'marketCap'

export type MarketState = 'open' | 'closed' | 'always'

export interface Instrument {
  id: string
  name: string
  detail: string
  category: MarketCategory
  kind: QuoteKind
}

export interface AvailableQuote extends Instrument {
  status: 'ok'
  value: number
  // Absolute move in the value's own unit. Null when the source only reports a percentage.
  change: number | null
  changePercent: number
  changeWindow: 'day' | '24h'
  marketState: MarketState
  asOf: string
}

export interface UnavailableQuote extends Instrument {
  status: 'unavailable'
}

export type Quote = AvailableQuote | UnavailableQuote

export interface MarketSnapshot {
  generatedAt: string
  quotes: Quote[]
}

export type Timeframe = '1w' | '30d' | '1y'

export interface HistoryPoint {
  time: number
  value: number
}

export interface QuoteHistory {
  id: string
  timeframe: Timeframe
  // Exchange time zone: a daily bar's timestamp can fall on the previous day anywhere else.
  timeZone: string
  intraday: boolean
  // Set when the series is a stand-in for an instrument with no free history.
  proxy: string | null
  points: HistoryPoint[]
}
