import type { TFunction } from 'i18next'
import { ApiProblem } from '../../api/unwrap'
import { errorMessage } from '../../lib/errors'

/** Which form field a server error code belongs to. Codes not listed show as a form-level message. */
const FIELD_OF: Record<string, string> = {
  invalid_name: 'name',
  invalid_birth_date: 'birthDate',
  underage: 'birthDate',
  invalid_email: 'email',
  consent_required: 'consent',
  invalid_plate: 'plate',
  invalid_vehicle: 'vehicle',
}

export interface FormErrors {
  field?: string
  message: string
}

export function toFormError(t: TFunction, error: unknown): FormErrors | undefined {
  if (!error) return undefined
  const code = error instanceof ApiProblem ? error.code : 'unknown'
  return { field: FIELD_OF[code], message: errorMessage(t, error) }
}
