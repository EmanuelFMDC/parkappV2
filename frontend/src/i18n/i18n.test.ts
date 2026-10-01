import { describe, expect, it } from 'vitest'
import en from './en.json'
import esMX from './es-MX.json'
import i18n, { toSupportedLanguage } from './index'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('toSupportedLanguage', () => {
  it.each([
    ['es', 'es-MX'],
    ['es-MX', 'es-MX'],
    ['es-AR', 'es-MX'],
    ['en', 'en'],
    ['en-US', 'en'],
    ['fr-FR', 'es-MX'],
  ])('maps %s to %s', (input, expected) => {
    expect(toSupportedLanguage(input)).toBe(expected)
  })
})

describe('translations', () => {
  it('has the same keys in es-MX and en', () => {
    expect(keys(en).sort()).toEqual(keys(esMX).sort())
  })

  it('keeps the html lang attribute in sync', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    await i18n.changeLanguage('es-MX')
    expect(document.documentElement.lang).toBe('es-MX')
  })
})
