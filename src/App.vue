<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import AppBar from '@/components/AppBar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppBar />
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <RouterView />
    </main>
    <AppFooter />
    <!-- Vercel Web Analytics: page views, including router navigations. Reports only
         from the deployed site, once Analytics is enabled in the Vercel dashboard. -->
    <Analytics />
  </div>
</template>
