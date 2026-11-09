<script setup lang="ts">
import { moveClass, moveDirection } from '@/utils/format'

export interface TableRow {
  id: string
  name: string
  value: number | null | undefined
  // A Tailwind background class matching the row's line, when rows have their own colour.
  swatch?: string
}

export interface TableGroup {
  id: string
  label?: string
  swatch?: string
  rows: TableRow[]
}

withDefaults(
  defineProps<{
    groups: TableGroup[]
    format: (value: number) => string
    // Gain/loss colours for values that are changes; plain ink for levels.
    colorize?: boolean
  }>(),
  { colorize: true },
)
</script>

<template>
  <div
    class="mt-1 grid grid-cols-1 gap-x-6 gap-y-3 text-xs"
    :class="{ 'sm:grid-cols-2': groups.length > 1 }"
  >
    <div v-for="group in groups" :key="group.id">
      <p v-if="group.label" class="mb-1 flex items-center gap-2 font-medium">
        <span
          v-if="group.swatch"
          class="h-0.5 w-4 rounded-full"
          :class="group.swatch"
          aria-hidden="true"
        />
        {{ group.label }}
      </p>
      <dl class="flex flex-col gap-0.5">
        <div v-for="row in group.rows" :key="row.id" class="flex justify-between gap-3">
          <dt class="flex items-center gap-2 text-ink-secondary">
            <span
              v-if="row.swatch"
              class="h-0.5 w-4 rounded-full"
              :class="row.swatch"
              aria-hidden="true"
            />
            {{ row.name }}
          </dt>
          <dd
            v-if="row.value !== null && row.value !== undefined"
            class="font-medium"
            :class="colorize ? moveClass('index', moveDirection(row.value)) : 'text-ink'"
          >
            {{ format(row.value) }}
          </dd>
          <dd v-else class="text-ink-muted">—</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
