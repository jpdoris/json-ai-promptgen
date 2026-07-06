<!-- src/components/PromptTemplateForm.vue -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { adapterList, getAdapter, resolveModel } from '@/adapters'
import CollapsiblePanel from '@/components/CollapsiblePanel.vue'
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

const CUSTOM_MODEL = '__custom__'

const currentAdapter = computed(() => getAdapter(props.modelValue.provider))
const currentModels = computed(() => currentAdapter.value.models)
const modelSpec = computed(() => resolveModel(currentModels.value, props.modelValue.model))
const isCustomModel = computed(
  () => !currentModels.value.some((model) => model.id === props.modelValue.model),
)

function onModelSelect(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  // Choosing "Custom…" clears the field so the free-text input takes over.
  updateField('model', value === CUSTOM_MODEL ? '' : value)
}

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
    <CollapsiblePanel title="Template">
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
          <FieldHint
            text="Which model to target. Pick from the provider's list, or choose Custom to enter any model id."
          />
        </span>
        <select :value="isCustomModel ? CUSTOM_MODEL : form.model" @change="onModelSelect">
          <option v-for="model in currentModels" :key="model.id" :value="model.id">
            {{ model.label }}
          </option>
          <option :value="CUSTOM_MODEL">Custom…</option>
        </select>
      </label>

      <label v-if="isCustomModel" class="field">
        <span class="field-label">
          Custom model id
          <FieldHint
            text="Any model id the provider accepts — e.g. a pinned dated snapshot not in the list."
          />
        </span>
        <input
          :value="form.model"
          type="text"
          placeholder="e.g. claude-haiku-4-5-20251001"
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
    </CollapsiblePanel>

    <CollapsiblePanel title="Generation">
      <label v-if="modelSpec.supportsTemperature" class="field">
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
          :max="modelSpec.maxOutputTokens || undefined"
          step="1"
          @input="updateField('maxOutputTokens', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
    </CollapsiblePanel>

    <CollapsiblePanel title="Messages">
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
            <option v-for="role in currentAdapter.supportedRoles" :key="role" :value="role">
              {{ role }}
            </option>
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

      <button type="button" class="add-message-btn" @click="$emit('add-message', 'user')">
        + Add message
      </button>
    </CollapsiblePanel>

    <CollapsiblePanel v-if="modelSpec.supportsStructuredOutput" title="Structured output">
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
    </CollapsiblePanel>

    <div class="actions">
      <button type="submit">Export template</button>
    </div>
  </form>
</template>

<style scoped>
.prompt-form {
  display: grid;
  gap: 1rem;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.add-message-btn {
  justify-self: start;
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
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.875rem;
  display: grid;
  gap: 0.75rem;
  transition:
    border-color 0.12s ease,
    box-shadow 0.12s ease,
    opacity 0.12s ease;
}
.message-card.dragging {
  opacity: 0.5;
}
.message-card.drag-over {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
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
  padding: 0.3rem 0.55rem;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}
.drag-handle:hover {
  background: var(--accent-tint);
  color: var(--ink);
}
.drag-handle:active {
  cursor: grabbing;
}
.drag-handle:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 1px;
  color: var(--ink);
}
.drag-grip {
  font-size: 1.05rem;
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem;
  color: var(--danger);
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}
.icon-button:hover {
  background: var(--danger-soft);
  border-color: var(--danger-border);
}
.icon-button:focus-visible {
  outline: 2px solid var(--danger);
  outline-offset: 1px;
}
.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.error {
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
