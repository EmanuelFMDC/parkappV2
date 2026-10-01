import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from './IconButton'

interface TopBarProps {
  title: string
  /** Heading level: `h1` for page-level bars, `p` when a page already has its own h1. */
  as?: 'h1' | 'h2' | 'p'
  onBack?: () => void
  trailing?: ReactNode
}

export function TopBar({ title, as: Title = 'h1', onBack, trailing }: TopBarProps) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-1 bg-canvas/90 px-3 backdrop-blur">
      {onBack && (
        <IconButton label={t('ui.back')} icon={<ArrowLeft />} onClick={onBack} className="-ml-1" />
      )}
      <Title
        className={`flex-1 truncate font-display text-title font-semibold ${onBack ? '' : 'pl-1'}`}
      >
        {title}
      </Title>
      {trailing}
    </header>
  )
}
