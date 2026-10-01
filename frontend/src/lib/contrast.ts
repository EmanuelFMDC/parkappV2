/** WCAG 2.x contrast helpers, used by the style guide and its tests. */

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => channel(parseInt(h.slice(i, i + 2), 16)))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light! + 0.05) / (dark! + 0.05)
}

export type ContrastLevel = 'text' | 'large' | 'ui'

export const MIN_RATIO: Record<ContrastLevel, number> = { text: 4.5, large: 3, ui: 3 }

export function passes(foreground: string, background: string, level: ContrastLevel): boolean {
  return contrastRatio(foreground, background) >= MIN_RATIO[level]
}
