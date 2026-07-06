<!-- src/components/PromptTemplateForm.vue -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { adapterList } from '@/adapters'
import FieldHint from '@/components/FieldHint.vue'
import type { PromptTemplateForm } from '@/composables/usePromptTemplateEditor'
import type { PromptRole } from '@/types/prompt-schema'

const props = defineProps<{
  modelValue: PromptTemplateForm
  schemaError?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: PromptTemplateForm): void
  (e: 'submit'): void
  (e: 'add-message', role?: PromptRole): void
  (e: 'remove-message', id: string): void
  (e: 'reorder-message', payload: { fromId: string; toId: string }): void
}>()

const providers = adapterList

const draggingId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

function onDragStart(id: string, event: DragEvent) {
  draggingId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    // Use the whole message card as the drag image so it lifts and follows the
    // cursor, rather than dragging just the small handle button.
    const card = (event.currentTarget as HTMLElement).closest('.message-card')
    if (card) {
      const rect = card.getBoundingClientRect()
      event.dataTransfer.setDragImage(card, event.clientX - rect.left, event.clientY - rect.top)
    }
  }
}

function onDragOver(id: string) {
  if (draggingId.value && draggingId.value !== id) {
    dragOverId.value = id
  }
}

function onDragLeave(id: string) {
  if (dragOverId.value === id) dragOverId.value = null
}

function onDrop(targetId: string) {
  const fromId = draggingId.value
  draggingId.value = null
  dragOverId.value = null
  if (!fromId || fromId === targetId) return
  emit('reorder-message', { fromId, toId: targetId })
}

function onDragEnd() {
  draggingId.value = null
  dragOverId.value = null
}

// Keyboard reordering: keep a handle to each drag button so focus can follow the
// message after it moves, letting the user reorder repeatedly with arrow keys.
const handleRefs = new Map<string, HTMLElement>()

function setHandleRef(id: string, el: Element | null) {
  if (el) handleRefs.set(id, el as HTMLElement)
  else handleRefs.delete(id)
}

async function moveByKeyboard(id: string, direction: 'up' | 'down') {
  const messages = props.modelValue.messages
  const index = messages.findIndex((message) => message.id === id)
  if (index === -1) return

  const target = messages[direction === 'up' ? index - 1 : index + 1]
  if (!target) return

  emit('reorder-message', { fromId: id, toId: target.id })
  await nextTick()
  handleRefs.get(id)?.focus()
}

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
        <span class="field-label">
          Name
          <FieldHint text="A label for this template so you can identify it. Not sent to the model." />
        </span>
        <input
          :value="form.name"
          type="text"
          @input="updateField('name', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="field">
        <span class="field-label">
          Provider
          <FieldHint
            text="Which provider's API format to generate. Determines the shape of the output payload."
          />
        </span>
        <select
          :value="form.provider"
          @change="updateField('provider', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">
            {{ provider.label }}
          </option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">
          Model
          <FieldHint text="The specific model id to call, e.g. gpt-4.1. Sent as the request's model field." />
        </span>
        <input
          :value="form.model"
          type="text"
          @input="updateField('model', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label class="field">
        <span class="field-label">
          Instructions
          <FieldHint
            text="System-level guidance that steers the model's behavior for the whole conversation."
          />
        </span>
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
        <span class="field-label">
          Temperature
          <FieldHint
            text="Randomness of the output. Lower (near 0) is focused and repeatable; higher (up to 2) is more varied."
          />
        </span>
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
        <span class="field-label">
          Max output tokens
          <FieldHint text="Upper limit on how many tokens the model may generate in its reply." />
        </span>
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

      <div
        v-for="(message, index) in form.messages"
        :key="message.id"
        class="message-card"
        :class="{
          dragging: draggingId === message.id,
          'drag-over': dragOverId === message.id,
        }"
        @dragover.prevent="onDragOver(message.id)"
        @dragleave="onDragLeave(message.id)"
        @drop.prevent="onDrop(message.id)"
      >
        <div v-if="form.messages.length > 1" class="message-dragbar">
          <button
            :ref="(el) => setHandleRef(message.id, el as Element | null)"
            type="button"
            class="drag-handle"
            draggable="true"
            title="Drag, or use arrow keys, to reorder"
            aria-label="Reorder message. Drag, or press arrow up and arrow down."
            @dragstart="onDragStart(message.id, $event)"
            @dragend="onDragEnd"
            @keydown.up.prevent="moveByKeyboard(message.id, 'up')"
            @keydown.down.prevent="moveByKeyboard(message.id, 'down')"
          >
            <span aria-hidden="true" class="drag-grip">⠿</span>
            <span class="drag-label">Drag to reorder</span>
          </button>
          <button
            type="button"
            class="icon-button"
            title="Remove message"
            aria-label="Remove message"
            @click="$emit('remove-message', message.id)"
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
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>

        <label class="field compact">
          <span class="field-label">
            Role
            <FieldHint
              text="Who the message is from: developer (guidance), user (input), or assistant (a prior model reply)."
            />
          </span>
          <select
            :value="message.role"
            @change="
              updateMessage(message.id, {
                role: ($event.target as HTMLSelectElement).value as PromptRole,
              })
            "
          >
            <option value="developer">developer</option>
            <option value="user">user</option>
            <option value="assistant">assistant</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">
            Content
            <FieldHint
              text="The text of this message. Use {{ variableName }} placeholders to fill in values later."
            />
          </span>
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
        <span class="field-label">
          Enable structured output
          <FieldHint
            text="Force the model to return JSON matching a schema instead of free-form text."
          />
        </span>
      </label>

      <template v-if="form.structuredOutput.enabled">
        <label class="field">
          <span class="field-label">
            Schema name
            <FieldHint text="A name for the output schema. Required by the API when structured output is on." />
          </span>
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
          <span class="field-label">
            Strict mode
            <FieldHint
              text="Guarantee the output exactly matches the schema. Requires every property to be required and additionalProperties: false."
            />
          </span>
        </label>

        <label class="field">
          <span class="field-label">
            JSON schema
            <FieldHint text="The JSON Schema the model's output must conform to." />
          </span>
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
.field-label {
  display: inline-flex;
  align-items: center;
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
  transition:
    border-color 0.12s ease,
    opacity 0.12s ease;
}
.message-card.dragging {
  opacity: 0.5;
}
.message-card.drag-over {
  border-color: hsla(160, 100%, 37%, 1);
  box-shadow: 0 0 0 1px hsla(160, 100%, 37%, 1);
}
.message-dragbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.drag-handle {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: grab;
  user-select: none;
  padding: 0.25rem 0.5rem;
  color: #999;
  font-size: 0.78rem;
  line-height: 1;
  text-align: left;
  background: #f6f6f6;
  border: 1px solid #ececec;
  border-radius: 6px;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}
.drag-handle:hover {
  background: #efefef;
  color: #666;
}
.drag-handle:active {
  cursor: grabbing;
}
.drag-handle:focus-visible {
  outline: 2px solid hsla(160, 100%, 37%, 1);
  outline-offset: 1px;
  color: #555;
}
.drag-grip {
  font-size: 1.05rem;
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  color: #b42318;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}
.icon-button:hover {
  background: #fdeceb;
  border-color: #f3c9c5;
}
.icon-button:focus-visible {
  outline: 2px solid #b42318;
  outline-offset: 1px;
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
