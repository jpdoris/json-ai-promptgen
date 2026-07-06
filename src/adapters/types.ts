// adapters/types.ts
import type { CanonicalPromptTemplate, PromptRole } from '@/types/prompt-schema'

export type TemplateVariables = Record<string, string | number | boolean | null | undefined>

// A specific model offered by a provider. Capabilities are model-level, not
// provider-level (e.g. newer Claude models reject `temperature` while Haiku
// accepts it), so the editor and payload gate on the resolved model, not the
// adapter. This catalog is hand-maintained — add a row when a model ships.
export type ModelSpec = {
  id: string
  label: string
  supportsTemperature: boolean
  supportsStructuredOutput: boolean
  /** Output-token ceiling, or 0 when unknown (e.g. a custom model id). */
  maxOutputTokens: number
}

// A PromptAdapter converts a provider-neutral CanonicalPromptTemplate into the
// request body for one provider's API. Add a new provider by implementing this
// interface and registering it in adapters/index.ts.
export interface PromptAdapter {
  /** Stable id used as the registry key and in editor state. */
  id: string
  /** Human-readable name shown in the provider selector. */
  label: string
  /**
   * Canonical roles this provider can express, in the order shown in the editor.
   * These are the neutral vocabulary — the adapter maps them to the provider's
   * wire roles (e.g. Anthropic folds `developer` into the top-level system).
   */
  supportedRoles: PromptRole[]
  /** Models this provider offers, for the model selector. */
  models: ModelSpec[]
  /** Default model id (must be one of `models`) used when the provider is selected. */
  defaultModel: string
  /** Build the provider-specific request payload from a canonical template. */
  toPayload(template: CanonicalPromptTemplate, vars?: TemplateVariables): Record<string, unknown>
}
