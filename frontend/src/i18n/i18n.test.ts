/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import i18n, { dictionaries, mergeTranslations, toSupportedLanguage } from './index'

type Tree = { [key: string]: string | Tree }

function keys(obj: Tree, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
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

describe('mergeTranslations', () => {
  it('merges nested trees without losing sibling keys', () => {
    expect(mergeTranslations({ a: { x: '1' } }, { a: { y: '2' }, b: '3' })).toEqual({
      a: { x: '1', y: '2' },
      b: '3',
    })
  })
})

describe('translations', () => {
  it('has the same keys in es-MX and en', () => {
    expect(keys(dictionaries.en).sort()).toEqual(keys(dictionaries['es-MX']).sort())
  })

  it('has no empty strings', () => {
    for (const lang of ['es-MX', 'en'] as const) {
      const empty = keys(dictionaries[lang]).filter((k) => {
        let node: string | Tree = dictionaries[lang]
        for (const part of k.split('.')) node = (node as Tree)[part]!
        return node === ''
      })
      expect(empty).toEqual([])
    }
  })

  it('defines every key the code asks for with a literal t("...")', () => {
    const all = new Set(keys(dictionaries['es-MX']))
    const hasKey = (key: string) => all.has(key) || all.has(`${key}_one`) || all.has(`${key}_other`)
    const missing: string[] = []
    let checked = 0
    for (const file of sourceFiles(resolve(process.cwd(), 'src'))) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
        checked += 1
        if (!hasKey(match[1]!)) missing.push(`${file.split('src')[1]}: ${match[1]}`)
      }
    }
    expect(checked).toBeGreaterThan(100) // the scan really found the calls
    expect(missing).toEqual([])
  })

  it('keeps the html lang attribute in sync', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    await i18n.changeLanguage('es-MX')
    expect(document.documentElement.lang).toBe('es-MX')
  })
})
