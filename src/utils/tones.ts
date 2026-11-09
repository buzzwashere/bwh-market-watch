// Line colours for the Analysis charts. Written out in full so Tailwind finds every class.
export type Tone = 'series-1' | 'series-2' | 'series-3' | 'muted'

export const STROKE: Record<Tone, string> = {
  'series-1': 'stroke-series-1',
  'series-2': 'stroke-series-2',
  'series-3': 'stroke-series-3',
  muted: 'stroke-ink-muted',
}

export const FILL: Record<Tone, string> = {
  'series-1': 'bg-series-1',
  'series-2': 'bg-series-2',
  'series-3': 'bg-series-3',
  muted: 'bg-ink-muted',
}
