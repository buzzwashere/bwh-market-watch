<script setup lang="ts">
import { computed } from 'vue'
import type { AvailableQuote, Quote } from '../../shared/market'
import QuoteTrend from '@/components/QuoteTrend.vue'
import {
  formatAsOf,
  formatChange,
  formatValue,
  MOVE_ARROWS,
  moveClass,
  moveDirection,
} from '@/utils/format'

const props = defineProps<{ quote: Quote }>()

const available = computed<AvailableQuote | null>(() =>
  props.quote.status === 'ok' ? props.quote : null,
)

const direction = computed(() => moveDirection(available.value?.changePercent ?? 0))
const changeClass = computed(() => moveClass(props.quote.kind, direction.value))
const arrow = computed(() => MOVE_ARROWS[direction.value])

const stateLabel = computed(() => {
  const state = available.value?.marketState
  if (state === 'open') return 'Open'
  return state === 'closed' ? 'Closed' : '24/7'
})
</script>

<template>
  <article class="flex flex-col rounded-xl border border-line bg-surface p-4">
    <h3 class="text-sm font-medium">{{ quote.name }}</h3>
    <p class="text-xs text-ink-muted">{{ quote.detail }}</p>

    <template v-if="available">
      <p class="mt-3 text-2xl font-semibold tracking-tight">{{ formatValue(available) }}</p>
      <p class="mt-0.5 text-sm font-medium" :class="changeClass">
        <span aria-hidden="true" class="text-xs">{{ arrow }}</span>
        {{ formatChange(available) }}
        <span v-if="available.changeWindow === '24h'" class="font-normal text-ink-muted">24h</span>
      </p>
      <QuoteTrend :quote="available" />
      <p class="mt-3 text-xs text-ink-muted">
        {{ stateLabel }} · as of {{ formatAsOf(available.asOf) }}
      </p>
    </template>

    <p v-else class="mt-3 text-sm text-ink-secondary">Quote unavailable</p>
  </article>
</template>
