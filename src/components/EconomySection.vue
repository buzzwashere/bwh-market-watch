<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { EconomyGroup } from '../../shared/economy'
import DashboardSection from '@/components/DashboardSection.vue'
import EconomyCard from '@/components/EconomyCard.vue'
import SegmentedControl from '@/components/SegmentedControl.vue'
import { ECONOMY_RANGES, useEconomyStore } from '@/stores/economy'
import { useMarketStore } from '@/stores/market'

const GROUPS: Array<{ id: EconomyGroup; label: string }> = [
  { id: 'inflation', label: 'Inflation' },
  { id: 'jobs', label: 'Jobs and growth' },
  { id: 'rates', label: 'Rates and expectations' },
]

const economy = useEconomyStore()
const { snapshot, status } = storeToRefs(economy)
const { generatedAt } = storeToRefs(useMarketStore())

onMounted(economy.load)
// Rides the quote poll; the store skips the request while its data is fresh.
watch(generatedAt, economy.load)

const indicators = computed(() => snapshot.value?.indicators ?? [])
const ids = computed(() => indicators.value.map(({ id }) => id))

const groups = computed(() =>
  GROUPS.map((group) => ({
    ...group,
    indicators: indicators.value.filter((indicator) => indicator.group === group.id),
  })).filter((group) => group.indicators.length),
)

// Pressed only while every card agrees; a card changed on its own leaves none pressed.
const sharedRange = computed(() => {
  const chosen = new Set(ids.value.map((id) => economy.rangeFor(id)))
  return chosen.size === 1 ? [...chosen][0]! : null
})
</script>

<template>
  <DashboardSection title="Economy" note="US data from the St. Louis Fed (FRED)">
    <template #controls>
      <SegmentedControl
        v-if="ids.length"
        spacious
        :options="ECONOMY_RANGES"
        :selected="sharedRange"
        label="Chart range for every Economy card"
        @select="economy.setRanges(ids, $event)"
      />
    </template>

    <div v-if="status === 'ready'" class="flex flex-col gap-5">
      <div v-for="group in groups" :key="group.id">
        <h3 class="mb-2 text-xs font-medium tracking-wide text-ink-muted uppercase">
          {{ group.label }}
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <EconomyCard
            v-for="indicator in group.indicators"
            :key="indicator.id"
            :indicator="indicator"
          />
        </div>
      </div>
    </div>
    <p
      v-else-if="status === 'not-configured'"
      class="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-secondary"
    >
      Economic data needs a FRED API key, which this server doesn't have yet.
    </p>
    <div
      v-else-if="status === 'error'"
      class="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm"
    >
      <span class="text-ink-secondary">Economic data is unavailable right now.</span>
      <button type="button" class="font-medium text-accent hover:underline" @click="economy.load">
        Retry
      </button>
    </div>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      <div
        v-for="index in 12"
        :key="index"
        class="h-64 animate-pulse rounded-xl border border-line bg-surface"
      />
    </div>
  </DashboardSection>
</template>
