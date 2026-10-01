import { CalendarCheck, Compass, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomNav, StepIndicator, TopBar } from '../../components/ui'
import { Section, Subsection } from '../Section'

export function NavigationSection() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('explore')
  const [step, setStep] = useState(2)

  const driverSteps = ['venue', 'space', 'time', 'pay'].map((k) =>
    t(`styleguide.nav.driverSteps.${k}`),
  )
  const hostSteps = ['location', 'size', 'photos', 'price'].map((k) =>
    t(`styleguide.nav.hostSteps.${k}`),
  )

  return (
    <Section id="navigation" title={t('styleguide.nav.title')} intro={t('styleguide.nav.intro')}>
      <div className="grid gap-8 lg:grid-cols-2">
        <Subsection title={t('styleguide.nav.bars')}>
          <div className="overflow-hidden rounded-surface bg-canvas ring-1 ring-line">
            <TopBar as="p" title={t('styleguide.nav.topbar')} onBack={() => undefined} />
            <div className="h-10" />
            <BottomNav
              position="static"
              current={tab}
              onSelect={setTab}
              items={[
                { key: 'explore', label: t('styleguide.nav.explore'), icon: <Compass /> },
                { key: 'bookings', label: t('styleguide.nav.bookings'), icon: <CalendarCheck /> },
                { key: 'profile', label: t('styleguide.nav.profile'), icon: <UserRound /> },
              ]}
            />
          </div>
        </Subsection>

        <Subsection title={t('styleguide.nav.steps')}>
          <div className="@container space-y-6 rounded-surface bg-surface p-5 ring-1 ring-line">
            <StepIndicator steps={driverSteps} current={step} />
            <StepIndicator steps={hostSteps} current={4} />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={step === n}
                  onClick={() => setStep(n)}
                  className={`size-touch rounded-control text-body font-semibold ${
                    step === n
                      ? 'bg-ink text-white'
                      : 'bg-canvas text-ink ring-1 ring-inset ring-control'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </Subsection>
      </div>
    </Section>
  )
}
