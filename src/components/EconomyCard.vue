<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EconomyIndicator } from '../../shared/economy'
import LineChart from '@/components/analysis/LineChart.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import { ECONOMY_RANGES, useEconomyStore } from '@/stores/economy'
import { formatEconomyChange, formatEconomyPeriod, formatEconomyValue } from '@/utils/economyFormat'
import { MOVE_ARROWS } from '@/utils/format'

const props = defineProps<{ indicator: EconomyIndicator }>()

const economy = useEconomyStore()
const range = computed(() => economy.rangeFor(props.indicator.id))

const allPoints = computed(() => (props.indicator.status === 'ok' ? props.indicator.points : []))
const latest = computed(() => allPoints.value.at(-1) ?? null)
const previous = computed(() => allPoints.value.at(-2) ?? null)

const points = computed(() => {
  const years = ECONOMY_RANGES.find(({ id }) => id === range.value)?.years ?? 5
  const cutoff = new Date()
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years)
  const from = cutoff.toISOString().slice(0, 10)
  return allPoints.value.filter((point) => point.date >= from)
})

const change = computed(() =>
  latest.value && previous.value ? latest.value.value - previous.value.value : null,
)
const changeText = computed(() =>
  change.value === null ? '' : formatEconomyChange(props.indicator, change.value),
)

// Read off the formatted text, so a change that rounds to zero gets no arrow.
const direction = computed(() => {
  if (changeText.value.startsWith('+')) return 'up'
  return changeText.value.startsWith('−') ? 'down' : 'flat'
})

const hoverIndex = ref<number | null>(null)
const hoverPoint = computed(() =>
  hoverIndex.value === null ? null : (points.value[hoverIndex.value] ?? null),
)

const spanLabel = computed(
  () => `past ${ECONOMY_RANGES.find(({ id }) => id === range.value)?.label ?? ''}`,
)

function format(value: number): string {
  return formatEconomyValue(props.indicator, value)
}

const targetNote = computed(() => {
  const { target } = props.indicator
  if (target === null) return null
  return target === 0 ? 'Dashed line: zero' : `Dashed line: the Fed's ${target}% target`
})

const summary = computed(() => {
  const first = points.value[0]
  const last = points.value.at(-1)
  if (!first || !last) return props.indicator.name
  return (
    `${props.indicator.name}, ${spanLabel.value}: from ${format(first.value)} in ` +
    `${formatEconomyPeriod(props.indicator, first.date)} to ${format(last.value)} in ` +
    formatEconomyPeriod(props.indicator, last.date)
  )
})
</script>

<template>
  <article class="flex flex-col rounded-xl border border-line bg-surface p-4">
    <h3 class="text-sm font-medium">
      {{ indicator.name
      }}<sup class="ml-0.5"
        ><a
          href="#fred-notice"
          class="text-ink-muted hover:text-ink hover:underline"
          aria-label="Footnote 1, FRED notice"
          >1</a
        ></sup
      >
    </h3>
    <p class="text-xs text-ink-muted">{{ indicator.detail }}</p>

    <template v-if="latest">
      <p class="mt-3 flex items-baseline gap-2">
        <span class="text-2xl font-semibold tracking-tight">{{ format(latest.value) }}</span>
        <span class="text-xs text-ink-muted">{{
          formatEconomyPeriod(indicator, latest.date)
        }}</span>
      </p>
      <!-- Neutral ink: rising inflation or unemployment is not a gain. -->
      <p v-if="change !== null && previous" class="mt-0.5 text-sm text-ink-secondary">
        <span aria-hidden="true" class="text-xs">{{ MOVE_ARROWS[direction] }}</span>
        {{ changeText }}
        <span class="text-ink-muted">
          from {{ formatEconomyPeriod(indicator, previous.date, true) }}
        </span>
      </p>

      <div v-if="points.length >= 2" class="mt-3">
        <LineChart
          v-model:hover-index="hoverIndex"
          :lines="[
            { id: indicator.id, values: points.map((point) => point.value), tone: 'accent' },
          ]"
          :label="summary"
          :format="format"
          :baseline="indicator.target"
          height="h-16"
        />
      </div>
      <p class="mt-2 min-h-4 text-xs">
        <template v-if="hoverPoint">
          <span class="font-medium">{{ format(hoverPoint.value) }}</span>
          <span class="text-ink-muted">
            · {{ formatEconomyPeriod(indicator, hoverPoint.date) }}</span
          >
        </template>
        <span v-else class="text-ink-muted">{{ spanLabel }}</span>
      </p>
      <p v-if="targetNote" class="text-xs text-ink-muted">{{ targetNote }}</p>
    </template>
    <p v-else class="mt-3 text-sm text-ink-secondary">Data unavailable</p>

    <SegmentedControl
      class="mt-auto pt-3"
      :options="ECONOMY_RANGES"
      :selected="range"
      :label="`Chart range for ${indicator.name}`"
      @select="economy.setRanges([indicator.id], $event)"
    />
  </article>
</template>
