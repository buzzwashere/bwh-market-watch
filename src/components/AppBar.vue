<script setup lang="ts">
import { RouterLink } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/about', label: 'About' },
]
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-line bg-surface">
    <div class="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
      <RouterLink to="/" class="flex items-center gap-2.5">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        <span class="text-lg font-semibold tracking-tight whitespace-nowrap">Market Watch</span>
      </RouterLink>
      <nav class="ml-auto flex gap-1 text-sm" aria-label="Main">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-md px-2 py-1.5 text-ink-secondary hover:bg-page hover:text-ink sm:px-3"
          exact-active-class="bg-page font-medium !text-ink"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <ThemeToggle />
    </div>
  </header>
</template>
