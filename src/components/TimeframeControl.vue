<script setup lang="ts">
import type { Timeframe } from '../../shared/market'
import { TIMEFRAMES } from '@/utils/timeframes'

defineProps<{
  // Null when nothing is pressed, as on a section whose cards show different timeframes.
  selected: Timeframe | null
  label: string
  // Roomier buttons for a header; a card needs all four to fit its width.
  spacious?: boolean
}>()

const emit = defineEmits<{ select: [timeframe: Timeframe] }>()
</script>

<template>
  <div class="flex rounded-md bg-page p-0.5" role="group" :aria-label="label">
    <button
      v-for="option in TIMEFRAMES"
      :key="option.id"
      type="button"
      class="flex-1 rounded py-1 text-xs whitespace-nowrap text-ink-secondary hover:text-ink"
      :class="[
        spacious ? 'px-2.5' : 'px-0.5',
        { 'bg-surface font-medium !text-ink shadow-sm': option.id === selected },
      ]"
      :aria-pressed="option.id === selected"
      @click="emit('select', option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
