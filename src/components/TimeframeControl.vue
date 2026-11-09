<script setup lang="ts">
import type { Timeframe } from '../../shared/market'
import SegmentedControl from '@/components/SegmentedControl.vue'
import { TIMEFRAMES } from '@/utils/timeframes'

defineProps<{
  // Null when nothing is pressed, as on a section whose cards show different timeframes.
  selected: Timeframe | null
  label: string
  spacious?: boolean
}>()

const emit = defineEmits<{ select: [timeframe: Timeframe] }>()
</script>

<template>
  <SegmentedControl
    :options="TIMEFRAMES"
    :selected="selected"
    :label="label"
    :spacious="spacious"
    @select="emit('select', $event)"
  />
</template>
