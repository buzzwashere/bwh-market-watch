import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { MarketCategory, MarketSnapshot, Quote } from '../../shared/market'

const REFRESH_INTERVAL_MS = 60_000

export const useMarketStore = defineStore('market', () => {
  const quotes = ref<Quote[]>([])
  const generatedAt = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let timer: number | undefined

  const hasData = computed(() => quotes.value.length > 0)

  function quotesFor(category: MarketCategory): Quote[] {
    return quotes.value.filter((quote) => quote.category === category)
  }

  // A blip on one upstream should not blank a card that was fine a minute ago;
  // the card's as-of time keeps the held value honest.
  function mergeQuotes(incoming: Quote[]): Quote[] {
    return incoming.map((quote) => {
      if (quote.status === 'ok') return quote
      return quotes.value.find((held) => held.id === quote.id) ?? quote
    })
  }

  async function refresh(): Promise<void> {
    if (loading.value) return
    loading.value = true
    try {
      const response = await fetch('/api/quotes')
      if (!response.ok) throw new Error(`Quote service responded ${response.status}`)
      const snapshot = (await response.json()) as MarketSnapshot
      quotes.value = mergeQuotes(snapshot.quotes)
      generatedAt.value = snapshot.generatedAt
      error.value = null
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not load quotes'
    } finally {
      loading.value = false
    }
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') void refresh()
  }

  function startPolling(): void {
    if (timer !== undefined) return
    void refresh()
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  function stopPolling(): void {
    window.clearInterval(timer)
    timer = undefined
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  return {
    quotes,
    generatedAt,
    loading,
    error,
    hasData,
    quotesFor,
    refresh,
    startPolling,
    stopPolling,
  }
})
