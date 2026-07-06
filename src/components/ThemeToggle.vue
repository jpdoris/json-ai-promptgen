<!-- src/components/ThemeToggle.vue -->
<script setup lang="ts">
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const { mode, cycle } = useTheme()

const labels: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :title="`Theme: ${labels[mode]} (click to change)`"
    :aria-label="`Theme: ${labels[mode]}. Click to switch.`"
    @click="cycle"
  >
    <svg
      v-if="mode === 'light'"
      class="tt-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
    <svg
      v-else-if="mode === 'dark'"
      class="tt-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
    <svg
      v-else
      class="tt-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
    <span class="tt-label">{{ labels[mode] }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.theme-toggle:hover {
  background: var(--accent-tint);
  border-color: var(--border-strong);
}
.tt-icon {
  color: var(--muted);
}
.theme-toggle:hover .tt-icon {
  color: var(--accent);
}

/* On narrow screens drop the label to an icon-only button. */
@media (max-width: 560px) {
  .tt-label {
    display: none;
  }
  .theme-toggle {
    padding: 0.4rem;
  }
}
</style>
