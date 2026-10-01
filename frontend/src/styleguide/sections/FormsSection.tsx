import { Share2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Checkbox,
  ConfirmDialog,
  DateTimeField,
  IconButton,
  RadioCard,
  Select,
  Textarea,
} from '../../components/ui'
import { localToUtcIso } from '../../lib/time'
import { Section, Subsection } from '../Section'

const NOTE_MAX = 200
const vehicleKeys = ['car', 'suv', 'van'] as const

export function FormsSection() {
  const { t } = useTranslation()
  const [agree, setAgree] = useState(false)
  const [note, setNote] = useState('')
  const [vehicle, setVehicle] = useState<string>('car')
  const [start, setStart] = useState(() => localToUtcIso('2026-10-17', '17:30'))
  const [dialog, setDialog] = useState<'none' | 'plain' | 'danger'>('none')
  const [result, setResult] = useState('')

  const close = (outcome: string) => {
    setDialog('none')
    setResult(outcome)
  }

  const options = vehicleKeys.map((k) => (
    <option key={k} value={k}>
      {t(`styleguide.fields.vehicles.${k}`)}
    </option>
  ))

  return (
    <Section id="forms" title={t('styleguide.fields.title')} intro={t('styleguide.fields.intro')}>
      <div className="grid gap-8 lg:grid-cols-2">
        <Subsection title={t('styleguide.fields.checkbox')}>
          <Checkbox
            label={t('styleguide.fields.checkboxLabel')}
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <Checkbox
            label={t('styleguide.fields.checkboxLabel')}
            error={t('styleguide.fields.checkboxError')}
          />
        </Subsection>

        <Subsection title={t('styleguide.fields.select')}>
          <Select
            label={t('styleguide.fields.selectLabel')}
            hint={t('styleguide.fields.selectHint')}
          >
            {options}
          </Select>
          <Select
            label={t('styleguide.fields.selectLabel')}
            error={t('styleguide.fields.selectError')}
            defaultValue=""
          >
            <option value="" disabled>
              {t('styleguide.fields.selectPlaceholder')}
            </option>
            {options}
          </Select>
        </Subsection>

        <Subsection title={t('styleguide.fields.textarea')}>
          <Textarea
            label={t('styleguide.fields.textareaLabel')}
            hint={t('styleguide.fields.textareaHint')}
            counter={{ current: note.length, max: NOTE_MAX }}
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Textarea
            label={t('styleguide.fields.textareaLabel')}
            error={t('styleguide.fields.textareaError')}
            counter={{ current: 0, max: NOTE_MAX }}
            defaultValue=""
          />
        </Subsection>

        <Subsection title={t('styleguide.fields.radio')}>
          <p className="text-caption text-ink-muted">{t('styleguide.fields.radioIntro')}</p>
          <div
            role="radiogroup"
            aria-label={t('styleguide.fields.radioLegend')}
            className="space-y-2"
          >
            {vehicleKeys.map((k) => (
              <RadioCard
                key={k}
                name="styleguide-vehicle"
                value={k}
                checked={vehicle === k}
                onChange={setVehicle}
              >
                <span className="block font-semibold">{t(`styleguide.fields.vehicles.${k}`)}</span>
                <span className="block text-caption text-ink-muted">
                  {t(`styleguide.fields.vehicleHints.${k}`)}
                </span>
              </RadioCard>
            ))}
          </div>
        </Subsection>

        <Subsection title={t('styleguide.fields.datetime')}>
          <p className="text-caption text-ink-muted">{t('styleguide.fields.datetimeIntro')}</p>
          <DateTimeField
            label={t('styleguide.fields.datetimeLabel')}
            valueUtc={start}
            onChange={setStart}
          />
          <p className="rounded-control bg-canvas p-3 text-caption text-ink-muted">
            {t('styleguide.fields.datetimeUtc')} <code className="font-mono text-ink">{start}</code>
          </p>
        </Subsection>

        <Subsection title={t('styleguide.fields.iconButtons')}>
          <p className="text-caption text-ink-muted">{t('styleguide.fields.iconIntro')}</p>
          <div className="flex items-center gap-3">
            <IconButton label={t('styleguide.fields.share')} icon={<Share2 />} />
            <IconButton label={t('styleguide.fields.close')} icon={<X />} tone="raised" />
          </div>
        </Subsection>

        <Subsection title={t('styleguide.fields.dialog')}>
          <p className="text-caption text-ink-muted">{t('styleguide.fields.dialogIntro')}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setDialog('plain')}>
              {t('styleguide.fields.openPlain')}
            </Button>
            <Button variant="danger" onClick={() => setDialog('danger')}>
              {t('styleguide.fields.openDanger')}
            </Button>
          </div>
          <p role="status" className="min-h-6 text-caption font-medium text-ink-muted">
            {result}
          </p>
        </Subsection>
      </div>

      <ConfirmDialog
        open={dialog === 'plain'}
        title={t('styleguide.fields.plainTitle')}
        body={t('styleguide.fields.plainBody')}
        confirmLabel={t('styleguide.fields.plainConfirm')}
        cancelLabel={t('styleguide.fields.cancel')}
        onConfirm={() => close(t('styleguide.fields.confirmed'))}
        onCancel={() => close(t('styleguide.fields.cancelled'))}
      />
      <ConfirmDialog
        danger
        open={dialog === 'danger'}
        title={t('styleguide.fields.dangerTitle')}
        body={t('styleguide.fields.dangerBody')}
        confirmLabel={t('styleguide.fields.dangerConfirm')}
        cancelLabel={t('styleguide.fields.keep')}
        onConfirm={() => close(t('styleguide.fields.confirmed'))}
        onCancel={() => close(t('styleguide.fields.cancelled'))}
      />
    </Section>
  )
}
