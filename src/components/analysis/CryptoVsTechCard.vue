<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import SeriesTable from '@/components/analysis/SeriesTable.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { CRYPTO_VS_TECH_ID } from '@/utils/analysis'
import { formatSignedPercent } from '@/utils/format'
import { percentChanges, returnCorrelation } from '@/utils/seriesMath'
import { FILL, type Tone } from '@/utils/tones'

const SERIES: Array<{ id: string; name: string; tone: Tone }> = [
  { id: 'nasdaq', name: 'Nasdaq Composite', tone: 'series-1' },
  { id: 'bitcoin', name: 'Bitcoin', tone: 'series-2' },
  { id: 'ethereum', name: 'Ethereum', tone: 'series-3' },
]

const { span, status, load, series, lastIndex, seriesFor, pointLabel } = useSeriesHistories(
  CRYPTO_VS_TECH_ID,
  SERIES,
)

const hoverIndex = ref<number | null>(null)
const shown = computed(() => hoverIndex.value ?? lastIndex.value)

const changes = computed(() =>
  series.value.map((item) => ({ ...item, changes: percentChanges(item.values) })),
)

const lines = computed(() =>
  changes.value.map((item) => ({ id: item.id, values: item.changes, tone: item.tone })),
)

const groups = computed(() => [
  {
    id: 'all',
    rows: SERIES.map((item) => ({
      id: item.id,
      name: item.name,
      swatch: FILL[item.tone],
      value: changes.value.find(({ id }) => id === item.id)?.changes[shown.value],
    })),
  },
])

// Only bars where the Nasdaq traded count, so crypto's weekends don't pair with flat stocks.
const correlations = computed(() => {
  const nasdaq = seriesFor('nasdaq')
  if (!nasdaq) return []
  return ['bitcoin', 'ethereum'].map((id) => {
    const coin = seriesFor(id)
    return {
      id,
      name: SERIES.find((item) => item.id === id)!.name,
      value: coin ? returnCorrelation(nasdaq, coin) : null,
    }
  })
})

const summary = computed(
  () =>
    `Crypto against the Nasdaq, change ${span.value}: ` +
    groups.value[0]!.rows.filter((row) => row.value !== undefined)
      .map((row) => `${row.name} ${formatSignedPercent(row.value!)}`)
      .join(', '),
)
</script>

<template>
  <AnalysisCard
    title="Crypto vs Tech Stocks"
    detail="Percent change, and how closely their moves line up"
    :chart-id="CRYPTO_VS_TECH_ID"
  >
    <ChartState :status="status" @retry="load">
      <LineChart
        v-model:hover-index="hoverIndex"
        :lines="lines"
        :label="summary"
        :format="formatSignedPercent"
        :baseline="0"
      />
    </ChartState>
    <p class="mt-2 min-h-4 text-xs text-ink-muted">
      {{ hoverIndex === null ? span : pointLabel(hoverIndex) }}
    </p>
    <SeriesTable :groups="groups" :format="formatSignedPercent" />
    <div v-if="correlations.length" class="mt-3 text-xs">
      <p class="mb-1 font-medium">Correlation with the Nasdaq, {{ span }}</p>
      <dl class="flex flex-col gap-0.5">
        <div v-for="item in correlations" :key="item.id" class="flex justify-between gap-3">
          <dt class="text-ink-secondary">{{ item.name }}</dt>
          <dd class="font-medium">{{ item.value === null ? '—' : item.value.toFixed(2) }}</dd>
        </div>
      </dl>
      <p class="mt-1 text-ink-muted">1 moves in lockstep, 0 unrelated, −1 opposite.</p>
    </div>
  </AnalysisCard>
</template>
