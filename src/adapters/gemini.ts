// adapters/gemini.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import type { ModelSpec, PromptAdapter, TemplateVariables } from './types'
import { interpolate } from './interpolate'
import { resolveModel } from './models'

const geminiModels: ModelSpec[] = [
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', supportsTemperature: true, supportsStructuredOutput: true, maxOutputTokens: 65536 },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', supportsTemperature: true, supportsStructuredOutput: true, maxOutputTokens: 65536 },
]

// Targets the Gemini API (generateContent). Note Gemini names the assistant turn
// `model`, takes the system prompt as top-level `systemInstruction`, and has no
// `developer` role — so canonical roles are translated here.
export function toGeminiGenerateContentPayload(
  template: CanonicalPromptTemplate,
  vars: TemplateVariables = {},
): Record<string, unknown> {
  const model = resolveModel(geminiModels, template.model)

  const systemParts: string[] = []
  if (template.instructions) {
    systemParts.push(interpolate(template.instructions, vars))
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
  for (const message of template.messages) {
    const content = interpolate(message.content, vars)
    if (message.role === 'developer') {
      systemParts.push(content)
    } else {
      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: content }],
      })
    }
  }

  // The model is part of the request URL, not the body — included here so the
  // preview shows which model the payload targets.
  const payload: Record<string, unknown> = {
    model: template.model,
    contents,
  }

  const system = systemParts.filter((part) => part.trim()).join('\n\n')
  if (system) {
    payload.systemInstruction = { parts: [{ text: system }] }
  }

  const generationConfig: Record<string, unknown> = {}
  if (model.supportsTemperature && typeof template.temperature === 'number') {
    generationConfig.temperature = template.temperature
  }
  if (typeof template.maxOutputTokens === 'number') {
    generationConfig.maxOutputTokens = template.maxOutputTokens
  }
  if (model.supportsStructuredOutput && template.structuredOutput) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseSchema = template.structuredOutput.schema
  }
  if (Object.keys(generationConfig).length > 0) {
    payload.generationConfig = generationConfig
  }

  return payload
}

export const geminiAdapter: PromptAdapter = {
  id: 'gemini',
  label: 'Gemini',
  // No `developer` role — developer messages fold into systemInstruction.
  supportedRoles: ['user', 'assistant'],
  models: geminiModels,
  defaultModel: 'gemini-2.5-pro',
  messageConstraints: { requireNonEmpty: true, requireLeadingUser: true },
  toPayload: toGeminiGenerateContentPayload,
}
