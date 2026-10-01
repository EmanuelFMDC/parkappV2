import clsx from 'clsx'
import type { ReactNode } from 'react'

/**
 * Fixed bar with the screen's one main action, always within thumb reach.
 * On screens that also show the bottom navigation, set `aboveNav` so the bar sits on top of it.
 */
export function StickyBar({ children, aboveNav }: { children: ReactNode; aboveNav?: boolean }) {
  return (
    <div
      className={clsx(
        'fixed inset-x-0 z-30 border-t border-line bg-surface',
        aboveNav
          ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))]'
          : 'bottom-0 pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        {children}
      </div>
    </div>
  )
}
