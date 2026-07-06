// types/prompt-schema.ts
// Provider-neutral representation of a prompt template. Adapters translate this
// canonical shape into a specific provider's request body (see src/adapters).
export type PromptRole = 'developer' | 'user' | 'assistant'

export type PromptMessage = {
  role: PromptRole
  content: string
}

export type StructuredOutput = {
  name: string
  strict: boolean
  schema: Record<string, unknown>
}

export type CanonicalPromptTemplate = {
  model: string
  instructions?: string
  messages: PromptMessage[]
  temperature?: number
  maxOutputTokens?: number
  structuredOutput?: StructuredOutput
}
