import type { Timeframe } from '../../shared/market'

export const TIMEFRAMES: Array<{ id: Timeframe; label: string; span: string }> = [
  { id: '1d', label: 'Today', span: 'since open' },
  { id: '1w', label: '1 week', span: 'past week' },
  { id: '30d', label: '30 days', span: 'past 30 days' },
  { id: '1y', label: 'Last year', span: 'past year' },
]
