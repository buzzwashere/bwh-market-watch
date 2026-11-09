<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import DashboardSection from '@/components/DashboardSection.vue'
import QuoteSection from '@/components/QuoteSection.vue'
import StocksVsBondsCard from '@/components/StocksVsBondsCard.vue'
import { useMarketStore } from '@/stores/market'
import { ANALYSIS_CHART_IDS } from '@/utils/analysis'
import { formatAsOf } from '@/utils/format'

const market = useMarketStore()
const { generatedAt, loading, error, hasData } = storeToRefs(market)

onMounted(market.startPolling)
onUnmounted(market.stopPolling)
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div class="flex items-center gap-3 text-sm text-ink-secondary">
        <span v-if="generatedAt" aria-live="polite">Updated {{ formatAsOf(generatedAt) }}</span>
        <button
          type="button"
          class="rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-ink hover:bg-page disabled:opacity-50"
          :disabled="loading"
          @click="market.refresh"
        >
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <p
      v-if="error"
      role="alert"
      class="rounded-lg border border-down bg-surface px-4 py-3 text-sm text-down"
    >
      {{
        hasData
          ? `Could not refresh, showing the last values received. (${error})`
          : `Could not load market data. (${error})`
      }}
    </p>

    <template v-if="hasData || !error">
      <QuoteSection title="Stocks" :quotes="market.quotesFor('stocks')" :placeholder-count="8" />
      <QuoteSection
        title="Bonds"
        note="Treasury yields and bond ETFs"
        :quotes="market.quotesFor('bonds')"
        :placeholder-count="8"
      />
      <QuoteSection title="Crypto" :quotes="market.quotesFor('crypto')" :placeholder-count="4" />
      <DashboardSection v-if="hasData" title="Analysis" :chart-ids="ANALYSIS_CHART_IDS">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StocksVsBondsCard />
        </div>
      </DashboardSection>
    </template>
  </div>
</template>
