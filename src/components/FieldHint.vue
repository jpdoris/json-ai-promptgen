<!-- src/components/FieldHint.vue -->
<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <span class="hint" tabindex="0" role="note" :aria-label="text">
    <span aria-hidden="true" class="hint-marker">?</span>
    <span class="hint-bubble">{{ text }}</span>
  </span>
</template>

<style scoped>
.hint {
  position: relative;
  display: inline-flex;
  outline: none;
}
.hint-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  color: var(--muted);
  font-size: 0.7rem;
  line-height: 1;
  cursor: help;
  user-select: none;
}
.hint:hover .hint-marker,
.hint:focus-visible .hint-marker {
  border-color: var(--accent);
  color: var(--accent);
}
.hint-bubble {
  position: absolute;
  bottom: calc(100% + 6px);
  /* Anchor the bubble's left edge to the marker so it extends rightward and
     never clips offscreen for labels near the left edge of the form. */
  left: -0.25rem;
  z-index: 10;
  width: max-content;
  max-width: min(240px, calc(100vw - 1.5rem));
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  background: var(--ink);
  color: var(--ground);
  font-size: 0.75rem;
  font-weight: normal;
  line-height: 1.35;
  text-align: left;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  /* display:none (not visibility:hidden) so the hidden bubble doesn't occupy
     layout and add phantom horizontal scroll on narrow viewports. */
  display: none;
  opacity: 0;
  transition:
    opacity 0.12s ease,
    display 0.12s allow-discrete;
}
.hint-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  /* Keep the arrow pointing at the marker now that the bubble is left-anchored. */
  left: 0.5rem;
  border: 5px solid transparent;
  border-top-color: var(--ink);
}
.hint:hover .hint-bubble,
.hint:focus .hint-bubble,
.hint:focus-visible .hint-bubble {
  display: block;
  opacity: 1;
  @starting-style {
    opacity: 0;
  }
}
</style>
