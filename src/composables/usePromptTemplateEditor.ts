// src/composables/usePromptTemplateEditor.ts
import { computed, ref, toRaw, watch } from 'vue'
import { defaultAdapterId, getAdapter, resolveModel, validateTemplate } from '@/adapters'
import type { CanonicalPromptTemplate, PromptRole } from '@/types/prompt-schema'

// Editor-local message carries an `id` for stable list rendering; it is stripped
// when converting to the canonical (provider-neutral) template.
export type EditorMessage = {
  id: string
  role: PromptRole
  content: string
}

export type StructuredOutputConfig = {
  enabled: boolean
  name: string
  strict: boolean
  schemaText: string
}

export type PromptTemplateForm = {
  name: string
  provider: string
  model: string
  instructions: string
  temperature: number
  maxOutputTokens: number
  messages: EditorMessage[]
  structuredOutput: StructuredOutputConfig
}

export type ProviderPayload = Record<string, unknown>

const createMessage = (role: PromptRole = 'user', content = ''): EditorMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
})

// Coerce any message on a role the provider can't express down to `user`.
function coerceRoles(messages: EditorMessage[], provider: string): EditorMessage[] {
  const allowed = new Set(getAdapter(provider).supportedRoles)
  return messages.map((message) =>
    allowed.has(message.role) ? message : { ...message, role: 'user' as PromptRole },
  )
}

function createDefaultForm(initial?: Partial<PromptTemplateForm>): PromptTemplateForm {
  const provider = initial?.provider ?? defaultAdapterId
  return {
    name: initial?.name ?? 'New Prompt Template',
    provider,
    model: initial?.model ?? getAdapter(provider).defaultModel,
    instructions: initial?.instructions ?? '',
    temperature: initial?.temperature ?? 0.2,
    maxOutputTokens: initial?.maxOutputTokens ?? 800,
    messages: initial?.messages?.length
      ? initial.messages.map((message) => ({ ...message }))
      : [createMessage('user', '')],
    structuredOutput: {
      enabled: initial?.structuredOutput?.enabled ?? false,
      name: initial?.structuredOutput?.name ?? 'generated_output',
      strict: initial?.structuredOutput?.strict ?? true,
      schemaText:
        initial?.structuredOutput?.schemaText ??
        JSON.stringify(
          {
            type: 'object',
            properties: {
              result: { type: 'string' },
            },
            required: ['result'],
            additionalProperties: false,
          },
          null,
          2,
        ),
    },
  }
}

export function usePromptTemplateEditor(initial?: Partial<PromptTemplateForm>) {
  const form = ref<PromptTemplateForm>(createDefaultForm(initial))

  // Switching providers swaps in that provider's default model, and coerces any
  // messages using a role the new provider can't express.
  watch(
    () => form.value.provider,
    (provider) => {
      form.value.model = getAdapter(provider).defaultModel
      form.value.messages = coerceRoles(form.value.messages, provider)
    },
  )

  const modelSpec = computed(() =>
    resolveModel(getAdapter(form.value.provider).models, form.value.model),
  )

  const parsedSchema = computed<Record<string, unknown> | null>(() => {
    const current = form.value.structuredOutput

    if (!current.enabled || !current.schemaText.trim()) {
      return null
    }

    try {
      return JSON.parse(current.schemaText) as Record<string, unknown>
    } catch {
      return null
    }
  })

  const schemaError = computed(() => {
    const current = form.value.structuredOutput
    if (!current.enabled || !modelSpec.value.supportsStructuredOutput) return ''
    if (!current.schemaText.trim()) return 'Schema is required.'
    return parsedSchema.value ? '' : 'Schema must be valid JSON.'
  })

  const isValid = computed(() => {
    const current = form.value
    const hasMessage = current.messages.some((message) => message.content.trim().length > 0)
    return Boolean(current.model.trim()) && hasMessage && !schemaError.value
  })

  // Provider-neutral template derived from the form; adapters translate this.
  const canonicalTemplate = computed<CanonicalPromptTemplate>(() => {
    const current = form.value

    const template: CanonicalPromptTemplate = {
      model: current.model,
      messages: current.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: current.temperature,
      maxOutputTokens: current.maxOutputTokens,
    }

    if (current.instructions.trim()) {
      template.instructions = current.instructions
    }

    if (current.structuredOutput.enabled && parsedSchema.value) {
      template.structuredOutput = {
        name: current.structuredOutput.name,
        strict: current.structuredOutput.strict,
        schema: parsedSchema.value,
      }
    }

    return template
  })

  const payloadPreview = computed<ProviderPayload>(() =>
    getAdapter(form.value.provider).toPayload(canonicalTemplate.value),
  )

  const validationIssues = computed(() =>
    validateTemplate(getAdapter(form.value.provider), canonicalTemplate.value),
  )

  function addMessage(role: PromptRole = 'user') {
    form.value.messages.push(createMessage(role))
  }

  function removeMessage(id: string) {
    if (form.value.messages.length === 1) return
    form.value.messages = form.value.messages.filter((message) => message.id !== id)
  }

  // Move the message with `fromId` into the slot currently held by `toId`.
  function reorderMessages(fromId: string, toId: string) {
    if (fromId === toId) return

    const messages = [...form.value.messages]
    const fromIndex = messages.findIndex((message) => message.id === fromId)
    const toIndex = messages.findIndex((message) => message.id === toId)
    if (fromIndex === -1 || toIndex === -1) return

    const [moved] = messages.splice(fromIndex, 1)
    if (!moved) return
    messages.splice(toIndex, 0, moved)
    form.value.messages = messages
  }

  // Inverse of `canonicalTemplate`: expand a provider-neutral template back into
  // editable form state. Keeps the currently selected provider.
  function loadTemplate(template: CanonicalPromptTemplate, name?: string) {
    const provider = form.value.provider
    form.value = createDefaultForm({
      // Examples are provider-neutral, so keep the current provider and let its
      // default model apply rather than the template's baked-in model id.
      name,
      provider,
      instructions: template.instructions,
      temperature: template.temperature,
      maxOutputTokens: template.maxOutputTokens,
      messages: coerceRoles(
        template.messages.map((message) => createMessage(message.role, message.content)),
        provider,
      ),
      structuredOutput: template.structuredOutput
        ? {
            enabled: true,
            name: template.structuredOutput.name,
            strict: template.structuredOutput.strict,
            schemaText: JSON.stringify(template.structuredOutput.schema, null, 2),
          }
        : undefined,
    })
  }

  function reset() {
    form.value = createDefaultForm({ provider: form.value.provider })
  }

  function exportTemplate() {
    return structuredClone(toRaw(form.value))
  }

  return {
    form,
    parsedSchema,
    schemaError,
    isValid,
    canonicalTemplate,
    payloadPreview,
    validationIssues,
    addMessage,
    removeMessage,
    reorderMessages,
    loadTemplate,
    reset,
    exportTemplate,
  }
}
