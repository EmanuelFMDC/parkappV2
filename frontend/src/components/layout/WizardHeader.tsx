import { useTranslation } from 'react-i18next'
import { StepIndicator, TopBar } from '../ui'

interface WizardHeaderProps {
  title: string
  /** 1 to 4: venue, garage, time, payment. */
  step: 1 | 2 | 3 | 4
  onBack: () => void
  /** Full width for the map screen. */
  wide?: boolean
}

/** Top bar plus the four-step progress used by the whole booking flow. */
export function WizardHeader({ title, step, onBack, wide }: WizardHeaderProps) {
  const { t } = useTranslation()
  const names = (['venue', 'space', 'time', 'pay'] as const).map((k) => t(`wizard.steps.${k}`))
  return (
    <div className="@container bg-canvas">
      <TopBar title={title} onBack={onBack} wide={wide} />
      <div className={`px-4 pb-3 ${wide ? '' : 'mx-auto max-w-3xl'}`}>
        <StepIndicator steps={names} current={step} />
      </div>
    </div>
  )
}
