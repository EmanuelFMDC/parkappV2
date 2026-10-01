import type { ContrastLevel } from '../lib/contrast'

/** Mirror of the colors in index.css. tokens.test.ts fails if they drift apart. */
export const palette = {
  'signal-50': '#eef3fc',
  'signal-100': '#d9e5f8',
  'signal-200': '#b3c9f0',
  'signal-300': '#7fa1e0',
  'signal-500': '#2a5cb8',
  'signal-600': '#174a9f',
  'signal-700': '#0f3d91',
  'signal-800': '#0b2e70',
  'signal-900': '#081d4a',
  'ticket-50': '#fff6e0',
  'ticket-200': '#ffe199',
  'ticket-400': '#ffb21a',
  'ticket-500': '#f29d00',
  'ticket-700': '#8a5600',
  ink: '#081230',
  'ink-muted': '#4a5573',
  'ink-subtle': '#66708f',
  line: '#dfe3ec',
  control: '#7d88a6',
  canvas: '#f6f7fa',
  surface: '#ffffff',
  'success-50': '#e5f5ec',
  'success-600': '#0f6e40',
  'danger-50': '#fdeceb',
  'danger-600': '#c9302c',
  'warning-50': '#fff6e0',
  'warning-700': '#8a5600',
} as const

export type TokenName = keyof typeof palette

export interface ColorGroup {
  key: 'brand' | 'action' | 'neutral' | 'semantic'
  tokens: TokenName[]
}

export const colorGroups: ColorGroup[] = [
  {
    key: 'brand',
    tokens: [
      'signal-50',
      'signal-100',
      'signal-200',
      'signal-300',
      'signal-500',
      'signal-600',
      'signal-700',
      'signal-800',
      'signal-900',
    ],
  },
  { key: 'action', tokens: ['ticket-50', 'ticket-200', 'ticket-400', 'ticket-500', 'ticket-700'] },
  {
    key: 'neutral',
    tokens: ['ink', 'ink-muted', 'ink-subtle', 'line', 'control', 'canvas', 'surface'],
  },
  {
    key: 'semantic',
    tokens: ['success-50', 'success-600', 'danger-50', 'danger-600', 'warning-50', 'warning-700'],
  },
]

export interface ContrastPair {
  id: string
  fg: TokenName
  bg: TokenName
  level: ContrastLevel
}

/** Every combination the components actually use. */
export const contrastPairs: ContrastPair[] = [
  { id: 'body', fg: 'ink', bg: 'canvas', level: 'text' },
  { id: 'bodyOnSurface', fg: 'ink', bg: 'surface', level: 'text' },
  { id: 'muted', fg: 'ink-muted', bg: 'surface', level: 'text' },
  { id: 'mutedOnCanvas', fg: 'ink-muted', bg: 'canvas', level: 'text' },
  { id: 'subtle', fg: 'ink-subtle', bg: 'canvas', level: 'text' },
  { id: 'actionLabel', fg: 'ink', bg: 'ticket-400', level: 'text' },
  { id: 'actionHover', fg: 'ink', bg: 'ticket-500', level: 'text' },
  { id: 'brandButton', fg: 'surface', bg: 'signal-700', level: 'text' },
  { id: 'link', fg: 'signal-700', bg: 'surface', level: 'text' },
  { id: 'onBrandCaption', fg: 'signal-200', bg: 'signal-700', level: 'text' },
  { id: 'success', fg: 'success-600', bg: 'success-50', level: 'text' },
  { id: 'danger', fg: 'danger-600', bg: 'danger-50', level: 'text' },
  { id: 'dangerOnSurface', fg: 'danger-600', bg: 'surface', level: 'text' },
  { id: 'warning', fg: 'warning-700', bg: 'warning-50', level: 'text' },
  { id: 'focusRing', fg: 'signal-700', bg: 'canvas', level: 'ui' },
  { id: 'controlBorder', fg: 'control', bg: 'surface', level: 'ui' },
  { id: 'controlBorderOnCanvas', fg: 'control', bg: 'canvas', level: 'ui' },
]

export const typeScale = [
  { token: 'display', className: 'text-display font-display font-bold' },
  { token: 'headline', className: 'text-headline font-display font-bold' },
  { token: 'title', className: 'text-title font-display font-semibold' },
  { token: 'lead', className: 'text-lead' },
  { token: 'body', className: 'text-body' },
  { token: 'caption', className: 'text-caption' },
] as const

export const spacingScale = [1, 2, 3, 4, 6, 8, 12, 16] as const
