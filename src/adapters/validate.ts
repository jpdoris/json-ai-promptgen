// adapters/validate.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import type { PromptAdapter } from './types'

// Non-blocking checks that a template's message sequence satisfies the selected
// provider's shape rules. Returns human-readable warnings (empty when valid).
export function validateTemplate(
  adapter: PromptAdapter,
  template: CanonicalPromptTemplate,
): string[] {
  const constraints = adapter.messageConstraints
  if (!constraints) return []

  const issues: string[] = []
  // developer messages fold into the system prompt, so they aren't turns.
  const turns = template.messages.filter((message) => message.role !== 'developer')
  const first = turns[0]

  if (constraints.requireNonEmpty && turns.length === 0) {
    issues.push(`${adapter.label} needs at least one user or assistant message.`)
  }
  if (constraints.requireLeadingUser && first && first.role !== 'user') {
    issues.push(`${adapter.label} requires the conversation to start with a user message.`)
  }

  return issues
}
