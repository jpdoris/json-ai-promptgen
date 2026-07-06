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
  validationIssues,
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

const downloadName = computed(() => {
  const slug = form.value.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'prompt'}.json`
})

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

function downloadPayload() {
  const blob = new Blob([payloadJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = downloadName.value
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
    <header class="masthead">
      <span class="brand-mark" aria-hidden="true">{&nbsp;}</span>
      <div class="brand-text">
        <h1 class="brand-name">json-promptgen</h1>
        <p class="brand-tagline">
          Build prompt templates and preview the exact JSON payload for each model provider.
        </p>
      </div>
      <ThemeToggle class="masthead-toggle" />
    </header>

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
        <div class="preview-actions">
          <button
            type="button"
            class="icon-btn"
            :title="copied ? 'Copied!' : 'Copy JSON'"
            :aria-label="copied ? 'JSON copied to clipboard' : 'Copy JSON to clipboard'"
            @click="copyPayload"
          >
            <svg
              v-if="!copied"
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
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <svg
              v-else
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </button>
          <button
            type="button"
            class="icon-btn"
            :title="`Download ${downloadName}`"
            :aria-label="`Download JSON as ${downloadName}`"
            @click="downloadPayload"
          >
            <svg
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
          </button>
        </div>
      </div>

      <p class="sr-only" role="status" aria-live="polite">{{ copied ? 'Copied' : '' }}</p>

      <ul v-if="validationIssues.length" class="preview-warnings" aria-live="polite">
        <li v-for="issue in validationIssues" :key="issue">{{ issue }}</li>
      </ul>
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
.masthead {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 12px;
  background: var(--accent-tint-strong);
  color: var(--accent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
  font-size: 1.35rem;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.brand-name {
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.brand-tagline {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}
.masthead-toggle {
  margin-left: auto;
  align-self: center;
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
.preview-actions {
  display: flex;
  gap: 0.4rem;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.icon-btn:hover {
  background: var(--accent-tint);
  border-color: var(--border-strong);
  color: var(--accent);
}
.preview-warnings {
  list-style: none;
  margin: 0 0 0.75rem;
  padding: 0.6rem 0.75rem;
  display: grid;
  gap: 0.35rem;
  border: 1px solid var(--danger-border);
  border-radius: 8px;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.82rem;
}
.preview-warnings li::before {
  content: '⚠ ';
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
