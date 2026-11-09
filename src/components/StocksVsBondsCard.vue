<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { QuoteHistory } from '../../shared/market'
import TimeframeControl from '@/components/TimeframeControl.vue'
import { useHistoryStore } from '@/stores/history'
import { useMarketStore } from '@/stores/market'
import { formatPointTime, formatSignedPercent, moveClass, moveDirection } from '@/utils/format'
import { STOCKS_VS_BONDS_ID } from '@/utils/analysis'
import { TIMEFRAMES } from '@/utils/timeframes'

type Group = 'stocks' | 'bonds'

// Bond ETFs rather than Treasury yields: a yield rises when bond prices fall, so it would
// read backwards beside the stock indices.
const SERIES: Array<{ id: string; group: Group }> = [
  { id: 'sp500', group: 'stocks' },
  { id: 'dow', group: 'stocks' },
  { id: 'nasdaq', group: 'stocks' },
  { id: 'russell2000', group: 'stocks' },
  { id: 'agg', group: 'bonds' },
  { id: 'tlt', group: 'bonds' },
  { id: 'lqd', group: 'bonds' },
  { id: 'hyg', group: 'bonds' },
]

const GROUPS: Array<{ id: Group; label: string; stroke: string; swatch: string }> = [
  { id: 'stocks', label: 'Stocks', stroke: 'stroke-series-stocks', swatch: 'bg-series-stocks' },
  { id: 'bonds', label: 'Bonds', stroke: 'stroke-series-bonds', swatch: 'bg-series-bonds' },
]

// Keeps the lines off the chart's top and bottom edges.
const Y_INSET = 6

const historyStore = useHistoryStore()
const market = useMarketStore()
const { generatedAt } = storeToRefs(market)

const timeframe = computed(() => historyStore.timeframeFor(STOCKS_VS_BONDS_ID))
const span = computed(() => TIMEFRAMES.find(({ id }) => id === timeframe.value)?.span ?? '')

// The same histories the stock and bond cards load, so a shared timeframe costs nothing extra.
function load(): void {
  for (const { id } of SERIES) void historyStore.load(id, timeframe.value)
}

watch([timeframe, generatedAt], load, { immediate: true })

const entries = computed(() =>
  SERIES.map((series) => ({
    ...series,
    name: market.quotes.find((quote) => quote.id === series.id)?.name ?? series.id,
    entry: historyStore.entryFor(series.id, timeframe.value),
  })),
)

const loaded = computed(() =>
  entries.value.filter(
    (series): series is typeof series & { entry: { history: QuoteHistory } } =>
      (series.entry?.history?.points.length ?? 0) >= 2,
  ),
)

const reference = computed(
  () => loaded.value.find(({ id }) => id === 'sp500') ?? loaded.value[0] ?? null,
)

// Indices and ETFs stamp their bars a little differently, so points are matched by
// trading day, or by 5-minute or hourly slot within a day.
function bucket(time: number, history: QuoteHistory): string {
  if (!history.intraday)
    return new Date(time).toLocaleDateString('en-CA', { timeZone: history.timeZone })
  const slot = history.timeframe === '1d' ? 5 * 60_000 : 60 * 60_000
  return String(Math.floor(time / slot))
}

const timeline = computed(() => {
  const history = reference.value?.entry.history
  if (!history) return []
  return history.points.map((point) => ({ time: point.time, key: bucket(point.time, history) }))
})

// Each line as percent change from its first value on the shared timeline.
const lines = computed(() =>
  loaded.value.map((series) => {
    const { history } = series.entry
    const byBucket = new Map(
      history.points.map((point) => [bucket(point.time, history), point.value]),
    )
    let held: number | undefined = history.points[0]?.value
    const values = timeline.value.map(({ key }) => {
      held = byBucket.get(key) ?? held
      return held ?? 0
    })
    const base = values[0] || 1
    return { ...series, changes: values.map((value) => (value / base - 1) * 100) }
  }),
)

const yRange = computed(() => {
  const all = lines.value.flatMap(({ changes }) => changes)
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  return { min, span: max - min || 1 }
})

function y(change: number): number {
  const { min, span } = yRange.value
  return Y_INSET + (1 - (change - min) / span) * (100 - 2 * Y_INSET)
}

function x(index: number): number {
  return (index / Math.max(timeline.value.length - 1, 1)) * 100
}

// Bonds first so the stock lines draw on top where they cross.
const drawOrder = computed(() =>
  [...lines.value].sort((a, b) => Number(a.group === 'stocks') - Number(b.group === 'stocks')),
)

