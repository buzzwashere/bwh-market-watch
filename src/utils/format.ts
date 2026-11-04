import type { AvailableQuote, QuoteKind } from '../../shared/market'

const MINUS = '−'

function fixed(value: number, digits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function signed(value: number, digits: number): string {
  const rounded = fixed(Math.abs(value), digits)
  if (Number(rounded.replaceAll(',', '')) === 0) return rounded
  return `${value > 0 ? '+' : MINUS}${rounded}`
}

export function formatAmount(kind: QuoteKind, value: number): string {
  switch (kind) {
    case 'index':
      return fixed(value, 2)
    case 'yield':
      return `${fixed(value, 2)}%`
    case 'fund':
    case 'coin':
      return `$${fixed(value, 2)}`
    case 'marketCap':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(value)
  }
}

export function formatValue(quote: AvailableQuote): string {
  return formatAmount(quote.kind, quote.value)
}

export function formatPeriodChange(kind: QuoteKind, first: number, last: number): string {
  if (kind === 'yield') return `${signed((last - first) * 100, 1)} bp`
  return `${signed(((last - first) / first) * 100, 2)}%`
}

export function formatPointTime(time: number, intraday: boolean, timeZone: string): string {
  const options: Intl.DateTimeFormatOptions = intraday
    ? { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'short', day: 'numeric', year: 'numeric', timeZone }
  return new Date(time).toLocaleString(undefined, options)
}

export type MoveDirection = 'up' | 'down' | 'flat'

export function moveDirection(move: number): MoveDirection {
  if (move > 0) return 'up'
  return move < 0 ? 'down' : 'flat'
}

export const MOVE_ARROWS: Record<MoveDirection, string> = { up: '▲', down: '▼', flat: '–' }

// Green and red mean gain and loss, so a yield move stays neutral ink.
export function moveClass(kind: QuoteKind, direction: MoveDirection): string {
  if (kind === 'yield' || direction === 'flat') return 'text-ink-secondary'
  return direction === 'up' ? 'text-up' : 'text-down'
}

// Yields move in basis points; a percent change of a percentage just confuses.
export function formatChange(quote: AvailableQuote): string {
  if (quote.kind === 'yield') return `${signed((quote.change ?? 0) * 100, 1)} bp`
  const percent = `${signed(quote.changePercent, 2)}%`
  if (quote.change === null) return percent
  return `${signed(quote.change, 2)} (${percent})`
}

export function formatAsOf(iso: string): string {
  const date = new Date(iso)
  const isToday = date.toDateString() === new Date().toDateString()
  return date.toLocaleString(undefined, {
    ...(isToday ? {} : { month: 'short', day: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  })
}
