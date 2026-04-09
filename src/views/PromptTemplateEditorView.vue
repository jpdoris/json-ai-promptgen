<!-- src/views/PromptTemplateEditorView.vue -->
<script setup lang="ts">
import { watch } from 'vue'
import PromptTemplateForm from '@/components/PromptTemplateForm.vue'
import { usePromptTemplateEditor } from '@/composables/usePromptTemplateEditor'

const {
  form,
  schemaError,
  isValid,
  payloadPreview,
  addMessage,
  removeMessage,
  moveMessage,
  exportTemplate,
} = usePromptTemplateEditor()

function handleSubmit() {
  if (!isValid.value) return

  const savedTemplate = exportTemplate()
  console.log('template', savedTemplate)
  console.log('openai payload', payloadPreview.value)
}

watch(
  form,
  () => {
    // optional autosave hook
  },
  { deep: true },
)
</script>

<template>
  <div class="editor-layout">
    <PromptTemplateForm
      v-model="form"
      :schema-error="schemaError"
      @submit="handleSubmit"
      @add-message="addMessage"
      @remove-message="removeMessage"
      @move-message="moveMessage"
    />

    <aside class="preview-panel">
      <h2>OpenAI payload preview</h2>
      <pre>{{ JSON.stringify(payloadPreview, null, 2) }}</pre>
    </aside>
  </div>
</template>

<style scoped>
.editor-layout {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(0, 2fr);
  gap: 1rem;
}
.preview-panel {
  border: 1px solid #dcdcdc;
  border-radius: 12px;
  padding: 1rem;
  overflow: auto;
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
}
@media (max-width: 960px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }
}
</style>
