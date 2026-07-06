// adapters/models.ts
import type { ModelSpec } from './types'

// Resolve a model id to its spec. Unknown ids (custom / pinned snapshots the
// catalog doesn't list) fall back to a permissive profile — we'd rather emit a
// field the user configured than silently drop it for a model we don't know.
export function resolveModel(models: ModelSpec[], id: string): ModelSpec {
  return (
    models.find((model) => model.id === id) ?? {
      id,
      label: id || 'Custom',
      supportsTemperature: true,
      supportsStructuredOutput: true,
      maxOutputTokens: 0,
    }
  )
}
