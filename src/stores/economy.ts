import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { EconomySnapshot } from '../../shared/economy'

export type EconomyRange = '1y' | '5y' | '10y'

export const ECONOMY_RANGES: ReadonlyArray<{ id: EconomyRange; label: string; years: number }> = [
  { id: '1y', label: '1 year', years: 1 },
  { id: '5y', label: '5 years', years: 5 },
  { id: '10y', label: '10 years', years: 10 },
]

const DEFAULT_RANGE: EconomyRange = '5y'
// The server caches for hours and most series change monthly; this only catches a new day.
const MAX_AGE_MS = 30 * 60_000

export const useEconomyStore = defineStore('economy', () => {
  const snapshot = ref<EconomySnapshot | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'not-configured' | 'error'>('idle')
  const fetchedAt = ref(0)
  const ranges = ref<Record<string, EconomyRange>>({})

  function rangeFor(id: string): EconomyRange {
    return ranges.value[id] ?? DEFAULT_RANGE
  }

  function setRanges(ids: string[], range: EconomyRange): void {
    for (const id of ids) ranges.value[id] = range
  }

  async function load(): Promise<void> {
    if (status.value === 'loading') return
    if (snapshot.value && Date.now() - fetchedAt.value < MAX_AGE_MS) return
    if (!snapshot.value) status.value = 'loading'
    try {
      const response = await fetch('/api/economy')
      if (response.status === 503) {
        status.value = 'not-configured'
        return
      }
      if (!response.ok) throw new Error(`Economy data responded ${response.status}`)
      snapshot.value = (await response.json()) as EconomySnapshot
      fetchedAt.value = Date.now()
      status.value = 'ready'
    } catch {
      // A failed refresh keeps the data already shown.
      status.value = snapshot.value ? 'ready' : 'error'
    }
  }

  return { snapshot, status, rangeFor, setRanges, load }
})
