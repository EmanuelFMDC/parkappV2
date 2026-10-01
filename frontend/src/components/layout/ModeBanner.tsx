import { Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { HOME_OF } from '../../lib/mode'

/**
 * Always visible in host mode, so nobody confuses it with the driver side. It is also the one-tap
 * way back to the driver side.
 */
export function ModeBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4">
        <p className="flex items-center gap-2 py-2 text-caption font-semibold">
          <Warehouse aria-hidden className="size-4" />
          {t('mode.hostBanner')}
        </p>
        <button
          type="button"
          onClick={() => navigate(HOME_OF.driver)}
          className="inline-flex h-touch items-center rounded-control px-2 text-caption font-semibold underline underline-offset-4 hover:bg-white/10"
        >
          {t('mode.switchToDriver')}
        </button>
      </div>
    </div>
  )
}
