import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { StickyBar } from '../../components/layout/StickyBar'
import { WizardHeader } from '../../components/layout/WizardHeader'
import { Button } from '../../components/ui'
import { stepPath } from './steps'
import { HOST_STEPS, type HostStep } from './validate'

interface HostStepFrameProps {
  step: HostStep
  title: string
  intro?: string
  children: ReactNode
  /** Called when the host presses the main button. */
  onNext: () => void
  nextLabel: string
  nextLoading?: boolean
}

/** Header with the four-step progress, the form, and the one main button. */
export function HostStepFrame({
  step,
  title,
  intro,
  children,
  onNext,
  nextLabel,
  nextLoading,
}: HostStepFrameProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const index = HOST_STEPS.indexOf(step)
  const names = HOST_STEPS.map((s) => t(`host.steps.${s}`))
  const previous = HOST_STEPS[index - 1]
  const following = HOST_STEPS[index + 1]

  return (
    <>
      <WizardHeader
        title={title}
        step={index + 1}
        steps={names}
        onBack={() => navigate(previous ? stepPath(previous) : '/host')}
      />
      <Page withBar className="space-y-6">
        {intro && <p className="max-w-[56ch] text-ink-muted">{intro}</p>}
        {children}
      </Page>
      <StickyBar>
        <span className="min-w-0 flex-1 truncate text-caption text-ink-muted">
          {following
            ? t('host.nextUp', { step: t(`host.steps.${following}`) })
            : t('host.lastStep')}
        </span>
        <Button loading={nextLoading} onClick={onNext}>
          {nextLabel}
        </Button>
      </StickyBar>
    </>
  )
}
