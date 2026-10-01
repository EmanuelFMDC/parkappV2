import { Search, SearchX, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Input,
  Segmented,
  Skeleton,
  Switch,
} from '../../components/ui'
import { Section, Subsection } from '../Section'

type Arrival = 'now' | 'in30' | 'in60'
const chipKeys = ['covered', 'gate', 'camera'] as const

export function ControlsSection() {
  const { t } = useTranslation()
  const [arrival, setArrival] = useState<Arrival>('now')
  const [alerts, setAlerts] = useState(true)
  const [chips, setChips] = useState<string[]>(['covered'])

  return (
    <Section
      id="controls"
      title={t('styleguide.buttons.title')}
      intro={t('styleguide.buttons.intro')}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <Subsection title={t('styleguide.buttons.variants')}>
          <div className="flex flex-wrap gap-3">
            <Button variant="action">{t('styleguide.buttons.action')}</Button>
            <Button variant="brand">{t('styleguide.buttons.brand')}</Button>
            <Button variant="secondary">{t('styleguide.buttons.secondary')}</Button>
            <Button variant="ghost">{t('styleguide.buttons.ghost')}</Button>
            <Button variant="danger">{t('styleguide.buttons.danger')}</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button loading>{t('styleguide.buttons.loading')}</Button>
            <Button disabled>{t('styleguide.buttons.disabled')}</Button>
            <Button size="md" variant="secondary">
              {t('styleguide.buttons.small')}
            </Button>
          </div>
        </Subsection>

        <Subsection title={t('styleguide.forms.title')}>
          <Input
            label={t('styleguide.forms.search')}
            hideLabel
            type="search"
            placeholder={t('styleguide.forms.search')}
            icon={<Search className="size-5" />}
          />
          <Input
            label={t('styleguide.forms.plate')}
            hint={t('styleguide.forms.plateHint')}
            placeholder="ABC-123"
          />
          <Input
            label={t('styleguide.forms.plate')}
            defaultValue="AB"
            error={t('styleguide.forms.plateError')}
          />
          <Segmented
            label={t('styleguide.forms.arrival')}
            value={arrival}
            onChange={setArrival}
            options={[
              { value: 'now', label: t('styleguide.forms.now') },
              { value: 'in30', label: t('styleguide.forms.in30') },
              { value: 'in60', label: t('styleguide.forms.in60') },
            ]}
          />
          <div className="flex items-center justify-between gap-4 rounded-control bg-surface p-4 ring-1 ring-line">
            <span className="font-medium">{t('styleguide.forms.alerts')}</span>
            <Switch checked={alerts} onChange={setAlerts} label={t('styleguide.forms.alerts')} />
          </div>
          <div
            role="group"
            aria-label={t('styleguide.forms.filters')}
            className="flex flex-wrap gap-2"
          >
            {chipKeys.map((k) => (
              <Chip
                key={k}
                selected={chips.includes(k)}
                onClick={() =>
                  setChips((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]))
                }
              >
                {t(`samples.tags.${k}`)}
              </Chip>
            ))}
          </div>
        </Subsection>

        <Subsection title={t('styleguide.feedback.title')}>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{t('styleguide.feedback.available')}</Badge>
            <Badge tone="warning">{t('styleguide.feedback.few')}</Badge>
            <Badge tone="danger">{t('styleguide.feedback.full')}</Badge>
            <Badge tone="brand" icon={<ShieldCheck className="size-3.5" />}>
              {t('styleguide.feedback.verified')}
            </Badge>
            <Badge>{t('styleguide.feedback.neutral')}</Badge>
          </div>
          <div role="status" aria-label={t('styleguide.feedback.loading')} className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </Subsection>

        <Subsection title={t('styleguide.feedback.emptyHeading')}>
          <EmptyState
            icon={<SearchX className="size-6" />}
            title={t('styleguide.feedback.emptyTitle')}
            body={t('styleguide.feedback.emptyBody')}
            action={
              <Button variant="secondary" size="md">
                {t('styleguide.feedback.emptyAction')}
              </Button>
            }
          />
        </Subsection>
      </div>
    </Section>
  )
}
