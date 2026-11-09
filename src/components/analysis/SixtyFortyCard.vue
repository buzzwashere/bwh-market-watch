<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { SIXTY_FORTY_ID } from '@/utils/analysis'
import { formatSignedPercent, moveClass, moveDirection } from '@/utils/format'
import { drawdowns, percentChanges } from '@/utils/seriesMath'
import { FILL, type Tone } from '@/utils/tones'

const SERIES = [
  { id: 'sp500', name: 'S&P 500' },
  { id: 'agg', name: 'US Aggregate Bond' },
]

const { span, status, load, lastIndex, seriesFor, pointLabel } = useSeriesHistories(
  SIXTY_FORTY_ID,
  SERIES,
)

const hoverIndex = ref<number | null>(null)
const shown = computed(() => hoverIndex.value ?? lastIndex.value)

// Bought at the start and held: 60% in the S&P 500, 40% in the aggregate bond fund.
const portfolios = computed(() => {
  const stocks = seriesFor('sp500')?.values
  const bonds = seriesFor('agg')?.values
  if (!stocks || !bonds) return []
  const mix = stocks.map(
    (value, index) => 0.6 * (value / stocks[0]!) + 0.4 * (bonds[index]! / bonds[0]!),
  )
  const list: Array<{ id: string; name: string; tone: Tone; values: number[] }> = [
    { id: 'stocks', name: '100% stocks (S&P 500)', tone: 'series-1', values: stocks },
    { id: 'mix', name: '60% stocks, 40% bonds', tone: 'series-3', values: mix },
    { id: 'bonds', name: '100% bonds (AGG)', tone: 'series-2', values: bonds },
  ]
  return list.map((item) => ({
    ...item,
    changes: percentChanges(item.values),
    worst: drawdowns(item.values).worst,
  }))
})

// The mix needs both series, so one missing series means no chart.
const chartStatus = computed(() => {
  if (portfolios.value.length) return status.value
  return status.value === 'ready' ? 'error' : status.value
})

const lines = computed(() =>
  portfolios.value.map((item) => ({ id: item.id, values: item.changes, tone: item.tone })),
)

const summary = computed(
  () =>
    `Stocks, bonds and a 60/40 mix, change ${span.value}: ` +
    portfolios.value
      .map((item) => `${item.name} ${formatSignedPercent(item.changes.at(-1) ?? 0)}`)
      .join(', '),
)
</script>

<template>
  <AnalysisCard
    title="60/40 Portfolio"
    detail="What a classic stocks-and-bonds mix returned, against each on its own"
    :chart-id="SIXTY_FORTY_ID"
  >
    <ChartState :status="chartStatus" @retry="load">
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
    <table class="mt-1 w-full text-xs">
      <thead class="text-ink-muted">
        <tr>
          <th class="text-left font-normal">Portfolio</th>
          <th class="text-right font-normal">Return</th>
          <th class="text-right font-normal">Deepest drop</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in portfolios" :key="item.id">
          <td class="text-ink-secondary">
            <span
              class="mr-2 inline-block h-0.5 w-4 rounded-full align-middle"
              :class="FILL[item.tone]"
              aria-hidden="true"
            />{{ item.name }}
          </td>
          <td
            class="text-right font-medium"
            :class="moveClass('index', moveDirection(item.changes[shown] ?? 0))"
          >
            {{ formatSignedPercent(item.changes[shown] ?? 0) }}
          </td>
          <td class="text-right text-ink-secondary">{{ formatSignedPercent(item.worst) }}</td>
        </tr>
      </tbody>
    </table>
    <p class="mt-2 text-xs text-ink-muted">
      Bought at the start and held, with no rebalancing. Deepest drop covers the whole period.
    </p>
  </AnalysisCard>
</template>
