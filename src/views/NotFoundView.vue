<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex flex-col items-start gap-3">
    <h1 class="text-2xl font-semibold tracking-tight">Page not found</h1>
    <RouterLink to="/" class="text-accent hover:underline">Back to the dashboard</RouterLink>
  </div>
</template>
