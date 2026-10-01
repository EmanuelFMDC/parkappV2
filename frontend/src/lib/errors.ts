import type { TFunction } from 'i18next'
import { ApiProblem } from '../api/unwrap'

/** Turns anything thrown by the API layer into a message in the person's language. */
export function errorMessage(t: TFunction, error: unknown): string {
  const code = error instanceof ApiProblem ? error.code : 'unknown'
  return t(`errors.code.${code}`, { defaultValue: t('errors.code.unknown') })
}

export function errorCode(error: unknown): string | null {
  return error instanceof ApiProblem ? error.code : null
}
