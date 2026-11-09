import type {
  AvailableQuote,
  HistoryPoint,
  Instrument,
  MarketSnapshot,
  Quote,
  QuoteHistory,
  Timeframe,
} from '../shared/market.js'

const REQUEST_TIMEOUT_MS = 8_000
const CACHE_TTL_MS = 60_000

interface YahooInstrument extends Instrument {
  symbol: string
}

interface CoinInstrument extends Instrument {
  coinId: string
  // Yahoo symbol for history: CoinGecko's public tier has none beyond a year.
  symbol: string
}

const YAHOO_INSTRUMENTS: YahooInstrument[] = [
  stock('sp500', '^GSPC', 'S&P 500', 'US large cap'),
  stock('dow', '^DJI', 'Dow Jones', 'US blue chip'),
  stock('nasdaq', '^IXIC', 'Nasdaq Composite', 'US, tech-weighted'),
  stock('russell2000', '^RUT', 'Russell 2000', 'US small cap'),
  stock('ftse100', '^FTSE', 'FTSE 100', 'United Kingdom'),
  stock('dax', '^GDAXI', 'DAX', 'Germany'),
  stock('nikkei225', '^N225', 'Nikkei 225', 'Japan'),
  stock('hangseng', '^HSI', 'Hang Seng', 'Hong Kong'),
  treasury('us13w', '^IRX', '13-Week T-Bill', 'US Treasury yield'),
  treasury('us5y', '^FVX', '5-Year Treasury', 'US Treasury yield'),
  treasury('us10y', '^TNX', '10-Year Treasury', 'US Treasury yield'),
  treasury('us30y', '^TYX', '30-Year Treasury', 'US Treasury yield'),
  bondFund('agg', 'AGG', 'US Aggregate Bond', 'AGG, broad US bond ETF'),
  bondFund('tlt', 'TLT', 'Long-Term Treasury', 'TLT, 20+ year Treasury ETF'),
  bondFund('lqd', 'LQD', 'Investment Grade Corp', 'LQD, corporate bond ETF'),
  bondFund('hyg', 'HYG', 'High Yield Corp', 'HYG, corporate bond ETF'),
]

const COIN_INSTRUMENTS: CoinInstrument[] = [
  coin('bitcoin', 'Bitcoin', 'BTC'),
  coin('ethereum', 'Ethereum', 'ETH'),
  coin('solana', 'Solana', 'SOL'),
]

const TOTAL_CRYPTO_CAP: Instrument = {
  id: 'crypto-total',
  name: 'Total Crypto Market',
  detail: 'Market cap, all coins',
  category: 'crypto',
  kind: 'marketCap',
}

function stock(id: string, symbol: string, name: string, detail: string): YahooInstrument {
  return { id, symbol, name, detail, category: 'stocks', kind: 'index' }
}

function treasury(id: string, symbol: string, name: string, detail: string): YahooInstrument {
  return { id, symbol, name, detail, category: 'bonds', kind: 'yield' }
}

function bondFund(id: string, symbol: string, name: string, detail: string): YahooInstrument {
  return { id, symbol, name, detail, category: 'bonds', kind: 'fund' }
}

function coin(coinId: string, name: string, ticker: string): CoinInstrument {
  return {
    id: coinId,
    coinId,
    symbol: `${ticker}-USD`,
    name,
    detail: ticker,
    category: 'crypto',
    kind: 'coin',
  }
}

function toInstrument(source: Instrument): Instrument {
  const { id, name, detail, category, kind } = source
  return { id, name, detail, category, kind }
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    // Yahoo rejects requests that carry no browser-like user agent.
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)
  return (await response.json()) as T
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number
        regularMarketTime?: number
        chartPreviousClose?: number
        currentTradingPeriod?: { regular?: { start?: number; end?: number } }
      }
    }> | null
  }
}

