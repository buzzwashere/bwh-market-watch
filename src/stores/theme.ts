import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'

// index.html reads this same key before first paint.
const STORAGE_KEY = 'market-watch-theme'

function readSavedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(readSavedTheme())

  const isDark = computed(() => theme.value === 'dark')

  function toggle(): void {
    theme.value = isDark.value ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch {
      // Storage can be blocked; the choice still holds until the page reloads.
    }
  }

  return { isDark, toggle }
})
