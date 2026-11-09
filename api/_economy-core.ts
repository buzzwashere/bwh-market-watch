/// <reference types="node" />
import type {
  EconomyIndicator,
  EconomyIndicatorInfo,
  EconomyPoint,
  EconomySnapshot,
} from '../shared/economy.js'

const REQUEST_TIMEOUT_MS = 10_000
// Most series update monthly, so a few hours of caching costs nothing in freshness.
export const ECONOMY_MAX_AGE_SECONDS = 6 * 60 * 60
const HISTORY_YEARS = 10

interface FredSeries extends EconomyIndicatorInfo {
  seriesId: string
  // FRED's own transformation: pc1 = percent change from a year earlier, chg = change.
  units: 'lin' | 'pc1' | 'chg'
}

function series(
  info: Omit<EconomyIndicatorInfo, 'target' | 'signed'> & Partial<EconomyIndicatorInfo>,
  seriesId: string,
  units: FredSeries['units'],
): FredSeries {
  return { target: null, signed: false, ...info, seriesId, units }
}

const FRED_SERIES: FredSeries[] = [
  series(
    {
      id: 'cpi',
      name: 'CPI Inflation',
      detail: 'Consumer prices, change from a year earlier',
      group: 'inflation',
      unit: 'percent',
      frequency: 'monthly',
      target: 2,
    },
    'CPIAUCSL',
    'pc1',
  ),
  series(
    {
      id: 'core-cpi',
      name: 'Core CPI',
      detail: 'CPI without food and energy, year over year',
      group: 'inflation',
      unit: 'percent',
      frequency: 'monthly',
      target: 2,
    },
    'CPILFESL',
    'pc1',
  ),
  series(
    {
      id: 'core-pce',
      name: 'Core PCE',
      detail: "The Fed's preferred inflation gauge, year over year",
      group: 'inflation',
      unit: 'percent',
      frequency: 'monthly',
      target: 2,
    },
    'PCEPILFE',
    'pc1',
  ),
  series(
    {
      id: 'ppi',
      name: 'Producer Prices',
      detail: 'PPI final demand, change from a year earlier',
      group: 'inflation',
      unit: 'percent',
      frequency: 'monthly',
    },
    'PPIFIS',
    'pc1',
  ),
  series(
    {
      id: 'unemployment',
      name: 'Unemployment Rate',
      detail: 'Share of the labor force out of work',
      group: 'jobs',
      unit: 'percent',
      frequency: 'monthly',
    },
    'UNRATE',
    'lin',
  ),
  series(
    {
      id: 'payrolls',
      name: 'Jobs Added',
      detail: 'Change in nonfarm payrolls from the month before',
      group: 'jobs',
      unit: 'thousands',
      frequency: 'monthly',
      target: 0,
      signed: true,
    },
    'PAYEMS',
    'chg',
  ),
  series(
    {
      id: 'claims',
      name: 'Jobless Claims',
      detail: 'First-time unemployment claims, weekly',
      group: 'jobs',
      unit: 'count',
      frequency: 'weekly',
    },
    'ICSA',
    'lin',
  ),
  series(
    {
      id: 'gdp',
      name: 'GDP Growth',
      detail: 'Real GDP, quarterly change at an annual rate',
      group: 'jobs',
      unit: 'percent',
      frequency: 'quarterly',
      target: 0,
      signed: true,
    },
    'A191RL1Q225SBEA',
    'lin',
  ),
  series(
    {
      id: 'fed-funds',
      name: 'Fed Funds Rate',
      detail: 'Effective overnight rate the Fed targets, monthly average',
      group: 'rates',
      unit: 'percent',
      frequency: 'monthly',
    },
    'FEDFUNDS',
    'lin',
  ),
  series(
    {
      id: 'mortgage',
      name: '30-Year Mortgage',
      detail: 'Average fixed rate, Freddie Mac weekly survey',
      group: 'rates',
      unit: 'percent',
      frequency: 'weekly',
    },
    'MORTGAGE30US',
    'lin',
  ),
  series(
    {
      id: 'breakeven',
      name: 'Expected Inflation',
      detail: '10-year breakeven rate priced into Treasuries',
      group: 'rates',
      unit: 'percent',
      frequency: 'monthly',
      target: 2,
    },
    'T10YIEM',
    'lin',
  ),
  series(
    {
      id: 'sentiment',
      name: 'Consumer Sentiment',
      detail: 'University of Michigan index (1966 = 100)',
      group: 'rates',
      unit: 'index',
      frequency: 'monthly',
    },
    'UMCSENT',
    'lin',
  ),
]

export class EconomyNotConfiguredError extends Error {}

interface FredObservationsResponse {
  observations?: Array<{ date?: string; value?: string }>
}

function toInfo(source: FredSeries): EconomyIndicatorInfo {
  const { id, name, detail, group, unit, frequency, target, signed } = source
  return { id, name, detail, group, unit, frequency, target, signed }
}

async function fetchSeries(source: FredSeries, apiKey: string): Promise<EconomyPoint[]> {
  const start = new Date()
  start.setFullYear(start.getFullYear() - HISTORY_YEARS)
  const params = new URLSearchParams({
    series_id: source.seriesId,
    api_key: apiKey,
    file_type: 'json',
    units: source.units,
    observation_start: start.toISOString().slice(0, 10),
  })
  const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?${params}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  // The URL carries the key, so errors name the series, never the URL.
  if (!response.ok) throw new Error(`FRED ${source.seriesId} responded ${response.status}`)
  const data = (await response.json()) as FredObservationsResponse
  const points: EconomyPoint[] = []
  for (const { date, value } of data.observations ?? []) {
    // FRED marks a missing value with ".", and a year-over-year series starts empty.
    const number = Number(value)
    if (date && value !== '.' && Number.isFinite(number)) points.push({ date, value: number })
  }
  if (points.length < 2) throw new Error(`Not enough data for ${source.seriesId}`)
  return points
}

async function buildSnapshot(apiKey: string): Promise<EconomySnapshot> {
  const results = await Promise.allSettled(FRED_SERIES.map((item) => fetchSeries(item, apiKey)))
  const indicators: EconomyIndicator[] = FRED_SERIES.map((item, index) => {
    const result = results[index]
    return result?.status === 'fulfilled'
      ? { ...toInfo(item), status: 'ok', points: result.value }
      : { ...toInfo(item), status: 'unavailable' }
  })
  if (!indicators.some((indicator) => indicator.status === 'ok')) {
    throw new Error('FRED returned no usable series')
  }
  return { generatedAt: new Date().toISOString(), indicators }
}

let cache: { expires: number; snapshot: Promise<EconomySnapshot> } | null = null

export function getEconomySnapshot(): Promise<EconomySnapshot> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) return Promise.reject(new EconomyNotConfiguredError('FRED_API_KEY is not set'))

  const now = Date.now()
  if (cache && now < cache.expires) return cache.snapshot
  const snapshot = buildSnapshot(apiKey)
  cache = { expires: now + ECONOMY_MAX_AGE_SECONDS * 1000, snapshot }
  snapshot.catch(() => {
    cache = null
  })
  return snapshot
}
