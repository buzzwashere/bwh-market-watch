import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { QuoteHistory } from '../../shared/market'
import { useHistoryStore } from '@/stores/history'
import { useMarketStore } from '@/stores/market'
import { formatPointTime } from '@/utils/format'
import { TIMEFRAMES } from '@/utils/timeframes'

export interface SeriesSpec {
  id: string
  name: string
}

export type AlignedSeries<T extends SeriesSpec> = T & {
  values: number[]
  // False where the value was carried over from an earlier bar (market closed, holiday).
  present: boolean[]
}

// Exchanges stamp their bars differently, so bars are matched by trading day, or by
// 5-minute or hourly slot within a day.
function bucket(time: number, history: QuoteHistory): string {
  if (!history.intraday) {
    return new Date(time).toLocaleDateString('en-CA', { timeZone: history.timeZone })
  }
  const slot = history.timeframe === '1d' ? 5 * 60_000 : 60 * 60_000
  return String(Math.floor(time / slot))
}

// Loads several instruments' histories for one Analysis card and lines them up on a shared
// timeline. Every series has a value at every step, carried forward over gaps.
export function useSeriesHistories<T extends SeriesSpec>(chartId: string, specs: T[]) {
  const historyStore = useHistoryStore()
  const { generatedAt } = storeToRefs(useMarketStore())

  const timeframe = computed(() => historyStore.timeframeFor(chartId))
  const span = computed(() => TIMEFRAMES.find(({ id }) => id === timeframe.value)?.span ?? '')

  // Shares the history store's cache with the quote cards and the other Analysis cards.
  function load(): void {
    for (const { id } of specs) void historyStore.load(id, timeframe.value)
  }

  watch([timeframe, generatedAt], load, { immediate: true })

  const entries = computed(() =>
    specs.map((spec) => ({ spec, entry: historyStore.entryFor(spec.id, timeframe.value) })),
  )

  const loaded = computed(() =>
    entries.value.flatMap(({ spec, entry }) =>
      entry?.history && entry.history.points.length >= 2 ? [{ spec, history: entry.history }] : [],
    ),
  )

  const lead = computed(() => loaded.value[0]?.history ?? null)

  const timeline = computed(() => {
    const firstSeen = new Map<string, number>()
    for (const { history } of loaded.value) {
      for (const point of history.points) {
        const key = bucket(point.time, history)
        const seen = firstSeen.get(key)
        if (seen === undefined || point.time < seen) firstSeen.set(key, point.time)
      }
    }
    const intraday = lead.value?.intraday ?? false
    return [...firstSeen]
      .map(([key, time]) => ({ key, time }))
      .sort((a, b) => (intraday ? Number(a.key) - Number(b.key) : a.key.localeCompare(b.key)))
  })

  const series = computed<Array<AlignedSeries<T>>>(() =>
    loaded.value.map(({ spec, history }) => {
      const byKey = new Map(
        history.points.map((point) => [bucket(point.time, history), point.value]),
      )
      let held = history.points[0]?.value ?? 0
      const values: number[] = []
      const present: boolean[] = []
      for (const { key } of timeline.value) {
        const value = byKey.get(key)
        if (value !== undefined) held = value
        values.push(held)
        present.push(value !== undefined)
      }
      return { ...spec, values, present }
    }),
  )

  // Waits for every series, so a card never draws half its lines and then jumps. A background
  // refresh keeps its entry 'ready', so this only holds back a first load.
  const status = computed(() => {
    const pending = entries.value.some(({ entry }) => !entry || entry.status === 'loading')
    if (pending) return 'loading'
    return timeline.value.length >= 2 && series.value.length ? 'ready' : 'error'
  })

  const lastIndex = computed(() => Math.max(timeline.value.length - 1, 0))

  function seriesFor(id: string): AlignedSeries<T> | undefined {
    return series.value.find((item) => item.id === id)
  }

  function pointLabel(index: number): string {
    const point = timeline.value[index]
    const history = lead.value
    if (!point || !history) return ''
    return formatPointTime(point.time, history.intraday, history.timeZone)
  }

  return { timeframe, span, load, status, timeline, series, lastIndex, seriesFor, pointLabel }
}
