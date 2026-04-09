// src/composables/usePromptTemplateEditor.ts
import { computed, ref, toRaw } from 'vue'

export type PromptMessage = {
  id: string
  role: 'developer' | 'user' | 'assistant'
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
  model: string
  instructions: string
  temperature: number
  maxOutputTokens: number
  messages: PromptMessage[]
  structuredOutput: StructuredOutputConfig
}

export type OpenAIResponsePayload = Record<string, unknown>

const createMessage = (role: PromptMessage['role'] = 'user', content = ''): PromptMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
})

function createDefaultForm(initial?: Partial<PromptTemplateForm>): PromptTemplateForm {
  return {
    name: initial?.name ?? 'New Prompt Template',
    model: initial?.model ?? 'gpt-5.4',
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
    if (!current.enabled) return ''
    if (!current.schemaText.trim()) return 'Schema is required.'
    return parsedSchema.value ? '' : 'Schema must be valid JSON.'
  })

  const isValid = computed(() => {
    const current = form.value
    const hasMessage = current.messages.some((message) => message.content.trim().length > 0)
    return Boolean(current.model.trim()) && hasMessage && !schemaError.value
  })

  const payloadPreview = computed<OpenAIResponsePayload>(() => {
    const current = form.value

    const payload: OpenAIResponsePayload = {
      model: current.model,
      input: current.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: current.temperature,
      max_output_tokens: current.maxOutputTokens,
    }

    if (current.instructions.trim()) {
      payload.instructions = current.instructions
    }

    if (current.structuredOutput.enabled && parsedSchema.value) {
      payload.response_format = {
        type: 'json_schema',
        json_schema: {
          name: current.structuredOutput.name,
          strict: current.structuredOutput.strict,
          schema: parsedSchema.value,
        },
      }
    }

    return payload
  })

  function addMessage(role: PromptMessage['role'] = 'user') {
    form.value.messages.push(createMessage(role))
  }

  function removeMessage(id: string) {
    if (form.value.messages.length === 1) return
    form.value.messages = form.value.messages.filter((message) => message.id !== id)
  }

  function moveMessage(id: string, direction: 'up' | 'down') {
    const messages = [...form.value.messages]
    const index = messages.findIndex((message) => message.id === id)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= messages.length) return
    ;[messages[index], messages[targetIndex]] = [messages[targetIndex], messages[index]]
    form.value.messages = messages
  }

  function reset() {
    form.value = createDefaultForm()
  }

  function exportTemplate() {
    return structuredClone(toRaw(form.value))
  }

  return {
    form,
    parsedSchema,
    schemaError,
    isValid,
    payloadPreview,
    addMessage,
    removeMessage,
    moveMessage,
    reset,
    exportTemplate,
  }
}
