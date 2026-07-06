// schemas/openai/example-customer-support.ts
// Reference example of a CanonicalPromptTemplate.
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'

export const customerSupportPrompt: CanonicalPromptTemplate = {
  model: 'gpt-4.1',
  instructions:
    'You are a support assistant. Answer clearly, briefly, and return structured JSON when a schema is provided.',
  messages: [
    {
      role: 'user',
      content:
        'Summarize this support request and identify priority, product area, and next action: "{{ticketText}}"',
    },
  ],
  temperature: 0.2,
  maxOutputTokens: 600,
  structuredOutput: {
    name: 'support_ticket_summary',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        productArea: { type: 'string' },
        nextAction: { type: 'string' },
      },
      required: ['summary', 'priority', 'productArea', 'nextAction'],
      additionalProperties: false,
    },
  },
}
