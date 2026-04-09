<!-- src/components/PromptTemplateForm.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { PromptTemplateForm } from '@/composables/usePromptTemplateEditor'

const props = defineProps<{
  modelValue: PromptTemplateForm
  schemaError?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: PromptTemplateForm): void
  (e: 'submit'): void
  (e: 'add-message', role?: 'developer' | 'user' | 'assistant'): void
  (e: 'remove-message', id: string): void
  (e: 'move-message', payload: { id: string; direction: 'up' | 'down' }): void
}>()

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function updateField<K extends keyof PromptTemplateForm>(key: K, value: PromptTemplateForm[K]) {
  form.value = {
    ...form.value,
    [key]: value,
  }
}

function updateMessage(id: string, patch: Partial<PromptTemplateForm['messages'][number]>) {
  form.value = {
    ...form.value,
    messages: form.value.messages.map((message) =>
      message.id === id ? { ...message, ...patch } : message,
    ),
  }
}

function updateStructuredOutput<K extends keyof PromptTemplateForm['structuredOutput']>(
  key: K,
  value: PromptTemplateForm['structuredOutput'][K],
) {
  form.value = {
    ...form.value,
    structuredOutput: {
      ...form.value.structuredOutput,
      [key]: value,
    },
  }
}

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <form class="prompt-form" @submit.prevent="handleSubmit">
    <section class="panel">
      <h2>Template</h2>

      <label class="field">
        <span>Name</span>
        <input
          :value="form.name"
          type="text"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="field">
        <span>Model</span>
        <input
          :value="form.model"
          type="text"
          @input="updateField('model', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="field">
        <span>Instructions</span>
        <textarea
          :value="form.instructions"
          rows="5"
          @input="updateField('instructions', ($event.target as HTMLTextAreaElement).value)"
        />
      </label>
    </section>

    <section class="panel">
      <h2>Generation</h2>

      <label class="field">
        <span>Temperature</span>
        <input
          :value="form.temperature"
          type="number"
          min="0"
          max="2"
          step="0.1"
          @input="updateField('temperature', Number(($event.target as HTMLInputElement).value))"
        />
      </label>

      <label class="field">
        <span>Max output tokens</span>
        <input
          :value="form.maxOutputTokens"
          type="number"
          min="1"
          step="1"
          @input="updateField('maxOutputTokens', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Messages</h2>
        <button type="button" @click="$emit('add-message', 'user')">Add message</button>
      </div>

      <div v-for="(message, index) in form.messages" :key="message.id" class="message-card">
        <div class="message-toolbar">
          <label class="field compact">
            <span>Role</span>
            <select
              :value="message.role"
              @change="
                updateMessage(message.id, {
                  role: ($event.target as HTMLSelectElement).value as
                    | 'developer'
                    | 'user'
                    | 'assistant',
                })
              "
            >
              <option value="developer">developer</option>
              <option value="user">user</option>
              <option value="assistant">assistant</option>
            </select>
          </label>

          <div class="message-actions">
            <button
              type="button"
              @click="$emit('move-message', { id: message.id, direction: 'up' })"
            >
              ↑
            </button>
            <button
              type="button"
              @click="$emit('move-message', { id: message.id, direction: 'down' })"
            >
              ↓
            </button>
            <button type="button" @click="$emit('remove-message', message.id)">Remove</button>
          </div>
        </div>

        <label class="field">
          <span>Content</span>
          <textarea
            :value="message.content"
            rows="5"
            @input="
              updateMessage(message.id, { content: ($event.target as HTMLTextAreaElement).value })
            "
          />
        </label>

        <small>Message {{ index + 1 }}</small>
      </div>
    </section>

    <section class="panel">
      <label class="checkbox">
        <input
          :checked="form.structuredOutput.enabled"
          type="checkbox"
          @change="updateStructuredOutput('enabled', ($event.target as HTMLInputElement).checked)"
        />
        <span>Enable structured output</span>
      </label>

      <template v-if="form.structuredOutput.enabled">
        <label class="field">
          <span>Schema name</span>
          <input
            :value="form.structuredOutput.name"
            type="text"
            @input="updateStructuredOutput('name', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <label class="checkbox">
          <input
            :checked="form.structuredOutput.strict"
            type="checkbox"
            @change="updateStructuredOutput('strict', ($event.target as HTMLInputElement).checked)"
          />
          <span>Strict mode</span>
        </label>

        <label class="field">
          <span>JSON schema</span>
          <textarea
            :value="form.structuredOutput.schemaText"
            rows="14"
            spellcheck="false"
            @input="
              updateStructuredOutput('schemaText', ($event.target as HTMLTextAreaElement).value)
            "
          />
        </label>

        <p v-if="schemaError" class="error">{{ schemaError }}</p>
      </template>
    </section>

    <div class="actions">
      <button type="submit">Save template</button>
    </div>
  </form>
</template>

<style scoped>
.prompt-form {
  display: grid;
  gap: 1rem;
}
.panel {
  border: 1px solid #dcdcdc;
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 1rem;
}
.panel-header,
.message-toolbar,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.field {
  display: grid;
  gap: 0.375rem;
}
.field.compact {
  min-width: 180px;
}
.field input,
.field textarea,
.field select {
  width: 100%;
}
.message-card {
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  padding: 0.875rem;
  display: grid;
  gap: 0.75rem;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.error {
  color: #b42318;
}
</style>
