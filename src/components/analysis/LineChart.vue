<script setup lang="ts">
import { computed } from 'vue'
import { FILL, STROKE, type Tone } from '@/utils/tones'

export interface ChartLine {
  id: string
  values: number[]
  tone: Tone
}

const props = withDefaults(
  defineProps<{
    lines: ChartLine[]
    label: string
    format: (value: number) => string
    // A reference level drawn as a dashed hairline, such as 0% or 100.
    baseline?: number | null
    // Labels the top and bottom of the range, for charts of levels rather than changes.
    rangeLabels?: boolean
    markers?: boolean
    height?: string
  }>(),
  { baseline: null, rangeLabels: false, markers: false, height: 'h-40' },
)

const hoverIndex = defineModel<number | null>('hoverIndex', { default: null })

// Keeps the lines off the chart's top and bottom edges.
const Y_INSET = 6

const length = computed(() => Math.max(...props.lines.map((line) => line.values.length), 0))

const range = computed(() => {
  const all = props.lines.flatMap((line) => line.values)
  if (props.baseline !== null) all.push(props.baseline)
  const min = Math.min(...all)
  const max = Math.max(...all)
  return { min, max, span: max - min || 1 }
})

function x(index: number): number {
  return (index / Math.max(length.value - 1, 1)) * 100
}

function y(value: number): number {
  const { min, span } = range.value
  return Y_INSET + (1 - (value - min) / span) * (100 - 2 * Y_INSET)
}

function points(values: number[]): string {
  return values.map((value, index) => `${x(index)},${y(value)}`).join(' ')
}

function onPointer(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement
  const { left, width } = target.getBoundingClientRect()
  const ratio = Math.min(Math.max((event.clientX - left) / width, 0), 1)
  hoverIndex.value = Math.round(ratio * (length.value - 1))
}
</script>

<template>
  <div class="px-1">
    <div
      class="relative cursor-crosshair touch-pan-y"
      :class="height"
      role="img"
      :aria-label="label"
      @pointermove="onPointer"
      @pointerdown="onPointer"
      @pointerleave="hoverIndex = null"
    >
      <svg
        class="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          v-if="baseline !== null"
          x1="0"
          x2="100"
          :y1="y(baseline)"
          :y2="y(baseline)"
          class="stroke-ink-muted"
          stroke-width="1"
          stroke-dasharray="4 3"
          vector-effect="non-scaling-stroke"
        />
        <polyline
          v-for="line in lines"
          :key="line.id"
          :points="points(line.values)"
          fill="none"
          :class="STROKE[line.tone]"
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <template v-if="markers">
        <template v-for="line in lines" :key="line.id">
          <div
            v-for="(value, index) in line.values"
            :key="index"
            class="absolute size-2 -translate-1/2 rounded-full ring-2 ring-surface"
            :class="FILL[line.tone]"
            :style="{ left: `${x(index)}%`, top: `${y(value)}%` }"
            aria-hidden="true"
          />
        </template>
      </template>
      <span
        v-if="baseline !== null"
        class="pointer-events-none absolute right-0 -translate-y-1/2 rounded-sm bg-surface px-0.5 text-[10px] text-ink-muted"
        :style="{ top: `${y(baseline)}%` }"
        aria-hidden="true"
      >
        {{ format(baseline) }}
      </span>
      <template v-if="rangeLabels">
        <span
          class="pointer-events-none absolute top-0 right-0 rounded-sm bg-surface px-0.5 text-[10px] text-ink-muted"
          aria-hidden="true"
        >
          {{ format(range.max) }}
        </span>
        <span
          class="pointer-events-none absolute right-0 bottom-0 rounded-sm bg-surface px-0.5 text-[10px] text-ink-muted"
          aria-hidden="true"
        >
          {{ format(range.min) }}
        </span>
      </template>
      <div
        v-if="hoverIndex !== null"
        class="absolute inset-y-0 w-px bg-ink-muted"
        :style="{ left: `${x(hoverIndex)}%` }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>
