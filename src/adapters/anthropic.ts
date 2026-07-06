// adapters/anthropic.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import type { ModelSpec, PromptAdapter, TemplateVariables } from './types'
import { interpolate } from './interpolate'
import { resolveModel } from './models'

// The current Claude tier (Opus 4.8 / Sonnet 5 / Fable 5) rejects `temperature`;
// Haiku 4.5 still accepts it — capabilities are per-model, not per-provider.
const anthropicModels: ModelSpec[] = [
  { id: 'claude-opus-4-8', label: 'Opus 4.8', supportsTemperature: false, supportsStructuredOutput: true, maxOutputTokens: 128000 },
  { id: 'claude-sonnet-5', label: 'Sonnet 5', supportsTemperature: false, supportsStructuredOutput: true, maxOutputTokens: 128000 },
  { id: 'claude-fable-5', label: 'Fable 5', supportsTemperature: false, supportsStructuredOutput: true, maxOutputTokens: 128000 },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5', supportsTemperature: true, supportsStructuredOutput: true, maxOutputTokens: 64000 },
]

// Targets the Anthropic Messages API (client.messages.create).
export function toAnthropicMessagesPayload(
  template: CanonicalPromptTemplate,
  vars: TemplateVariables = {},
): Record<string, unknown> {
  const model = resolveModel(anthropicModels, template.model)

  // Anthropic has no `developer` role and takes the system prompt as a top-level
  // field, so instructions and any developer messages fold into `system`.
  const systemParts: string[] = []
  if (template.instructions) {
    systemParts.push(interpolate(template.instructions, vars))
  }

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const message of template.messages) {
    const content = interpolate(message.content, vars)
    if (message.role === 'developer') {
      systemParts.push(content)
    } else {
      messages.push({ role: message.role, content })
    }
  }

  const payload: Record<string, unknown> = {
    model: template.model,
    // max_tokens is required by the Messages API.
    max_tokens: template.maxOutputTokens ?? 1024,
    messages,
  }

  const system = systemParts.filter((part) => part.trim()).join('\n\n')
  if (system) {
    payload.system = system
  }

  if (model.supportsTemperature && typeof template.temperature === 'number') {
    payload.temperature = template.temperature
  }

  if (model.supportsStructuredOutput && template.structuredOutput) {
    // Anthropic constrains the response format via output_config.format.
    payload.output_config = {
      format: {
        type: 'json_schema',
        schema: template.structuredOutput.schema,
      },
    }
  }

  return payload
}

export const anthropicAdapter: PromptAdapter = {
  id: 'anthropic',
  label: 'Anthropic',
  // No `developer` role — developer messages fold into the top-level system.
  supportedRoles: ['user', 'assistant'],
  models: anthropicModels,
  defaultModel: 'claude-opus-4-8',
  toPayload: toAnthropicMessagesPayload,
}
