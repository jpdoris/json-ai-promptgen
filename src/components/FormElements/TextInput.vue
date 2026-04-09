<template>
  <input
    class="text-input"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<style lang="css" scoped>
.text-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: var(--color-primary);
  outline: none;
}
</style>
