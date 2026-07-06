// examples/index.ts
// Registry of ready-made prompt templates the editor can load. Add an entry here
// to surface a new example in the "Load example" picker.
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import { customerSupportPrompt } from '@/schemas/openai/example-customer-support'

export type PromptExample = {
  id: string
  label: string
  template: CanonicalPromptTemplate
}

export const examples: PromptExample[] = [
  {
    id: 'customer-support',
    label: 'Customer support ticket summary',
    template: customerSupportPrompt,
  },
]

export function getExample(id: string): PromptExample | undefined {
  return examples.find((example) => example.id === id)
}
