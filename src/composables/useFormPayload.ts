// composables/useFormPayload.ts
import { toValue, type MaybeRefOrGetter } from 'vue'

type FormPrimitive = string | number | boolean | null | undefined
type FormObject = { [key: string]: FormDataValue }
type FormArray = FormDataValue[]
type FormDataValue = FormPrimitive | FormObject | FormArray
export type FormValues = FormObject

export type FieldMeta = {
  label: string
  description: string
}

type FieldMetaMap = Record<string, FieldMeta>

export type PayloadField = {
  path: string
  label: string
  description: string
  value: FormDataValue
}

export type FormPayload = {
  fields: PayloadField[]
  valuesByLabel: Record<string, FormDataValue>
  nestedValuesByLabel: Record<string, unknown>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function flattenFormValues(obj: Record<string, unknown>, parentPath = ''): PayloadField[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = parentPath ? `${parentPath}.${key}` : key

    if (isPlainObject(value)) {
      return flattenFormValues(value, path)
    }

    return [
      {
        path,
        label: path,
        value: value as FormDataValue,
      },
    ]
  })
}

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.').filter(Boolean)
  let current: Record<string, unknown> = target

  for (const [index, key] of keys.entries()) {
    const isLast = index === keys.length - 1

    if (isLast) {
      current[key] = value
      return
    }

    const nextValue = current[key]

    if (!isPlainObject(nextValue)) {
      current[key] = {}
    }

    current = current[key] as Record<string, unknown>
  }
}

export function useFormPayload(
  form: MaybeRefOrGetter<FormValues>,
  meta: MaybeRefOrGetter<FieldMetaMap> = {},
) {
  const buildPayload = () => {
    const formValue = toValue(form)
    const metaValue = toValue(meta)

    const fields = flattenFormValues(formValue).map((field) => {
      const config = metaValue[field.path]

      return {
        ...field,
        label: config?.label ?? field.path,
        description: config?.description ?? '',
      }
    })

    const valuesByLabel = Object.fromEntries(fields.map((field) => [field.label, field.value]))

    const nestedValuesByLabel: Record<string, unknown> = {}

    fields.forEach((field) => {
      setNestedValue(nestedValuesByLabel, field.label, field.value)
    })

    return {
      fields,
      valuesByLabel,
      nestedValuesByLabel,
    }
  }

  return {
    buildPayload,
  }
}
