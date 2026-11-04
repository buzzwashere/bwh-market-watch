<script setup lang="ts">
import type { Quote } from '../../shared/market'
import QuoteCard from '@/components/QuoteCard.vue'

defineProps<{
  title: string
  note?: string
  quotes: Quote[]
  placeholderCount: number
}>()
</script>

<template>
  <section>
    <div class="mb-3 flex flex-wrap items-baseline gap-x-3">
      <h2 class="text-lg font-semibold">{{ title }}</h2>
      <p v-if="note" class="text-sm text-ink-secondary">{{ note }}</p>
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
