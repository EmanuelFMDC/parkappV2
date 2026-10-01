import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface NavItem {
  key: string
  label: string
  icon: ReactNode
}

interface BottomNavProps {
  items: NavItem[]
  current: string
  onSelect: (key: string) => void
  /** `fixed` to the viewport bottom (app) or `static` (style guide frames). */
  position?: 'fixed' | 'static'
}

export function BottomNav({ items, current, onSelect, position = 'fixed' }: BottomNavProps) {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('ui.mainNav')}
      className={clsx(
        'inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]',
        position === 'fixed' ? 'fixed' : 'relative',
      )}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ key, label, icon }) => {
          const active = key === current
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex h-16 w-full flex-col items-center justify-center gap-1 text-caption font-semibold transition-colors [&_svg]:size-6',
                  active ? 'text-primary' : 'text-ink-muted hover:text-ink',
                )}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
