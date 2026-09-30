import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  onBack?: () => void
  /** Show a back button that goes to the previous screen. */
  back?: boolean
  trailing?: ReactNode
}

export function TopBar({ title, back = false, onBack, trailing }: TopBarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 bg-canvas/90 px-4 backdrop-blur">
      {back && (
        <button
          type="button"
          onClick={onBack ?? (() => navigate(-1))}
          aria-label={t('common.back')}
          className="-ml-2 grid size-11 place-items-center rounded-full text-ink hover:bg-line/60"
        >
          <ArrowLeft className="size-6" aria-hidden />
        </button>
      )}
      <h1 className="flex-1 truncate text-title font-semibold">{title}</h1>
      {trailing}
    </header>
  )
}
