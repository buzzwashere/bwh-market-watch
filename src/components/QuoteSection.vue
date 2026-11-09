<script setup lang="ts">
import { computed } from 'vue'
import type { Quote } from '../../shared/market'
import DashboardSection from '@/components/DashboardSection.vue'
import QuoteCard from '@/components/QuoteCard.vue'

const props = defineProps<{
  title: string
  note?: string
  quotes: Quote[]
  placeholderCount: number
}>()

const ids = computed(() => props.quotes.map((quote) => quote.id))
</script>

<template>
  <DashboardSection :title="title" :note="note" :chart-ids="ids">
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
  </DashboardSection>
</template>
