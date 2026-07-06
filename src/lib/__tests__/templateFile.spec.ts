import { describe, it, expect } from 'vitest'
import type { PromptTemplateForm } from '@/composables/usePromptTemplateEditor'
import { parseTemplateFile, toTemplateFile } from '@/lib/templateFile'

const template = {
  name: 'T',
  provider: 'openai',
  model: 'gpt-4.1',
  instructions: '',
  temperature: 0.2,
  maxOutputTokens: 800,
  messages: [{ id: '1', role: 'user', content: 'hi' }],
  structuredOutput: { enabled: false, name: 'out', strict: true, schemaText: '{}' },
} as PromptTemplateForm

describe('templateFile', () => {
  it('wraps a template in a versioned envelope', () => {
    expect(toTemplateFile(template)).toEqual({ app: 'json-promptgen', version: 1, template })
  })

  it('round-trips through serialize + parse', () => {
    const text = JSON.stringify(toTemplateFile(template))
    expect(parseTemplateFile(text)).toEqual(template)
  })

  it('rejects invalid JSON', () => {
    expect(() => parseTemplateFile('{ not json')).toThrow(/valid JSON/i)
  })

  it('rejects a file that is not a json-promptgen template', () => {
    expect(() => parseTemplateFile(JSON.stringify({ hello: 'world' }))).toThrow(/not a json-promptgen/i)
    expect(() => parseTemplateFile(JSON.stringify({ app: 'json-promptgen' }))).toThrow(
      /not a json-promptgen/i,
    )
  })
})