function polyline(changes: number[]): string {
  return changes.map((change, index) => `${x(index)},${y(change)}`).join(' ')
}

const hoverIndex = ref<number | null>(null)

function onPointer(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement
  const { left, width } = target.getBoundingClientRect()
  const ratio = Math.min(Math.max((event.clientX - left) / width, 0), 1)
  hoverIndex.value = Math.round(ratio * (timeline.value.length - 1))
}

const shownIndex = computed(() => hoverIndex.value ?? timeline.value.length - 1)

const readoutLabel = computed(() => {
  const history = reference.value?.entry.history
  const point = timeline.value[shownIndex.value]
  if (hoverIndex.value === null || !history || !point) return span.value
  return formatPointTime(point.time, history.intraday, history.timeZone)
})

const table = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    rows: entries.value
      .filter((series) => series.group === group.id)
      .map((series) => {
        const line = lines.value.find(({ id }) => id === series.id)
        const change = line?.changes[shownIndex.value]
        return { id: series.id, name: series.name, change }
      }),
  })),
)

const status = computed(() => {
  if (timeline.value.length >= 2) return 'ready'
  return entries.value.some(({ entry }) => !entry || entry.status === 'loading')
    ? 'loading'
    : 'error'
})

const summary = computed(() => {
  const parts = table.value.flatMap((group) =>
    group.rows
      .filter((row) => row.change !== undefined)
      .map((row) => `${row.name} ${formatSignedPercent(row.change!)}`),
  )
  return `US stocks and bonds, change ${span.value}: ${parts.join(', ')}`
})
</script>

<template>
  <article class="flex flex-col rounded-xl border border-line bg-surface p-4 sm:col-span-2">
    <h3 class="text-sm font-medium">US Stocks vs Bonds</h3>
    <p class="text-xs text-ink-muted">Percent change over the period, each from its own start</p>

    <div v-if="status === 'ready'" class="mt-3 px-1">
      <div
        class="relative h-40 cursor-crosshair touch-pan-y"
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
          <line
            x1="0"
            x2="100"
            :y1="y(0)"
            :y2="y(0)"
            class="stroke-line"
            stroke-width="1"
            stroke-dasharray="3 3"
            vector-effect="non-scaling-stroke"
          />
          <polyline
            v-for="line in drawOrder"
            :key="line.id"
            :points="polyline(line.changes)"
            fill="none"
            :class="GROUPS.find((group) => group.id === line.group)?.stroke"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <span
          class="pointer-events-none absolute right-0 -translate-y-1/2 text-[10px] text-ink-muted"
          :style="{ top: `${y(0)}%` }"
          aria-hidden="true"
        >
          0%
        </span>
        <div
          v-if="hoverIndex !== null"
          class="absolute inset-y-0 w-px bg-ink-muted"
          :style="{ left: `${x(hoverIndex)}%` }"
          aria-hidden="true"
        />
      </div>
    </div>
    <div v-else-if="status === 'error'" class="mt-3 flex h-40 items-center gap-2 text-xs">
      <span class="text-ink-secondary">Chart unavailable</span>
      <button type="button" class="font-medium text-accent hover:underline" @click="load">
        Retry
      </button>
    </div>
    <div v-else class="mt-3 h-40 animate-pulse rounded-md bg-page" aria-hidden="true" />

    <p class="mt-2 min-h-4 text-xs text-ink-muted">{{ readoutLabel }}</p>

    <div class="mt-1 grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
      <div v-for="group in table" :key="group.id">
        <p class="mb-1 flex items-center gap-2 font-medium">
          <span class="h-0.5 w-4 rounded-full" :class="group.swatch" aria-hidden="true" />
          {{ group.label }}
        </p>
        <dl class="flex flex-col gap-0.5">
          <div v-for="row in group.rows" :key="row.id" class="flex justify-between gap-3">
            <dt class="text-ink-secondary">{{ row.name }}</dt>
            <dd
              v-if="row.change !== undefined"
              class="font-medium"
              :class="moveClass('index', moveDirection(row.change))"
            >
              {{ formatSignedPercent(row.change) }}
            </dd>
            <dd v-else class="text-ink-muted">—</dd>
          </div>
        </dl>
      </div>
    </div>

    <TimeframeControl
      class="mt-3"
      :selected="timeframe"
      label="Chart timeframe for US Stocks vs Bonds"
      @select="historyStore.setTimeframe(STOCKS_VS_BONDS_ID, $event)"
    />
  </article>
</template>
