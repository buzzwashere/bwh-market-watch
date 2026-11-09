<script setup lang="ts">
withDefaults(defineProps<{ status: 'ready' | 'loading' | 'error'; height?: string }>(), {
  height: 'h-40',
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="mt-3">
    <slot v-if="status === 'ready'" />
    <div v-else-if="status === 'error'" class="flex items-center gap-2 text-xs" :class="height">
      <span class="text-ink-secondary">Chart unavailable</span>
      <button type="button" class="font-medium text-accent hover:underline" @click="emit('retry')">
        Retry
      </button>
    </div>
    <div v-else class="animate-pulse rounded-md bg-page" :class="height" aria-hidden="true" />
  </div>
</template>
