// adapters/anthropic.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import type { PromptAdapter, TemplateVariables } from './types'
import { interpolate } from './interpolate'

// Targets the Anthropic Messages API (client.messages.create).
export function toAnthropicMessagesPayload(
  template: CanonicalPromptTemplate,
  vars: TemplateVariables = {},
): Record<string, unknown> {
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

  // temperature is intentionally omitted — the current Claude models reject it.

  if (template.structuredOutput) {
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
  defaultModel: 'claude-opus-4-8',
  supportsTemperature: false,
  toPayload: toAnthropicMessagesPayload,
}
