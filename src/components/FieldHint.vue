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
  border: 1px solid #b0b0b0;
  color: #666;
  font-size: 0.7rem;
  line-height: 1;
  cursor: help;
  user-select: none;
}
.hint-bubble {
  position: absolute;
  bottom: calc(100% + 6px);
  /* Anchor the bubble's left edge to the marker so it extends rightward and
     never clips offscreen for labels near the left edge of the form. */
  left: -0.25rem;
  z-index: 10;
  width: max-content;
  max-width: 240px;
  padding: 0.5rem 0.625rem;
  border-radius: 8px;
  background: #1f2933;
  color: #f5f7fa;
  font-size: 0.75rem;
  font-weight: normal;
  line-height: 1.35;
  text-align: left;
  white-space: normal;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.12s ease,
    visibility 0.12s ease;
}
.hint-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  /* Keep the arrow pointing at the marker now that the bubble is left-anchored. */
  left: 0.5rem;
  border: 5px solid transparent;
  border-top-color: #1f2933;
}
.hint:hover .hint-bubble,
.hint:focus .hint-bubble,
.hint:focus-visible .hint-bubble {
  opacity: 1;
  visibility: visible;
}
</style>
