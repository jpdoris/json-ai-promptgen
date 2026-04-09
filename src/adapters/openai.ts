// adapters/openai.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'

type TemplateVariables = Record<string, string | number | boolean | null | undefined>

function interpolate(template: string, vars: TemplateVariables): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = String(rawKey).trim()
    const value = vars[key]
    return value == null ? '' : String(value)
  })
}

export function toOpenAIResponsesPayload(
  template: CanonicalPromptTemplate,
  vars: TemplateVariables = {},
) {
  const input = template.messages.map((message) => ({
    role: message.role,
    content: interpolate(message.content, vars),
  }))

  const payload: Record<string, unknown> = {
    model: template.model,
    input,
  }

  if (template.instructions) {
    payload.instructions = interpolate(template.instructions, vars)
  }

  if (typeof template.temperature === 'number') {
    payload.temperature = template.temperature
  }

  if (typeof template.maxOutputTokens === 'number') {
    payload.max_output_tokens = template.maxOutputTokens
  }

  if (template.structuredOutput) {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: template.structuredOutput.name,
        strict: template.structuredOutput.strict,
        schema: template.structuredOutput.schema,
      },
    }
  }

  return payload
}
