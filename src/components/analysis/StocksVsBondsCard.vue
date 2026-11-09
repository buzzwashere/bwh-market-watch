<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import SeriesTable from '@/components/analysis/SeriesTable.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { STOCKS_VS_BONDS_ID } from '@/utils/analysis'
import { formatSignedPercent } from '@/utils/format'
import { percentChanges } from '@/utils/seriesMath'

// Bond ETFs rather than Treasury yields: a yield rises when bond prices fall, so it would
// read backwards beside the stock indices.
const SERIES = [
  { id: 'sp500', name: 'S&P 500', group: 'stocks' },
  { id: 'dow', name: 'Dow Jones', group: 'stocks' },
  { id: 'nasdaq', name: 'Nasdaq Composite', group: 'stocks' },
  { id: 'russell2000', name: 'Russell 2000', group: 'stocks' },
  { id: 'agg', name: 'US Aggregate Bond', group: 'bonds' },
  { id: 'tlt', name: 'Long-Term Treasury', group: 'bonds' },
  { id: 'lqd', name: 'Investment Grade Corp', group: 'bonds' },
  { id: 'hyg', name: 'High Yield Corp', group: 'bonds' },
]

const { span, status, load, series, lastIndex, pointLabel } = useSeriesHistories(
  STOCKS_VS_BONDS_ID,
  SERIES,
)

const hoverIndex = ref<number | null>(null)
const shown = computed(() => hoverIndex.value ?? lastIndex.value)

const changes = computed(() =>
  series.value.map((item) => ({ ...item, changes: percentChanges(item.values) })),
)

// Bonds first so the stock lines draw on top where they cross.
const lines = computed(() =>
  [...changes.value]
    .sort((a, b) => Number(a.group === 'stocks') - Number(b.group === 'stocks'))
    .map((item) => ({
      id: item.id,
      values: item.changes,
      tone: item.group === 'stocks' ? ('series-1' as const) : ('series-2' as const),
    })),
)

const groups = computed(() =>
  [
    { id: 'stocks', label: 'Stocks', swatch: 'bg-series-1' },
    { id: 'bonds', label: 'Bonds', swatch: 'bg-series-2' },
  ].map((group) => ({
    ...group,
    rows: SERIES.filter((item) => item.group === group.id).map((item) => ({
      id: item.id,
      name: item.name,
      value: changes.value.find(({ id }) => id === item.id)?.changes[shown.value],
    })),
  })),
)

const summary = computed(
  () =>
    `US stocks and bonds, change ${span.value}: ` +
    groups.value
      .flatMap((group) => group.rows)
      .filter((row) => row.value !== undefined)
      .map((row) => `${row.name} ${formatSignedPercent(row.value!)}`)
      .join(', '),
)
</script>

<template>
  <AnalysisCard
    title="US Stocks vs Bonds"
    detail="Percent change over the period, each from its own start"
    :chart-id="STOCKS_VS_BONDS_ID"
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
  </AnalysisCard>
</template>
