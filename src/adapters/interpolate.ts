// adapters/interpolate.ts
import type { TemplateVariables } from './types'

// Replaces {{ variableName }} placeholders with values from `vars`.
export function interpolate(template: string, vars: TemplateVariables): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, rawKey) => {
    const key = String(rawKey).trim()
    const value = vars[key]
    return value == null ? '' : String(value)
  })
}
