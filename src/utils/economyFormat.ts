import type { EconomyIndicatorInfo } from '../../shared/economy'

const MINUS = '−'

// Rates move in hundredths; inflation and unemployment are reported to a tenth.
function decimals(info: EconomyIndicatorInfo): number {
  return info.group === 'rates' && info.unit === 'percent' ? 2 : 1
}

function fixed(value: number, digits: number): string {
  return Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function sign(value: number, text: string): string {
  if (Number(text.replace(/[^\d.]/g, '')) === 0) return text
  return `${value > 0 ? '+' : MINUS}${text}`
}

function compact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
}

function magnitude(info: EconomyIndicatorInfo, value: number): string {
  switch (info.unit) {
    case 'percent':
      return `${fixed(value, decimals(info))}%`
    case 'thousands':
      return `${fixed(value, 0)}K`
    case 'count':
      return compact(value)
    case 'index':
      return fixed(value, 1)
  }
}

export function formatEconomyValue(info: EconomyIndicatorInfo, value: number): string {
  const text = magnitude(info, value)
  if (info.signed) return sign(value, text)
  return value < 0 ? `${MINUS}${text}` : text
}

// Percent values change in percentage points, not percent.
export function formatEconomyChange(info: EconomyIndicatorInfo, change: number): string {
  if (info.unit === 'percent') return `${sign(change, fixed(change, decimals(info)))} pts`
  return sign(change, magnitude(info, change))
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

export function formatEconomyPeriod(
  info: EconomyIndicatorInfo,
  date: string,
  short = false,
): string {
  const day = parseDate(date)
  if (info.frequency === 'quarterly') {
    return `Q${Math.floor(day.getUTCMonth() / 3) + 1}${short ? '' : ` ${day.getUTCFullYear()}`}`
  }
  if (info.frequency === 'monthly') {
    return day.toLocaleDateString('en-US', {
      month: 'short',
      ...(short ? {} : { year: 'numeric' }),
      timeZone: 'UTC',
    })
  }
  return day.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(short ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  })
}
