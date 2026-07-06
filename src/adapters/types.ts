// adapters/types.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'

export type TemplateVariables = Record<string, string | number | boolean | null | undefined>

// A PromptAdapter converts a provider-neutral CanonicalPromptTemplate into the
// request body for one provider's API. Add a new provider by implementing this
// interface and registering it in adapters/index.ts.
export interface PromptAdapter {
  /** Stable id used as the registry key and in editor state. */
  id: string
  /** Human-readable name shown in the provider selector. */
  label: string
  /** Build the provider-specific request payload from a canonical template. */
  toPayload(template: CanonicalPromptTemplate, vars?: TemplateVariables): Record<string, unknown>
}
