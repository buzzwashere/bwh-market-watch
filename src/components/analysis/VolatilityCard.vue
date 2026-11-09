<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { VOLATILITY_ID } from '@/utils/analysis'
import { formatAmount } from '@/utils/format'

const SERIES = [
  { id: 'sp500', name: 'S&P 500' },
  { id: 'vix', name: 'VIX' },
]

const { span, status, load, lastIndex, seriesFor, pointLabel } = useSeriesHistories(
  VOLATILITY_ID,
  SERIES,
)

// Two stacked charts on one timeline rather than one chart with two scales.
const hoverIndex = ref<number | null>(null)
const shown = computed(() => hoverIndex.value ?? lastIndex.value)

const sp500 = computed(() => seriesFor('sp500')?.values ?? [])
const vix = computed(() => seriesFor('vix')?.values ?? [])

function level(value: number): string {
  return formatAmount('index', value)
}

function vixLevel(value: number): string {
  return value.toFixed(1)
}

const mood = computed(() => {
  const value = vix.value[shown.value]
  if (value === undefined) return ''
  if (value >= 30) return 'high fear'
  return value >= 20 ? 'elevated' : 'calm'
})
</script>

<template>
  <AnalysisCard
    title="Volatility vs the Market"
    detail="The S&P 500 above, the VIX “fear index” below, on the same dates"
    :chart-id="VOLATILITY_ID"
  >
    <ChartState :status="status" height="h-56" @retry="load">
      <p class="text-xs text-ink-secondary">
        <span class="mr-1 inline-block h-0.5 w-4 rounded-full bg-series-1 align-middle" />S&P 500
        <span v-if="sp500[shown] !== undefined" class="ml-1 font-medium text-ink">
          {{ level(sp500[shown]!) }}
        </span>
      </p>
      <LineChart
        v-model:hover-index="hoverIndex"
        :lines="[{ id: 'sp500', values: sp500, tone: 'series-1' }]"
        :label="`S&P 500, ${span}`"
        :format="level"
        range-labels
        height="h-24"
      />
      <p class="mt-3 text-xs text-ink-secondary">
        <span class="mr-1 inline-block h-0.5 w-4 rounded-full bg-series-2 align-middle" />VIX
        <span v-if="vix[shown] !== undefined" class="ml-1 font-medium text-ink">
          {{ vixLevel(vix[shown]!) }}
        </span>
        <span v-if="mood" class="ml-1">({{ mood }})</span>
      </p>
      <LineChart
        v-model:hover-index="hoverIndex"
        :lines="[{ id: 'vix', values: vix, tone: 'series-2' }]"
        :label="`VIX, ${span}`"
        :format="vixLevel"
        :baseline="20"
        range-labels
        height="h-24"
      />
    </ChartState>
    <p class="mt-2 min-h-4 text-xs text-ink-muted">
      {{ hoverIndex === null ? span : pointLabel(hoverIndex) }}
    </p>
    <p class="mt-1 text-xs text-ink-secondary">
      The VIX prices how much the S&P 500 is expected to swing over the next 30 days. It usually
      rises when stocks fall. Under 20 is calm, over 30 is fearful; the dashed line marks 20.
    </p>
  </AnalysisCard>
</template>
