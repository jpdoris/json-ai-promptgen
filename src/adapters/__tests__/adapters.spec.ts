import { describe, it, expect } from 'vitest'
import type { CanonicalPromptTemplate } from '@/types/prompt-schema'
import { interpolate } from '@/adapters/interpolate'
import { resolveModel, validateTemplate } from '@/adapters'
import { openaiAdapter, toOpenAIResponsesPayload } from '@/adapters/openai'
import { anthropicAdapter, toAnthropicMessagesPayload } from '@/adapters/anthropic'
import { geminiAdapter, toGeminiGenerateContentPayload } from '@/adapters/gemini'

function makeTemplate(overrides: Partial<CanonicalPromptTemplate> = {}): CanonicalPromptTemplate {
  return {
    model: 'gpt-4.1',
    instructions: 'Be helpful.',
    messages: [{ role: 'user', content: 'Hi' }],
    temperature: 0.4,
    maxOutputTokens: 500,
    ...overrides,
  }
}

const schema = { type: 'object', properties: { result: { type: 'string' } } }

describe('interpolate', () => {
  it('replaces and trims placeholders', () => {
    expect(interpolate('Hi {{name}}', { name: 'Ada' })).toBe('Hi Ada')
    expect(interpolate('Hi {{ name }}', { name: 'Ada' })).toBe('Hi Ada')
  })

  it('renders missing variables as empty and coerces non-strings', () => {
    expect(interpolate('Yo {{x}}', {})).toBe('Yo ')
    expect(interpolate('n={{count}}', { count: 3 })).toBe('n=3')
  })
})

describe('resolveModel', () => {
  it('returns the catalog spec for a known id', () => {
    expect(resolveModel(openaiAdapter.models, 'gpt-4.1').label).toBe('GPT-4.1')
  })

  it('falls back to a permissive profile for unknown ids', () => {
    expect(resolveModel(openaiAdapter.models, 'mystery-9000')).toEqual({
      id: 'mystery-9000',
      label: 'mystery-9000',
      supportsTemperature: true,
      supportsStructuredOutput: true,
      maxOutputTokens: 0,
    })
  })
})

describe('openai adapter', () => {
  it('builds a Responses payload with interpolation', () => {
    const payload = toOpenAIResponsesPayload(
      makeTemplate({ instructions: 'Hi {{who}}', messages: [{ role: 'user', content: 'Yo {{who}}' }] }),
      { who: 'Ada' },
    )
    expect(payload).toMatchObject({
      model: 'gpt-4.1',
      input: [{ role: 'user', content: 'Yo Ada' }],
      instructions: 'Hi Ada',
      temperature: 0.4,
      max_output_tokens: 500,
    })
    expect(payload.text).toBeUndefined()
  })

  it('embeds structured output under text.format', () => {
    const payload = toOpenAIResponsesPayload(
      makeTemplate({ structuredOutput: { name: 'out', strict: true, schema } }),
    )
    expect(payload.text).toEqual({
      format: { type: 'json_schema', name: 'out', strict: true, schema },
    })
  })
})

describe('anthropic adapter', () => {
  it('extracts system, requires max_tokens, and omits temperature for models that reject it', () => {
    const payload = toAnthropicMessagesPayload(makeTemplate({ model: 'claude-opus-4-8' }))
    expect(payload).toMatchObject({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      messages: [{ role: 'user', content: 'Hi' }],
      system: 'Be helpful.',
    })
    expect(payload.temperature).toBeUndefined()
  })

  it('keeps temperature for a model that accepts it (Haiku)', () => {
    const payload = toAnthropicMessagesPayload(makeTemplate({ model: 'claude-haiku-4-5' }))
    expect(payload.temperature).toBe(0.4)
  })

  it('folds developer messages into the system prompt', () => {
    const payload = toAnthropicMessagesPayload(
      makeTemplate({
        model: 'claude-opus-4-8',
        instructions: 'Sys.',
        messages: [
          { role: 'developer', content: 'Dev note' },
          { role: 'user', content: 'Hi' },
        ],
      }),
    )
    expect(payload.system).toBe('Sys.\n\nDev note')
    expect(payload.messages).toEqual([{ role: 'user', content: 'Hi' }])
  })

  it('defaults max_tokens when unset and maps structured output to output_config.format', () => {
    const payload = toAnthropicMessagesPayload(
      makeTemplate({
        model: 'claude-opus-4-8',
        maxOutputTokens: undefined,
        structuredOutput: { name: 'out', strict: true, schema },
      }),
    )
    expect(payload.max_tokens).toBe(1024)
    expect(payload.output_config).toEqual({ format: { type: 'json_schema', schema } })
  })
})

describe('gemini adapter', () => {
  it('maps roles to user/model and pulls system into systemInstruction', () => {
    const payload = toGeminiGenerateContentPayload(
      makeTemplate({
        model: 'gemini-2.5-pro',
        instructions: 'Sys.',
        messages: [
          { role: 'developer', content: 'Dev note' },
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Yo' },
        ],
      }),
    )
    expect(payload.contents).toEqual([
      { role: 'user', parts: [{ text: 'Hi' }] },
      { role: 'model', parts: [{ text: 'Yo' }] },
    ])
    expect(payload.systemInstruction).toEqual({ parts: [{ text: 'Sys.\n\nDev note' }] })
  })

  it('puts generation params and structured output under generationConfig', () => {
    const payload = toGeminiGenerateContentPayload(
      makeTemplate({ model: 'gemini-2.5-pro', structuredOutput: { name: 'out', strict: true, schema } }),
    )
    expect(payload.generationConfig).toEqual({
      temperature: 0.4,
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
      responseSchema: schema,
    })
  })
})

describe('validateTemplate', () => {
  it('reports no issues for a provider without message constraints (OpenAI)', () => {
    expect(validateTemplate(openaiAdapter, makeTemplate())).toEqual([])
  })

  it('flags a conversation that does not start with a user turn', () => {
    const issues = validateTemplate(
      anthropicAdapter,
      makeTemplate({
        messages: [
          { role: 'assistant', content: 'x' },
          { role: 'user', content: 'y' },
        ],
      }),
    )
    expect(issues.some((i) => /start with a user/i.test(i))).toBe(true)
  })

  it('flags an empty conversation (only developer messages)', () => {
    const issues = validateTemplate(
      geminiAdapter,
      makeTemplate({ messages: [{ role: 'developer', content: 'x' }] }),
    )
    expect(issues.some((i) => /at least one user or assistant/i.test(i))).toBe(true)
  })

  it('passes a valid user-led conversation', () => {
    expect(
      validateTemplate(anthropicAdapter, makeTemplate({ messages: [{ role: 'user', content: 'x' }] })),
    ).toEqual([])
  })
})
