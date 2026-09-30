import { CarFront, ChevronRight, CircleHelp, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LanguageSwitch, Switch, TopBar } from '../components/ui'

const rowClass = 'flex h-touch w-full items-center gap-3 px-4 text-left font-medium hover:bg-canvas'

export default function Profile() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState(true)

  const rows = [
    { icon: CreditCard, label: t('profile.paymentMethods'), to: '/profile/payment' },
    { icon: CarFront, label: t('profile.vehicles'), to: '/profile/vehicles' },
    {
      icon: CircleHelp,
      label: t('profile.help'),
      href: `mailto:ayuda@parkapp.example?subject=${encodeURIComponent(t('profileLinks.helpSubject'))}`,
    },
  ]

  return (
    <>
      <TopBar title={t('profile.title')} />
      <div className="space-y-6 px-4">
        <section className="flex items-center gap-4">
          <span
            className="grid size-16 place-items-center rounded-full bg-primary font-display text-headline font-bold text-white"
            aria-hidden
          >
            E
          </span>
          <div>
            <p className="text-title font-semibold">Emanuel</p>
            <p className="text-caption text-ink-muted">{t('profile.member', { year: 2026 })}</p>
          </div>
        </section>

        <LanguageSwitch />

        <section className="rounded-surface bg-surface p-4 ring-1 ring-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{t('profile.notifications')}</h2>
              <p className="mt-0.5 max-w-[30ch] text-caption text-ink-muted">{t('profile.notificationsHint')}</p>
            </div>
            <Switch checked={alerts} onChange={setAlerts} label={t('profile.notifications')} />
          </div>
        </section>

        <ul className="divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
          {rows.map(({ icon: Icon, label, to, href }) => {
            const content = (
              <>
                <Icon className="size-5 text-primary" aria-hidden />
                <span className="flex-1">{label}</span>
                <ChevronRight className="size-5 text-ink-subtle" aria-hidden />
              </>
            )
            return (
              <li key={label}>
                {to ? (
                  <Link to={to} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <a href={href} className={rowClass}>
                    {content}
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
