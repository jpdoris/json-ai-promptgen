// examples/index.ts
// Registry of ready-made prompt templates the editor can load. Add an entry here
// to surface a new example in the "Load example" picker.
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import { customerSupportPrompt } from '@/schemas/openai/example-customer-support'
import { meetingActionItemsPrompt } from './meeting-action-items'
import { supportReplyDraftPrompt } from './support-reply-draft'

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
  {
    id: 'action-items',
    label: 'Meeting notes → action items',
    template: meetingActionItemsPrompt,
  },
  {
    id: 'support-reply',
    label: 'Support reply drafter',
    template: supportReplyDraftPrompt,
  },
]

export function getExample(id: string): PromptExample | undefined {
  return examples.find((example) => example.id === id)
}
