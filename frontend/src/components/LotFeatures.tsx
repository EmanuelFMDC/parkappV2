import { BatteryCharging, ShieldCheck, Umbrella } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LotFeature } from '../data/lots'

const icons = { covered: Umbrella, ev: BatteryCharging, secure: ShieldCheck } as const

export function LotFeatures({ features }: { features: LotFeature[] }) {
  const { t } = useTranslation()
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {features.map((f) => {
        const Icon = icons[f]
        return (
          <li key={f} className="flex items-center gap-1.5 text-caption font-medium text-ink-muted">
            <Icon className="size-4 text-primary" aria-hidden />
            {t(`common.${f}`)}
          </li>
        )
      })}
    </ul>
  )
}
