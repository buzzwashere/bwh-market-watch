<script setup lang="ts">
import { computed } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import BarList from '@/components/analysis/BarList.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { DRAWDOWNS_ID } from '@/utils/analysis'
import { formatSignedPercent } from '@/utils/format'
import { drawdowns } from '@/utils/seriesMath'

const SERIES = [
  { id: 'sp500', name: 'S&P 500' },
  { id: 'dow', name: 'Dow Jones' },
  { id: 'nasdaq', name: 'Nasdaq Composite' },
  { id: 'russell2000', name: 'Russell 2000' },
  { id: 'ftse100', name: 'FTSE 100' },
  { id: 'dax', name: 'DAX' },
  { id: 'nikkei225', name: 'Nikkei 225' },
  { id: 'hangseng', name: 'Hang Seng' },
]

const { span, status, load, seriesFor } = useSeriesHistories(DRAWDOWNS_ID, SERIES)

// Each index on its own bars, not the shared timeline, so a closed market adds nothing.
const rows = computed(() =>
  SERIES.flatMap((item) => {
    const values = seriesFor(item.id)?.values
    if (!values?.length) return []
    const { current, worst } = drawdowns(values)
    return [{ id: item.id, name: item.name, value: current, secondary: worst }]
  }),
)

const summary = computed(
  () =>
    `Drop from each index's high, ${span.value}: ` +
    rows.value
      .map(
        (row) =>
          `${row.name} ${formatSignedPercent(row.value)} now, worst ${formatSignedPercent(row.secondary)}`,
      )
      .join('; '),
)
</script>

<template>
  <AnalysisCard
    title="Drawdowns"
    detail="How far each index sits below its high for the period"
    :chart-id="DRAWDOWNS_ID"
  >
    <ChartState :status="status" height="h-56" @retry="load">
      <BarList :rows="rows" :format="formatSignedPercent" :label="summary" />
    </ChartState>
    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-secondary">
      <span class="flex items-center gap-2">
        <span class="size-2.5 rounded-sm bg-accent" aria-hidden="true" />Now
      </span>
      <span class="flex items-center gap-2">
        <span class="size-2.5 rounded-sm bg-accent/30" aria-hidden="true" />Deepest drop, {{ span }}
      </span>
    </div>
  </AnalysisCard>
</template>
