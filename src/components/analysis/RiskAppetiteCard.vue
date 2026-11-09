<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import SeriesTable from '@/components/analysis/SeriesTable.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { RISK_APPETITE_ID } from '@/utils/analysis'
import { formatSignedPercent, moveClass, moveDirection } from '@/utils/format'
import { percentChanges } from '@/utils/seriesMath'

const SERIES = [
  { id: 'hyg', name: 'High Yield Corp (HYG)' },
  { id: 'tlt', name: 'Long-Term Treasury (TLT)' },
]

const { span, status, load, lastIndex, seriesFor, pointLabel } = useSeriesHistories(
  RISK_APPETITE_ID,
  SERIES,
)

const hoverIndex = ref<number | null>(null)
const shown = computed(() => hoverIndex.value ?? lastIndex.value)

// High-yield bonds over Treasuries, rebased to 100: rising when investors reach for risk.
const ratio = computed(() => {
  const hyg = seriesFor('hyg')?.values
  const tlt = seriesFor('tlt')?.values
  if (!hyg || !tlt) return []
  const raw = hyg.map((value, index) => value / (tlt[index] || 1))
  const base = raw[0] || 1
  return raw.map((value) => (value / base) * 100)
})

const lines = computed(() => [{ id: 'ratio', values: ratio.value, tone: 'series-1' as const }])

const shownRatio = computed(() => ratio.value[shown.value] ?? null)

const groups = computed(() => [
  {
    id: 'parts',
    rows: SERIES.map((item) => ({
      id: item.id,
      name: item.name,
      value: percentChanges(seriesFor(item.id)?.values ?? [])[shown.value],
    })),
  },
])

// The ratio needs both funds, so one missing fund means no chart.
const chartStatus = computed(() => {
  if (ratio.value.length >= 2) return status.value
  return status.value === 'ready' ? 'error' : status.value
})

const summary = computed(
  () =>
    `High-yield bonds relative to Treasuries, ${span.value}: ` +
    (shownRatio.value === null ? 'unavailable' : formatSignedPercent(shownRatio.value - 100)),
)
</script>

<template>
  <AnalysisCard
    title="Risk Appetite"
    detail="High-yield corporate bonds relative to long-term Treasuries, rebased to 100"
    :chart-id="RISK_APPETITE_ID"
  >
    <ChartState :status="chartStatus" @retry="load">
      <LineChart
        v-model:hover-index="hoverIndex"
        :lines="lines"
        :label="summary"
        :format="(value) => value.toFixed(1)"
        :baseline="100"
      />
    </ChartState>
    <p class="mt-2 min-h-4 text-xs">
      <span
        v-if="shownRatio !== null"
        class="font-medium"
        :class="moveClass('index', moveDirection(shownRatio - 100))"
      >
        {{ formatSignedPercent(shownRatio - 100) }}
      </span>
      <span class="ml-1 text-ink-muted">
        {{ hoverIndex === null ? span : pointLabel(hoverIndex) }}
      </span>
    </p>
    <p class="mt-1 text-xs text-ink-secondary">
      Rising means investors are favouring riskier debt (risk-on). Falling means they are moving to
      the safety of Treasuries (risk-off).
    </p>
    <SeriesTable class="mt-2" :groups="groups" :format="formatSignedPercent" />
  </AnalysisCard>
</template>
