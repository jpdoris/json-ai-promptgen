// server/openai-runner.ts
import OpenAI from 'openai'
import { customerSupportPrompt } from '@/schemas/openai/example-customer-support'
import { toOpenAIResponsesPayload } from '@/adapters/openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function runCustomerSupportPrompt(ticketText: string) {
  const payload = toOpenAIResponsesPayload(customerSupportPrompt, {
    ticketText,
  })

  const response = await client.responses.create(payload)

  return response
}
