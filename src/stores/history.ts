import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { QuoteHistory, Timeframe } from '../../shared/market'

const DEFAULT_TIMEFRAME: Timeframe = '30d'
const MAX_AGE_MS = 5 * 60_000
// Under the 60s quote poll, so an open session's chart updates on every poll.
const TODAY_MAX_AGE_MS = 30_000

export interface HistoryEntry {
  status: 'loading' | 'ready' | 'error'
  history: QuoteHistory | null
  fetchedAt: number
}

export const useHistoryStore = defineStore('history', () => {
  // Lives here rather than in the card so a choice survives a trip to another view.
  const timeframes = ref<Record<string, Timeframe>>({})
  const entries = ref<Record<string, HistoryEntry>>({})

  function timeframeFor(id: string): Timeframe {
    return timeframes.value[id] ?? DEFAULT_TIMEFRAME
  }

  function setTimeframe(id: string, timeframe: Timeframe): void {
    timeframes.value[id] = timeframe
  }

  function setTimeframes(ids: string[], timeframe: Timeframe): void {
    for (const id of ids) timeframes.value[id] = timeframe
  }

  function entryFor(id: string, timeframe: Timeframe): HistoryEntry | undefined {
    return entries.value[`${id}|${timeframe}`]
  }

  async function load(id: string, timeframe: Timeframe): Promise<void> {
    const key = `${id}|${timeframe}`
    const current = entries.value[key]
    if (current?.status === 'loading') return
    const maxAge = timeframe === '1d' ? TODAY_MAX_AGE_MS : MAX_AGE_MS
    if (current?.status === 'ready' && Date.now() - current.fetchedAt < maxAge) return

    // A background refresh keeps the drawn chart; only a first load shows the placeholder.
    const held = current?.history ?? null
    if (!held) entries.value[key] = { status: 'loading', history: null, fetchedAt: 0 }

    try {
      const params = new URLSearchParams({ id, timeframe })
      const response = await fetch(`/api/history?${params}`)
      if (!response.ok) throw new Error(`History responded ${response.status}`)
      const history = (await response.json()) as QuoteHistory
      entries.value[key] = { status: 'ready', history, fetchedAt: Date.now() }
    } catch {
      entries.value[key] = held
        ? { status: 'ready', history: held, fetchedAt: current?.fetchedAt ?? 0 }
        : { status: 'error', history: null, fetchedAt: 0 }
    }
  }

  return { timeframes, entries, timeframeFor, setTimeframe, setTimeframes, entryFor, load }
})