async function fetchYahooQuote(instrument: YahooInstrument): Promise<AvailableQuote> {
  const { symbol } = instrument
  const data = await fetchJson<YahooChartResponse>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
  )
  const meta = data.chart?.result?.[0]?.meta
  const value = meta?.regularMarketPrice
  const previous = meta?.chartPreviousClose
  const time = meta?.regularMarketTime
  if (!isNumber(value) || !isNumber(previous) || previous === 0 || !isNumber(time)) {
    throw new Error(`Incomplete quote for ${symbol}`)
  }

  const session = meta?.currentTradingPeriod?.regular
  const nowSeconds = Date.now() / 1000
  const isOpen =
    isNumber(session?.start) &&
    isNumber(session?.end) &&
    nowSeconds >= session.start &&
    nowSeconds < session.end

  return {
    ...toInstrument(instrument),
    status: 'ok',
    value,
    change: value - previous,
    changePercent: ((value - previous) / previous) * 100,
    changeWindow: 'day',
    marketState: isOpen ? 'open' : 'closed',
    asOf: new Date(time * 1000).toISOString(),
  }
}

interface CoinMarketRow {
  id?: string
  current_price?: number
  price_change_24h?: number
  price_change_percentage_24h?: number
  last_updated?: string
}

async function fetchCoinQuotes(): Promise<Map<string, AvailableQuote>> {
  const ids = COIN_INSTRUMENTS.map((instrument) => instrument.coinId).join(',')
  const rows = await fetchJson<CoinMarketRow[]>(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`,
  )
  const quotes = new Map<string, AvailableQuote>()
  for (const instrument of COIN_INSTRUMENTS) {
    const row = rows.find((candidate) => candidate.id === instrument.coinId)
    if (
      !isNumber(row?.current_price) ||
      !isNumber(row.price_change_24h) ||
      !isNumber(row.price_change_percentage_24h) ||
      !row.last_updated
    ) {
      continue
    }
    quotes.set(instrument.id, {
      ...toInstrument(instrument),
      status: 'ok',
      value: row.current_price,
      change: row.price_change_24h,
      changePercent: row.price_change_percentage_24h,
      changeWindow: '24h',
      marketState: 'always',
      asOf: row.last_updated,
    })
  }
  return quotes
}

interface CoinGeckoGlobalResponse {
  data?: {
    total_market_cap?: { usd?: number }
    market_cap_change_percentage_24h_usd?: number
    updated_at?: number
  }
}

async function fetchTotalCryptoCap(): Promise<AvailableQuote> {
  const { data } = await fetchJson<CoinGeckoGlobalResponse>(
    'https://api.coingecko.com/api/v3/global',
  )
  const value = data?.total_market_cap?.usd
  const changePercent = data?.market_cap_change_percentage_24h_usd
  const updatedAt = data?.updated_at
  if (!isNumber(value) || !isNumber(changePercent) || !isNumber(updatedAt)) {
    throw new Error('Incomplete global crypto data')
  }
  return {
    ...TOTAL_CRYPTO_CAP,
    status: 'ok',
    value,
    change: null,
    changePercent,
    changeWindow: '24h',
    marketState: 'always',
    asOf: new Date(updatedAt * 1000).toISOString(),
  }
}

async function buildSnapshot(): Promise<MarketSnapshot> {
  const [yahooResults, coinResult, totalResult] = await Promise.all([
    Promise.allSettled(YAHOO_INSTRUMENTS.map(fetchYahooQuote)),
    fetchCoinQuotes().catch(() => new Map<string, AvailableQuote>()),
    fetchTotalCryptoCap().catch(() => null),
  ])

  const yahooQuotes: Quote[] = YAHOO_INSTRUMENTS.map((instrument, index) => {
    const result = yahooResults[index]
    if (result?.status === 'fulfilled') return result.value
    return { ...toInstrument(instrument), status: 'unavailable' }
  })
  const coinQuotes: Quote[] = COIN_INSTRUMENTS.map(
    (instrument) =>
      coinResult.get(instrument.id) ?? { ...toInstrument(instrument), status: 'unavailable' },
  )

  return {
    generatedAt: new Date().toISOString(),
    quotes: [
      ...yahooQuotes,
      totalResult ?? { ...TOTAL_CRYPTO_CAP, status: 'unavailable' },
      ...coinQuotes,
    ],
  }
}

let cache: { expires: number; snapshot: Promise<MarketSnapshot> } | null = null

// Holding the promise means concurrent requests share one upstream fan-out.
export function getMarketSnapshot(): Promise<MarketSnapshot> {
  const now = Date.now()
  if (cache && now < cache.expires) return cache.snapshot
  const snapshot = buildSnapshot()
  cache = { expires: now + CACHE_TTL_MS, snapshot }
  return snapshot
}

export function hasAnyQuote(snapshot: MarketSnapshot): boolean {
  return snapshot.quotes.some((quote) => quote.status === 'ok')
}

const HISTORY_WINDOWS: Record<
  Timeframe,
  // No day count means the latest session, which Yahoo works out per exchange.
  { days: number | null; interval: string; maxAgeSeconds: number }
> = {
  '1d': { days: null, interval: '5m', maxAgeSeconds: 60 },
  '1w': { days: 7, interval: '1h', maxAgeSeconds: 300 },
  '30d': { days: 30, interval: '1d', maxAgeSeconds: 1800 },
  '1y': { days: 365, interval: '1d', maxAgeSeconds: 3600 },
}

const HISTORY_SOURCES = new Map<string, { symbol: string; proxy: string | null }>([
  ...[...YAHOO_INSTRUMENTS, ...COIN_INSTRUMENTS].map(
    ({ id, symbol }) => [id, { symbol, proxy: null }] as const,
  ),
  // Total market cap history is paid-only everywhere we looked, so an index ETF stands in.
  [TOTAL_CRYPTO_CAP.id, { symbol: 'BITW', proxy: 'BITW, Bitwise 10 Crypto Index ETF' }],
  // History-only series for the Analysis cards: no quote card of their own.
  ...[
    ['vix', '^VIX'],
    ['xlk', 'XLK'],
    ['xlf', 'XLF'],
    ['xlv', 'XLV'],
    ['xle', 'XLE'],
    ['xly', 'XLY'],
    ['xlp', 'XLP'],
    ['xli', 'XLI'],
    ['xlb', 'XLB'],
    ['xlu', 'XLU'],
    ['xlre', 'XLRE'],
    ['xlc', 'XLC'],
  ].map(([id, symbol]) => [id!, { symbol: symbol!, proxy: null }] as const),
])

export function isTimeframe(value: string | null): value is Timeframe {
  return value !== null && Object.hasOwn(HISTORY_WINDOWS, value)
}

export function historyMaxAgeSeconds(timeframe: Timeframe): number {
  return HISTORY_WINDOWS[timeframe].maxAgeSeconds
}

interface YahooHistoryResponse {
  chart?: {
    result?: Array<{
      meta?: { exchangeTimezoneName?: string }
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
  }
}

async function fetchHistory(id: string, timeframe: Timeframe): Promise<QuoteHistory | null> {
  const source = HISTORY_SOURCES.get(id)
  if (!source) return null

  const { days, interval } = HISTORY_WINDOWS[timeframe]
  const now = Math.floor(Date.now() / 1000)
  const span = days === null ? 'range=1d' : `period1=${now - days * 86_400}&period2=${now}`
  const data = await fetchJson<YahooHistoryResponse>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(source.symbol)}` +
      `?${span}&interval=${interval}`,
  )

  const result = data.chart?.result?.[0]
  const closes = result?.indicators?.quote?.[0]?.close ?? []
  const points: HistoryPoint[] = []
  result?.timestamp?.forEach((seconds, index) => {
    const value = closes[index]
    if (isNumber(value)) points.push({ time: seconds * 1000, value })
  })
  if (points.length < 2) throw new Error(`Not enough history for ${source.symbol}`)

  return {
    id,
    timeframe,
    timeZone: result?.meta?.exchangeTimezoneName ?? 'UTC',
    intraday: interval !== '1d',
    proxy: source.proxy,
    points,
  }
}

const historyCache = new Map<string, { expires: number; history: Promise<QuoteHistory | null> }>()

export function getQuoteHistory(id: string, timeframe: Timeframe): Promise<QuoteHistory | null> {
  const key = `${id}|${timeframe}`
  const now = Date.now()
  const cached = historyCache.get(key)
  if (cached && now < cached.expires) return cached.history

  const history = fetchHistory(id, timeframe)
  historyCache.set(key, { expires: now + historyMaxAgeSeconds(timeframe) * 1000, history })
  history.catch(() => historyCache.delete(key))
  return history
}
