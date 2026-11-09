import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'market-watch-collapsed'

function readCollapsed(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

// Which dashboard sections are collapsed, remembered between visits.
export const useSectionsStore = defineStore('sections', () => {
  const collapsed = ref<string[]>(readCollapsed())

  function isCollapsed(id: string): boolean {
    return collapsed.value.includes(id)
  }

  function toggle(id: string): void {
    collapsed.value = isCollapsed(id)
      ? collapsed.value.filter((item) => item !== id)
      : [...collapsed.value, id]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed.value))
    } catch {
      // Storage can be blocked; the state still holds until the page reloads.
    }
  }

  return { isCollapsed, toggle }
})
