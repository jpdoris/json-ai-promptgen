// composables/useTheme.ts
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'promptgen-theme'
const CYCLE: ThemeMode[] = ['light', 'dark', 'system']

const darkQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

function readStored(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // localStorage unavailable (e.g. private mode) — fall back to system.
  }
  return 'system'
}

// Resolve 'system' to the concrete OS preference so the favicon can be colored.
function effectiveTheme(m: ThemeMode): 'light' | 'dark' {
  if (m === 'system') return darkQuery?.matches ? 'dark' : 'light'
  return m
}

// The SVG favicon's own media query only tracks the OS, not the in-app toggle,
// so swap a theme-colored data-URI icon whenever the effective theme changes.
function faviconDataUri(theme: 'light' | 'dark'): string {
  const tile = theme === 'dark' ? '#223029' : '#cfe6dd'
  const glyph = theme === 'dark' ? '#8cc2b6' : '#2f7d6c'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${tile}"/>` +
    `<text x="32" y="33" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="ui-monospace, monospace" font-weight="700" font-size="38" fill="${glyph}">{}</text>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function applyFavicon(m: ThemeMode) {
  const link = document.querySelector<HTMLLinkElement>(
    'link[rel~="icon"][type="image/svg+xml"]',
  )
  if (link) link.href = faviconDataUri(effectiveTheme(m))
}

// 'system' means no override: remove the attribute and let prefers-color-scheme win.
function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
  applyFavicon(mode)
}

// Shared singleton so every consumer reflects the same state.
const mode = ref<ThemeMode>(readStored())
apply(mode.value)

// While following the OS, keep the favicon in sync if the OS theme flips.
darkQuery?.addEventListener('change', () => {
  if (mode.value === 'system') applyFavicon('system')
})

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
