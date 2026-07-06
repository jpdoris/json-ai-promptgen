// lib/templateFile.ts
// Serialization envelope for saving/loading editor templates as .json files.
import type { PromptTemplateForm } from '@/composables/usePromptTemplateEditor'

const APP = 'json-promptgen'
const VERSION = 1

export type TemplateFile = {
  app: typeof APP
  version: number
  template: PromptTemplateForm
}

export function toTemplateFile(template: PromptTemplateForm): TemplateFile {
  return { app: APP, version: VERSION, template }
}

// Parse and validate a template file's text, returning the template or throwing
// a user-facing Error explaining why it isn't a json-promptgen template.
export function parseTemplateFile(text: string): PromptTemplateForm {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('The file is not valid JSON.')
  }

  const file = data as Partial<TemplateFile> | null
  if (
    !file ||
    typeof file !== 'object' ||
    file.app !== APP ||
    typeof file.template !== 'object' ||
    file.template === null
  ) {
    throw new Error('That file is not a json-promptgen template.')
  }

  return file.template
}
