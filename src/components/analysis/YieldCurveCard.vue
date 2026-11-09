<script setup lang="ts">
import { computed, ref } from 'vue'
import AnalysisCard from '@/components/analysis/AnalysisCard.vue'
import ChartState from '@/components/analysis/ChartState.vue'
import LineChart from '@/components/analysis/LineChart.vue'
import { useSeriesHistories } from '@/composables/useSeriesHistories'
import { YIELD_CURVE_ID } from '@/utils/analysis'
import { moveClass, moveDirection } from '@/utils/format'

const MATURITIES = [
  { id: 'us13w', name: '13-week' },
  { id: 'us5y', name: '5-year' },
  { id: 'us10y', name: '10-year' },
  { id: 'us30y', name: '30-year' },
]

const { span, status, load, seriesFor } = useSeriesHistories(YIELD_CURVE_ID, MATURITIES)

// Points are evenly spaced by maturity, not to scale, so the short end stays readable.
const curve = computed(() =>
  MATURITIES.flatMap((maturity) => {
    const values = seriesFor(maturity.id)?.values
    if (!values?.length) return []
    return [{ ...maturity, start: values[0]!, now: values.at(-1)! }]
  }),
)

const lines = computed(() => [
  { id: 'start', values: curve.value.map((point) => point.start), tone: 'muted' as const },
  { id: 'now', values: curve.value.map((point) => point.now), tone: 'series-1' as const },
])

const hoverIndex = ref<number | null>(null)

function percent(value: number): string {
  return `${value.toFixed(2)}%`
}

function basisPoints(value: number): string {
  const rounded = Math.round(value * 100)
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)} bp`
}

// 10-year minus 13-week: below zero the curve is inverted, a classic recession warning.
const spread = computed(() => {
  const long = curve.value.find(({ id }) => id === 'us10y')
  const short = curve.value.find(({ id }) => id === 'us13w')
  if (!long || !short) return null
  return { start: long.start - short.start, now: long.now - short.now }
})

const summary = computed(
  () =>
    `US Treasury yield curve, ${span.value}: ` +
    curve.value.map((point) => `${point.name} ${percent(point.now)}`).join(', '),
)
</script>

<template>
  <AnalysisCard
    title="Yield Curve"
    detail="US Treasury yields by maturity, now and at the start of the period"
    :chart-id="YIELD_CURVE_ID"
  >
    <ChartState :status="status" @retry="load">
      <LineChart
        v-model:hover-index="hoverIndex"
        :lines="lines"
        :label="summary"
        :format="percent"
        range-labels
        markers
      />
      <div class="mt-1 flex justify-between px-1 text-[10px] text-ink-muted" aria-hidden="true">
        <span v-for="point in curve" :key="point.id">{{ point.name }}</span>
      </div>
    </ChartState>

    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <span class="flex items-center gap-2 font-medium">
        <span class="h-0.5 w-4 rounded-full bg-series-1" aria-hidden="true" />Now
      </span>
      <span class="flex items-center gap-2 font-medium">
        <span class="h-0.5 w-4 rounded-full bg-ink-muted" aria-hidden="true" />Start ({{ span }})
      </span>
    </div>

    <table class="mt-2 w-full text-xs">
      <thead class="text-ink-muted">
        <tr>
          <th class="text-left font-normal">Maturity</th>
          <th class="text-right font-normal">Start</th>
          <th class="text-right font-normal">Now</th>
          <th class="text-right font-normal">Change</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(point, index) in curve"
          :key="point.id"
          :class="{ 'bg-page': index === hoverIndex }"
        >
          <td class="text-ink-secondary">{{ point.name }}</td>
          <td class="text-right">{{ percent(point.start) }}</td>
          <td class="text-right font-medium">{{ percent(point.now) }}</td>
          <td class="text-right text-ink-secondary">{{ basisPoints(point.now - point.start) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-if="spread" class="mt-2 text-xs text-ink-secondary">
      10-year minus 13-week:
      <span class="font-medium" :class="moveClass('index', moveDirection(spread.now))">
        {{ basisPoints(spread.now) }}
      </span>
      <span v-if="spread.now < 0"> (inverted)</span>, from {{ basisPoints(spread.start) }}. Below
      zero, short-term debt pays more than long-term, which has often come before a recession.
    </p>
  </AnalysisCard>
</template>
