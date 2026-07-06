// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { usePromptTemplateEditor } from '@/composables/usePromptTemplateEditor'

describe('usePromptTemplateEditor', () => {
  it('defaults to the OpenAI provider and its default model', () => {
    const { form, payloadPreview } = usePromptTemplateEditor()
    expect(form.value.provider).toBe('openai')
    expect(form.value.model).toBe('gpt-4.1')
    expect(payloadPreview.value.model).toBe('gpt-4.1')
    expect(Array.isArray(payloadPreview.value.input)).toBe(true)
  })

  it('adds messages and never removes the last one', () => {
    const { form, addMessage, removeMessage } = usePromptTemplateEditor()
    expect(form.value.messages).toHaveLength(1)
    addMessage('assistant')
    expect(form.value.messages).toHaveLength(2)
    removeMessage(form.value.messages[1]!.id)
    removeMessage(form.value.messages[0]!.id)
    expect(form.value.messages).toHaveLength(1)
  })

  it('reorders messages by moving one into another slot', () => {
    const { form, addMessage, reorderMessages } = usePromptTemplateEditor()
    addMessage('assistant')
    const [first, second] = form.value.messages
    reorderMessages(first!.id, second!.id)
    expect(form.value.messages[0]!.id).toBe(second!.id)
  })

  it('swaps the model and coerces unsupported roles when switching providers', async () => {
    const { form } = usePromptTemplateEditor()
    form.value.messages[0]!.role = 'developer'
    form.value.provider = 'anthropic'
    await nextTick()
    expect(form.value.model).toBe('claude-opus-4-8')
    // Anthropic can't express `developer`, so it coerces to `user`.
    expect(form.value.messages[0]!.role).toBe('user')
  })

  it('keeps temperature in the canonical template but the adapter omits it for Claude', async () => {
    const { form, canonicalTemplate, payloadPreview } = usePromptTemplateEditor()
    form.value.provider = 'anthropic'
    await nextTick()
    expect(canonicalTemplate.value.temperature).toBe(0.2)
    expect(payloadPreview.value.temperature).toBeUndefined()
  })

  it('reports a schema error only for invalid JSON while structured output is enabled', () => {
    const { form, schemaError } = usePromptTemplateEditor()
    form.value.structuredOutput.enabled = true
    form.value.structuredOutput.schemaText = '{ not json'
    expect(schemaError.value).not.toBe('')
    form.value.structuredOutput.schemaText = '{ "type": "object" }'
    expect(schemaError.value).toBe('')
  })

  it('exportTemplate returns a plain, detached deep clone (no DataCloneError)', () => {
    const { form, addMessage, exportTemplate } = usePromptTemplateEditor()
    addMessage('assistant') // nested reactive array that broke structuredClone

    const snapshot = exportTemplate()
    expect(snapshot.messages).toHaveLength(2)

    // Mutating the snapshot must not affect the live form.
    snapshot.name = 'changed'
    snapshot.messages[0]!.content = 'edited'
    expect(form.value.name).not.toBe('changed')
    expect(form.value.messages[0]!.content).not.toBe('edited')
  })

  it('loadTemplate uses the current provider default model, not the template model', () => {
    const { form, loadTemplate } = usePromptTemplateEditor()
    loadTemplate({ model: 'claude-opus-4-8', messages: [{ role: 'user', content: 'Hi' }] })
    expect(form.value.provider).toBe('openai')
    expect(form.value.model).toBe('gpt-4.1')
  })

  it('loadForm restores a full form, validates provider, coerces roles, regenerates ids', () => {
    const { form, loadForm } = usePromptTemplateEditor()
    const messages = [
      { id: 'old-1', role: 'developer' as const, content: 'sys' },
      { id: 'old-2', role: 'user' as const, content: 'hi' },
    ]
    loadForm({
      name: 'Imported',
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      instructions: 'x',
      messages,
    })
    expect(form.value.name).toBe('Imported')
    expect(form.value.provider).toBe('anthropic')
    expect(form.value.model).toBe('claude-sonnet-5')
    // developer isn't a valid Anthropic role → coerced to user
    expect(form.value.messages.map((m) => m.role)).toEqual(['user', 'user'])
    // ids regenerated, not carried from the file
    expect(form.value.messages[0]!.id).not.toBe('old-1')
  })

  it('loadForm resets an unknown provider to the default', () => {
    const { form, loadForm } = usePromptTemplateEditor()
    loadForm({ provider: 'bogus-provider', messages: [{ role: 'user', content: 'hi' }] })
    expect(form.value.provider).toBe('openai')
  })

  it('export → loadForm round-trips the editable state', () => {
    const a = usePromptTemplateEditor()
    a.form.value.name = 'Round Trip'
    a.addMessage('assistant')
    a.form.value.messages[1]!.content = 'hello'
    const snapshot = a.exportTemplate()

    const b = usePromptTemplateEditor()
    b.loadForm(snapshot)
    expect(b.form.value.name).toBe('Round Trip')
    expect(b.form.value.messages).toHaveLength(2)
    expect(b.form.value.messages[1]!.content).toBe('hello')
  })
})
