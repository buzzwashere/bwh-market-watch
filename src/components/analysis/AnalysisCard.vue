<script setup lang="ts">
import { computed } from 'vue'
import TimeframeControl from '@/components/TimeframeControl.vue'
import { useHistoryStore } from '@/stores/history'

const props = defineProps<{ title: string; detail: string; chartId: string }>()

const historyStore = useHistoryStore()
const timeframe = computed(() => historyStore.timeframeFor(props.chartId))
</script>

<template>
  <article class="flex flex-col rounded-xl border border-line bg-surface p-4 sm:col-span-2">
    <h3 class="text-sm font-medium">{{ title }}</h3>
    <p class="text-xs text-ink-muted">{{ detail }}</p>
    <slot />
    <TimeframeControl
      class="mt-auto pt-3"
      :selected="timeframe"
      :label="`Chart timeframe for ${title}`"
      @select="historyStore.setTimeframe(chartId, $event)"
    />
  </article>
</template>
