<script setup lang="ts" generic="T extends string">
defineProps<{
  options: ReadonlyArray<{ id: T; label: string }>
  // Null when nothing is pressed, as on a section whose cards show different choices.
  selected: T | null
  label: string
  // Roomier buttons for a header; a card needs all its buttons to fit its width.
  spacious?: boolean
}>()

const emit = defineEmits<{ select: [id: T] }>()
</script>

<template>
  <div class="flex rounded-md bg-page p-0.5" role="group" :aria-label="label">
    <button
      v-for="option in options"
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
