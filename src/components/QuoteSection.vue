<script setup lang="ts">
import { computed } from 'vue'
import type { Quote } from '../../shared/market'
import QuoteCard from '@/components/QuoteCard.vue'
import TimeframeControl from '@/components/TimeframeControl.vue'
import { useHistoryStore } from '@/stores/history'

const props = defineProps<{
  title: string
  note?: string
  quotes: Quote[]
  placeholderCount: number
}>()

const historyStore = useHistoryStore()

const ids = computed(() => props.quotes.map((quote) => quote.id))

// Pressed only while every card agrees; a card changed on its own leaves none pressed.
const sharedTimeframe = computed(() => {
  const chosen = new Set(ids.value.map((id) => historyStore.timeframeFor(id)))
  return chosen.size === 1 ? [...chosen][0]! : null
})
</script>

<template>
  <section>
    <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <h2 class="text-lg font-semibold">{{ title }}</h2>
      <p v-if="note" class="text-sm text-ink-secondary">{{ note }}</p>
      <TimeframeControl
        v-if="quotes.length"
        class="ml-auto"
        spacious
        :selected="sharedTimeframe"
        :label="`Chart timeframe for every ${title} card`"
        @select="historyStore.setTimeframes(ids, $event)"
      />
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <template v-if="quotes.length">
        <QuoteCard v-for="quote in quotes" :key="quote.id" :quote="quote" />
      </template>
      <template v-else>
        <div
          v-for="index in placeholderCount"
          :key="index"
          class="h-72 animate-pulse rounded-xl border border-line bg-surface"
          aria-hidden="true"
        />
      </template>
    </div>
  </section>
</template>
