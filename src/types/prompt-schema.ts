// types/prompt-schema.ts
export type PromptMessage = {
  role: 'developer' | 'user' | 'assistant'
  content: string
}

export type OpenAIStructuredOutput = {
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
  structuredOutput?: OpenAIStructuredOutput
}
