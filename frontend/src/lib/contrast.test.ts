/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastPairs, palette } from '../styleguide/tokens'
import { contrastRatio, MIN_RATIO } from './contrast'

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('design tokens', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

  it('palette mirrors index.css exactly', () => {
    const fromCss = Object.fromEntries(
      [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
    )
    expect(fromCss).toEqual(palette)
  })

  it.each(contrastPairs)('$id meets WCAG AA ($level)', ({ fg, bg, level }) => {
    const ratio = contrastRatio(palette[fg], palette[bg])
    expect(ratio, `${fg} on ${bg}`).toBeGreaterThanOrEqual(MIN_RATIO[level])
  })
})
