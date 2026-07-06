// adapters/index.ts
// Registry of prompt adapters. To support another provider (e.g. Anthropic),
// implement PromptAdapter in a sibling file and add it to `adapters` below.
import type { PromptAdapter } from './types'
import { openaiAdapter } from './openai'

export const adapters: Record<string, PromptAdapter> = {
  [openaiAdapter.id]: openaiAdapter,
}

export const adapterList: PromptAdapter[] = Object.values(adapters)

export const defaultAdapterId = openaiAdapter.id

export function getAdapter(id: string): PromptAdapter {
  return adapters[id] ?? openaiAdapter
}

export type { PromptAdapter, TemplateVariables } from './types'
