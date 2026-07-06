<!-- src/components/CollapsiblePanel.vue -->
<script setup lang="ts">
withDefaults(defineProps<{ title: string; open?: boolean }>(), { open: true })
</script>

<template>
  <details class="panel" :open="open">
    <summary class="panel-summary">
      <h2 class="panel-title">{{ title }}</h2>
      <svg
        class="chevron"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </summary>
    <div class="panel-content">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}
.panel-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  list-style: none;
}
.panel-summary::-webkit-details-marker {
  display: none;
}
.panel-summary:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
  border-radius: 4px;
}
.panel-title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.chevron {
  flex: none;
  color: var(--muted);
  transition: transform 0.15s ease;
}
.panel[open] .chevron {
  transform: rotate(90deg);
}
.panel-content {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}
</style>
