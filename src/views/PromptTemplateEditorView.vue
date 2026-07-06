<!-- src/views/PromptTemplateEditorView.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import PromptTemplateForm from '@/components/PromptTemplateForm.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { getAdapter } from '@/adapters'
import { examples, getExample } from '@/examples'
import { usePromptTemplateEditor } from '@/composables/usePromptTemplateEditor'

const {
  form,
  schemaError,
  isValid,
  payloadPreview,
  addMessage,
  removeMessage,
  reorderMessages,
  loadTemplate,
  reset,
  exportTemplate,
} = usePromptTemplateEditor()

const selectedExample = ref('')

function onSelectExample() {
  const example = getExample(selectedExample.value)
  if (example) {
    loadTemplate(example.template, example.label)
  } else {
    reset()
  }
}

const providerLabel = computed(() => getAdapter(form.value.provider).label)
const payloadJson = computed(() => JSON.stringify(payloadPreview.value, null, 2))

const copied = ref(false)

async function copyPayload() {
  try {
    await navigator.clipboard.writeText(payloadJson.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    copied.value = false
  }
}

function handleSubmit() {
  if (!isValid.value) return

  const savedTemplate = exportTemplate()
  console.log('template', savedTemplate)
  console.log('payload', payloadPreview.value)
}
</script>

<template>
  <div class="editor-page">
    <header class="toolbar">
      <label class="example-picker">
        <span>Load example</span>
        <select v-model="selectedExample" @change="onSelectExample">
          <option value="">Start from scratch</option>
          <option v-for="example in examples" :key="example.id" :value="example.id">
            {{ example.label }}
          </option>
        </select>
      </label>
      <ThemeToggle />
    </header>

    <div class="editor-layout">
    <PromptTemplateForm
      v-model="form"
      :schema-error="schemaError"
      @submit="handleSubmit"
      @add-message="addMessage"
      @remove-message="removeMessage"
      @reorder-message="(payload) => reorderMessages(payload.fromId, payload.toId)"
    />

    <aside class="preview-panel">
      <div class="preview-header">
        <h2>{{ providerLabel }} payload preview</h2>
        <button type="button" @click="copyPayload">{{ copied ? 'Copied!' : 'Copy JSON' }}</button>
      </div>
      <pre>{{ payloadJson }}</pre>
    </aside>
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  display: grid;
  gap: 1rem;
}
.toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem;
}
.example-picker {
  display: grid;
  gap: 0.375rem;
}
.example-picker > span {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}
.editor-layout {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(0, 2fr);
  gap: 1rem;
}
.preview-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  align-self: start;
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow: auto;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.preview-header h2 {
  font-size: 1rem;
  font-weight: 600;
}
pre {
  margin: 0;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.85rem;
  font-size: 0.8rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
@media (max-width: 960px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}
</style>
