<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { AvailableQuote, Timeframe } from '../../shared/market'
import { useHistoryStore } from '@/stores/history'
import { useMarketStore } from '@/stores/market'
import {
  formatAmount,
  formatPeriodChange,
  formatPointTime,
  MOVE_ARROWS,
  moveClass,
  moveDirection,
} from '@/utils/format'

const TIMEFRAMES: Array<{ id: Timeframe; label: string; span: string }> = [
  { id: '1d', label: 'Today', span: 'since open' },
  { id: '1w', label: '1 week', span: 'past week' },
  { id: '30d', label: '30 days', span: 'past 30 days' },
  { id: '1y', label: 'Last year', span: 'past year' },
]

// Keeps the line and its end marker off the chart's edges.
const Y_INSET = 8

const props = defineProps<{ quote: AvailableQuote }>()

const historyStore = useHistoryStore()
const { generatedAt } = storeToRefs(useMarketStore())

const timeframe = computed(() => historyStore.timeframeFor(props.quote.id))
const entry = computed(() => historyStore.entryFor(props.quote.id, timeframe.value))
const history = computed(() => entry.value?.history ?? null)
const points = computed(() => history.value?.points ?? [])

function exchangeDay(time: number, timeZone: string): string {
  return new Date(time).toLocaleDateString('en-CA', { timeZone })
}

const span = computed(() => {
  const lastPoint = points.value.at(-1)
  if (timeframe.value === '1d' && history.value && lastPoint) {
    if (props.quote.kind === 'coin') return 'since 00:00 UTC'
    // Before the open, on a holiday, or at a weekend, the chart is the latest session.
    const { timeZone } = history.value
    if (exchangeDay(lastPoint.time, timeZone) !== exchangeDay(Date.now(), timeZone)) {
      const day = new Date(lastPoint.time).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone,
      })
      return `since open, ${day}`
    }
  }
  return TIMEFRAMES.find(({ id }) => id === timeframe.value)?.span ?? ''
})

// The stand-in series is an ETF price, so it can't borrow the card's own format.
const kind = computed(() => (history.value?.proxy ? 'fund' : props.quote.kind))

function load(): void {
  void historyStore.load(props.quote.id, timeframe.value)
}

// Each quote refresh is a chance to replace a history that has gone stale.
watch([timeframe, generatedAt], load, { immediate: true })

const coordinates = computed(() => {
  const values = points.value.map((point) => point.value)
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const lastIndex = Math.max(values.length - 1, 1)
  return values.map((value, index) => ({
    x: (index / lastIndex) * 100,
    y: Y_INSET + (1 - (value - min) / range) * (100 - 2 * Y_INSET),
  }))
})

const polyline = computed(() => coordinates.value.map(({ x, y }) => `${x},${y}`).join(' '))

const hoverIndex = ref<number | null>(null)

function onPointer(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement
  const { left, width } = target.getBoundingClientRect()
  const ratio = Math.min(Math.max((event.clientX - left) / width, 0), 1)
  hoverIndex.value = Math.round(ratio * (points.value.length - 1))
}

const hoverPoint = computed(() =>
  hoverIndex.value === null ? null : (points.value[hoverIndex.value] ?? null),
)

const marker = computed(
  () => coordinates.value[hoverIndex.value ?? coordinates.value.length - 1] ?? null,
)

const first = computed(() => points.value[0]?.value ?? 0)
const last = computed(() => points.value.at(-1)?.value ?? 0)
const direction = computed(() => moveDirection(last.value - first.value))

const summary = computed(() => {
  const from = formatAmount(kind.value, first.value)
  const to = formatAmount(kind.value, last.value)
  const source = history.value?.proxy ? ` (${history.value.proxy})` : ''
  return `${props.quote.name}${source}, ${span.value}: from ${from} to ${to}`
})
</script>

<template>
  <div class="mt-3 flex flex-col gap-2">
    <div v-if="points.length" class="px-1">
      <div
        class="relative h-16 cursor-crosshair touch-pan-y"
        role="img"
        :aria-label="summary"
        @pointermove="onPointer"
        @pointerdown="onPointer"
        @pointerleave="hoverIndex = null"
      >
        <svg
          class="absolute inset-0 size-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            :points="polyline"
            fill="none"
            class="stroke-accent"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <div
          v-if="hoverPoint && marker"
          class="absolute inset-y-0 w-px bg-ink-muted"
          :style="{ left: `${marker.x}%` }"
          aria-hidden="true"
        />
        <div
          v-if="marker"
          class="absolute size-2 -translate-1/2 rounded-full bg-accent ring-2 ring-surface"
          :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
          aria-hidden="true"
        />
      </div>
    </div>
    <div v-else-if="entry?.status === 'error'" class="flex h-16 items-center gap-2 text-xs">
      <span class="text-ink-secondary">Chart unavailable</span>
      <button type="button" class="font-medium text-accent hover:underline" @click="load">
        Retry
      </button>
    </div>
    <div v-else class="h-16 animate-pulse rounded-md bg-page" aria-hidden="true" />

    <p class="min-h-4 text-xs">
      <template v-if="hoverPoint && history">
        <span class="font-medium">{{ formatAmount(kind, hoverPoint.value) }}</span>
        <span class="text-ink-muted">
          · {{ formatPointTime(hoverPoint.time, history.intraday, history.timeZone) }}
        </span>
      </template>
      <template v-else-if="points.length">
        <span class="font-medium" :class="moveClass(kind, direction)">
          <span aria-hidden="true">{{ MOVE_ARROWS[direction] }}</span>
          {{ formatPeriodChange(kind, first, last) }}
        </span>
        <span class="ml-1 text-ink-muted">{{ span }}</span>
      </template>
    </p>

    <p v-if="history?.proxy" class="text-xs text-ink-muted">Chart shows {{ history.proxy }}</p>

    <div
      class="flex rounded-md bg-page p-0.5"
      role="group"
      :aria-label="`Chart timeframe for ${quote.name}`"
    >
      <button
        v-for="option in TIMEFRAMES"
        :key="option.id"
        type="button"
        class="flex-1 rounded px-0.5 py-1 text-xs whitespace-nowrap text-ink-secondary hover:text-ink"
        :class="{ 'bg-surface font-medium !text-ink shadow-sm': option.id === timeframe }"
        :aria-pressed="option.id === timeframe"
        @click="historyStore.setTimeframe(quote.id, option.id)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
