import { ChevronRight, Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { HOME_OF } from '../../lib/mode'

/** A quiet invitation, in driver mode, to rent out a garage. Not an ad: one line and one tap. */
export function HostPitch() {
  const { t } = useTranslation()
  return (
    <Link
      to={HOME_OF.host}
      className="flex min-h-touch-lg items-center gap-4 rounded-surface bg-primary-soft p-4 text-signal-800 hover:bg-signal-100"
    >
      <Warehouse aria-hidden className="size-7 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t('mode.pitchTitle')}</span>
        <span className="block text-caption">{t('mode.pitchBody')}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0" />
    </Link>
  )
}
