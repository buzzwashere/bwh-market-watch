<script setup lang="ts">
import { computed, useId } from 'vue'
import TimeframeControl from '@/components/TimeframeControl.vue'
import { useHistoryStore } from '@/stores/history'
import { useSectionsStore } from '@/stores/sections'

const props = withDefaults(
  defineProps<{
    title: string
    note?: string
    // The charts the header's timeframe control drives. A section with other kinds of range
    // (the Economy section) passes its own control in the `controls` slot instead.
    chartIds?: string[]
  }>(),
  { chartIds: () => [] },
)

const historyStore = useHistoryStore()
const sections = useSectionsStore()
const contentId = useId()

const collapsed = computed(() => sections.isCollapsed(props.title))

// Pressed only while every card agrees; a card changed on its own leaves none pressed.
const sharedTimeframe = computed(() => {
  const chosen = new Set(props.chartIds.map((id) => historyStore.timeframeFor(id)))
  return chosen.size === 1 ? [...chosen][0]! : null
})
</script>

<template>
  <section>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2" :class="{ 'mb-3': !collapsed }">
      <h2 class="text-lg font-semibold">
        <button
          type="button"
          class="-ml-1 flex items-center gap-1.5 rounded-md px-1 hover:bg-surface"
          :aria-expanded="!collapsed"
          :aria-controls="contentId"
          @click="sections.toggle(title)"
        >
          <svg
            class="size-4 text-ink-muted transition-transform"
            :class="{ '-rotate-90': collapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          {{ title }}
        </button>
      </h2>
      <p v-if="note" class="text-sm text-ink-secondary">{{ note }}</p>
      <!-- Stays usable while collapsed, so the timeframe can be set before reopening. -->
      <div class="ml-auto">
        <slot name="controls">
          <TimeframeControl
            v-if="chartIds.length"
            spacious
            :selected="sharedTimeframe"
            :label="`Chart timeframe for every ${title} card`"
            @select="historyStore.setTimeframes(chartIds, $event)"
          />
        </slot>
      </div>
    </div>
    <!-- v-show keeps the cards mounted, so their charts are ready when the section reopens. -->
    <div v-show="!collapsed" :id="contentId">
      <slot />
    </div>
  </section>
</template>
