// adapters/openai.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import type { ModelSpec, PromptAdapter, TemplateVariables } from './types'
import { interpolate } from './interpolate'
import { resolveModel } from './models'

const openaiModels: ModelSpec[] = [
  { id: 'gpt-4.1', label: 'GPT-4.1', supportsTemperature: true, supportsStructuredOutput: true, maxOutputTokens: 32768 },
  { id: 'gpt-4o', label: 'GPT-4o', supportsTemperature: true, supportsStructuredOutput: true, maxOutputTokens: 16384 },
]

// Targets the OpenAI Responses API (client.responses.create).
export function toOpenAIResponsesPayload(
  template: CanonicalPromptTemplate,
  vars: TemplateVariables = {},
): Record<string, unknown> {
  const model = resolveModel(openaiModels, template.model)

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

  if (model.supportsTemperature && typeof template.temperature === 'number') {
    payload.temperature = template.temperature
  }

  if (typeof template.maxOutputTokens === 'number') {
    payload.max_output_tokens = template.maxOutputTokens
  }

  if (model.supportsStructuredOutput && template.structuredOutput) {
    // Responses API expects structured output under text.format.
    payload.text = {
      format: {
        type: 'json_schema',
        name: template.structuredOutput.name,
        strict: template.structuredOutput.strict,
        schema: template.structuredOutput.schema,
      },
    }
  }

  return payload
}

export const openaiAdapter: PromptAdapter = {
  id: 'openai',
  label: 'OpenAI',
  supportedRoles: ['developer', 'user', 'assistant'],
  models: openaiModels,
  defaultModel: 'gpt-4.1',
  toPayload: toOpenAIResponsesPayload,
}
