import clsx from 'clsx'
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DOCK_MIN_WIDTH, useContainerSize } from '../../lib/useDocked'

export type SheetState = 'peek' | 'half' | 'full'
const order: SheetState[] = ['peek', 'half', 'full']
const PEEK_PX = 148

/** Heights are relative to the container the sheet lives in (the screen in the app). */
function heightFor(state: SheetState, container: number): number {
  return state === 'peek' ? PEEK_PX : Math.round(container * (state === 'half' ? 0.52 : 0.88))
}

interface BottomSheetProps {
  state: SheetState
  onStateChange: (state: SheetState) => void
  /** Always visible, next to the handle (for example the result count). */
  summary: ReactNode
  /** Content; a function receives `docked` so lists can switch layout on wide containers. */
  children: ReactNode | ((docked: boolean) => ReactNode)
  /** Accessible name of the panel. */
  label: string
}

/**
 * Uber-style draggable panel with three heights. Inside a container wide enough (768px)
 * it becomes a docked side column, which is the Airbnb-style list next to the map.
 * Keyboard: the handle is a button; Enter/Space toggles, Arrow Up/Down change height.
 */
export function BottomSheet({ state, onStateChange, summary, children, label }: BottomSheetProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLElement>(null)
  const { width, height } = useContainerSize(ref)
  const docked = width >= DOCK_MIN_WIDTH
  const [dragPx, setDragPx] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null)

  const viewport = height || 800
  const heightPx = dragPx ?? heightFor(state, viewport)

  const step = (dir: 1 | -1) => {
    const next = order[order.indexOf(state) + dir]
    if (next) onStateChange(next)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (docked) return
    drag.current = { startY: e.clientY, startH: heightFor(state, viewport), moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const delta = d.startY - e.clientY
    if (Math.abs(delta) > 6) d.moved = true
    if (d.moved) {
      setDragPx(Math.min(heightFor('full', viewport), Math.max(PEEK_PX, d.startH + delta)))
    }
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d?.moved || dragPx === null) return
    const nearest = order.reduce((best, s) =>
      Math.abs(heightFor(s, viewport) - dragPx) < Math.abs(heightFor(best, viewport) - dragPx)
        ? s
        : best,
    )
    setDragPx(null)
    onStateChange(nearest)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      step(1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      step(-1)
    }
  }

  const expanded = state !== 'peek'
  return (
    <section
      ref={ref}
      aria-label={label}
      style={{ '--sheet-h': `${heightPx}px` } as CSSProperties}
      className={clsx(
        'absolute inset-x-0 bottom-0 z-30 flex h-[var(--sheet-h)] flex-col rounded-t-sheet bg-surface shadow-sheet',
        dragPx === null && 'transition-[height] duration-300 ease-out-quint',
        '@3xl:static @3xl:order-first @3xl:h-full @3xl:w-[26rem] @3xl:shrink-0 @3xl:rounded-none @3xl:shadow-none @3xl:ring-1 @3xl:ring-line',
      )}
    >
      <div
        className="touch-none select-none px-4 pb-2 pt-2 @3xl:touch-auto"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {!docked && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? t('sheet.collapse') : t('sheet.expand')}
            onClick={() => {
              if (!drag.current?.moved) onStateChange(expanded ? 'peek' : 'half')
            }}
            onKeyDown={onKeyDown}
            className="mx-auto flex h-touch w-full items-center justify-center"
          >
            <span aria-hidden className="h-1.5 w-12 rounded-full bg-control" />
          </button>
        )}
        <div className={clsx(docked && 'pt-3')}>{summary}</div>
      </div>
      <div
        // Hidden content must not be focusable while the sheet is collapsed.
        inert={!docked && state === 'peek'}
        className={clsx(
          'min-h-0 flex-1 overflow-y-auto px-4 pb-6',
          // Collapsed: also invisible, so no edge of the list peeks out under the summary.
          !docked && state === 'peek' && 'invisible',
        )}
      >
        {typeof children === 'function' ? children(docked) : children}
      </div>
    </section>
  )
}
