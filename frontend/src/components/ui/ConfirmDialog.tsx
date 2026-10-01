import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Use the red variant for destructive confirmations such as cancelling a booking. */
  danger?: boolean
  busy?: boolean
}

/**
 * Modal built on the native <dialog>: the browser traps focus, closes on Escape and
 * returns focus to the opener. Cancel is the default (first) action.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
  busy,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-surface bg-surface p-6 text-ink shadow-sheet backdrop:bg-ink/50"
    >
      <h2 id={titleId} className="text-title font-semibold">
        {title}
      </h2>
      <div id={bodyId} className="mt-2 text-ink-muted">
        {body}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} autoFocus disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'action'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
