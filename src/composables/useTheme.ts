// composables/useTheme.ts
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'promptgen-theme'
const CYCLE: ThemeMode[] = ['light', 'dark', 'system']

function readStored(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // localStorage unavailable (e.g. private mode) — fall back to system.
  }
  return 'system'
}

// 'system' means no override: remove the attribute and let prefers-color-scheme win.
function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
}

// Shared singleton so every consumer reflects the same state.
const mode = ref<ThemeMode>(readStored())
apply(mode.value)

export function useTheme() {
  function setMode(next: ThemeMode) {
    mode.value = next
    apply(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Persistence is best-effort.
    }
  }

  function cycle() {
    const index = CYCLE.indexOf(mode.value)
    setMode(CYCLE[(index + 1) % CYCLE.length] ?? 'system')
  }

  return { mode, setMode, cycle }
}
