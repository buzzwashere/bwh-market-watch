<script setup lang="ts">
import { computed } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import BarList from '@/components/analysis/BarList.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { SECTORS_ID } from '@/utils/analysis'
import { formatSignedPercent, moveClass, moveDirection } from '@/utils/format'

// The Select Sector SPDR funds, one per S&P 500 sector.
const SECTORS = [
  { id: 'xlk', name: 'Technology' },
  { id: 'xlc', name: 'Communication' },
  { id: 'xly', name: 'Consumer Discretionary' },
  { id: 'xlp', name: 'Consumer Staples' },
  { id: 'xle', name: 'Energy' },
  { id: 'xlf', name: 'Financials' },
  { id: 'xlv', name: 'Health Care' },
  { id: 'xli', name: 'Industrials' },
  { id: 'xlb', name: 'Materials' },
  { id: 'xlre', name: 'Real Estate' },
  { id: 'xlu', name: 'Utilities' },
]

const SERIES = [...SECTORS, { id: 'sp500', name: 'S&P 500' }]

const { span, status, load, seriesFor } = useSeriesHistories(SECTORS_ID, SERIES)

function change(id: string): number | null {
  const values = seriesFor(id)?.values
  if (!values || values.length < 2) return null
  return (values.at(-1)! / values[0]! - 1) * 100
}

const rows = computed(() =>
  SECTORS.flatMap((sector) => {
    const value = change(sector.id)
    return value === null ? [] : [{ id: sector.id, name: sector.name, value }]
  }).sort((a, b) => b.value - a.value),
)

const market = computed(() => change('sp500'))

const summary = computed(
  () =>
    `S&P 500 sectors ranked by change ${span.value}: ` +
    rows.value.map((row) => `${row.name} ${formatSignedPercent(row.value)}`).join(', '),
)
</script>

<template>
  <AnalysisCard
    title="Sector Rotation"
    detail="S&P 500 sectors ranked by change over the period, from their sector ETFs"
    :chart-id="SECTORS_ID"
  >
    <ChartState :status="status" height="h-64" @retry="load">
      <BarList :rows="rows" :format="formatSignedPercent" :label="summary" diverging />
    </ChartState>
    <p v-if="market !== null" class="mt-3 text-xs text-ink-secondary">
      The S&P 500 as a whole:
      <span class="font-medium" :class="moveClass('index', moveDirection(market))">
        {{ formatSignedPercent(market) }}
      </span>
      {{ span }}. Sectors above it led the market; sectors below it lagged.
    </p>
  </AnalysisCard>
</template>
