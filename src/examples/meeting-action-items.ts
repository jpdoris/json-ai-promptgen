// examples/meeting-action-items.ts
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'

export const meetingActionItemsPrompt: CanonicalPromptTemplate = {
  model: 'gpt-4.1',
  instructions:
    'Extract action items from meeting notes. Only include items that have a clear owner and a concrete task.',
  messages: [
    {
      role: 'user',
      content: 'Pull the action items out of these meeting notes:\n\n"{{notes}}"',
    },
  ],
  temperature: 0.2,
  maxOutputTokens: 800,
  structuredOutput: {
    name: 'action_items',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              owner: { type: 'string' },
              task: { type: 'string' },
              dueDate: { type: 'string' },
            },
            required: ['owner', 'task', 'dueDate'],
            additionalProperties: false,
          },
        },
      },
      required: ['actionItems'],
      additionalProperties: false,
    },
  },
}
