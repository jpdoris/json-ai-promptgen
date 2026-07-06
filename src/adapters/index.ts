// adapters/index.ts
// Registry of prompt adapters. To support another provider (e.g. Anthropic),
// implement PromptAdapter in a sibling file and add it to `adapters` below.
import type { PromptAdapter } from './types'
import { openaiAdapter } from './openai'
import { anthropicAdapter } from './anthropic'
import { geminiAdapter } from './gemini'

export const adapters: Record<string, PromptAdapter> = {
  [openaiAdapter.id]: openaiAdapter,
  [anthropicAdapter.id]: anthropicAdapter,
  [geminiAdapter.id]: geminiAdapter,
}

export const adapterList: PromptAdapter[] = Object.values(adapters)

export const defaultAdapterId = openaiAdapter.id

export function getAdapter(id: string): PromptAdapter {
  return adapters[id] ?? openaiAdapter
}

export { resolveModel } from './models'
export { validateTemplate } from './validate'

export type { MessageConstraints, ModelSpec, PromptAdapter, TemplateVariables } from './types'
