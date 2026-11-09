<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import SeriesTable from '@/components/analysis/SeriesTable.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { GLOBAL_EQUITIES_ID } from '@/utils/analysis'
import { formatSignedPercent } from '@/utils/format'
import { percentChanges } from '@/utils/seriesMath'
import { FILL, type Tone } from '@/utils/tones'

const REGIONS: Array<{ id: string; label: string; tone: Tone }> = [
  { id: 'us', label: 'United States', tone: 'series-1' },
  { id: 'europe', label: 'Europe', tone: 'series-2' },
  { id: 'asia', label: 'Asia', tone: 'series-3' },
]

const SERIES = [
  { id: 'sp500', name: 'S&P 500', region: 'us' },
  { id: 'nasdaq', name: 'Nasdaq Composite', region: 'us' },
  { id: 'ftse100', name: 'FTSE 100', region: 'europe' },
  { id: 'dax', name: 'DAX', region: 'europe' },
  { id: 'nikkei225', name: 'Nikkei 225', region: 'asia' },
  { id: 'hangseng', name: 'Hang Seng', region: 'asia' },
]

const { span, status, load, series, lastIndex, pointLabel } = useSeriesHistories(
  GLOBAL_EQUITIES_ID,
  SERIES,
)

const hoverIndex = ref<number | null>(null)
const shown = computed(() => hoverIndex.value ?? lastIndex.value)

const changes = computed(() =>
  series.value.map((item) => ({ ...item, changes: percentChanges(item.values) })),
)

const lines = computed(() =>
  changes.value.map((item) => ({
    id: item.id,
    values: item.changes,
    tone: REGIONS.find(({ id }) => id === item.region)!.tone,
  })),
)

const groups = computed(() =>
  REGIONS.map((region) => ({
    id: region.id,
    label: region.label,
    swatch: FILL[region.tone],
    rows: SERIES.filter((item) => item.region === region.id).map((item) => ({
      id: item.id,
      name: item.name,
      value: changes.value.find(({ id }) => id === item.id)?.changes[shown.value],
    })),
  })),
)

const summary = computed(
  () =>
    `Stock markets by region, change ${span.value}: ` +
    groups.value
      .flatMap((group) => group.rows)
      .filter((row) => row.value !== undefined)
      .map((row) => `${row.name} ${formatSignedPercent(row.value!)}`)
      .join(', '),
)
</script>

<template>
  <AnalysisCard
    title="Global Equities"
    detail="Percent change by region. A closed market holds its last value."
    :chart-id="GLOBAL_EQUITIES_ID"
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
