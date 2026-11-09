<script setup lang="ts">
import { computed } from 'vue'

export interface BarRow {
  id: string
  name: string
  value: number
  // Drawn as a lighter bar behind the main one, e.g. the worst point in the period.
  secondary?: number
}

const props = defineProps<{
  rows: BarRow[]
  format: (value: number) => string
  label: string
  // Bars grow both ways from a centre line, in gain and loss colours.
  diverging?: boolean
}>()

const scale = computed(
  () =>
    Math.max(...props.rows.flatMap((row) => [Math.abs(row.value), Math.abs(row.secondary ?? 0)])) ||
    1,
)

function width(value: number): string {
  const share = Math.abs(value) / scale.value
  return `${(props.diverging ? share / 2 : share) * 100}%`
}
</script>

<template>
  <ul class="mt-3 flex flex-col gap-1.5 text-xs" :aria-label="label">
    <li
      v-for="row in rows"
      :key="row.id"
      class="grid grid-cols-[7.5rem_1fr_auto] items-center gap-2 sm:grid-cols-[9.5rem_1fr_auto]"
    >
      <span class="truncate text-ink-secondary">{{ row.name }}</span>
      <span class="relative h-3 rounded-sm bg-page" aria-hidden="true">
        <template v-if="diverging">
          <span class="absolute inset-y-0 left-1/2 w-px bg-line" />
          <span
            class="absolute inset-y-0 rounded-sm"
            :class="row.value >= 0 ? 'left-1/2 bg-up' : 'right-1/2 bg-down'"
            :style="{ width: width(row.value) }"
          />
        </template>
        <template v-else>
          <span
            v-if="row.secondary !== undefined"
            class="absolute inset-y-0 left-0 rounded-sm bg-accent/30"
            :style="{ width: width(row.secondary) }"
          />
          <span
            class="absolute inset-y-0 left-0 rounded-sm bg-accent"
            :style="{ width: width(row.value) }"
          />
        </template>
      </span>
      <span class="w-14 text-right font-medium">{{ format(row.value) }}</span>
    </li>
  </ul>
</template>
