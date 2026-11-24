import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Incident, IncidentCategory, IncidentCreate } from '../../api/types'
import { Badge, Button, ConfirmDialog, Select, Textarea } from '../../components/ui'
import { errorMessage } from '../../lib/errors'
import { formatDateTime } from '../../lib/time'
import { useNow } from '../../lib/useNow'

const CATEGORIES: IncidentCategory[] = ['damage', 'access', 'safety', 'other']
const DESCRIPTION_MAX = 1000
/** Mirrors the server: reports are taken up to a week after the booking ends. */
const REPORT_WINDOW_MS = 7 * 24 * 3_600_000

interface IncidentReportProps {
  status: string
  endsAt: string
  incidents: Incident[]
  /** Sends the report; resolves when the server took it. */
  submit: (input: IncidentCreate) => Promise<unknown>
  pending: boolean
  error: unknown
  reset: () => void
}

/**
 * Report a problem (damage, access, safety) so ParkApp can mediate. The driver and the host each
 * see only their own reports.
 */
export function IncidentReport({
  status,
  endsAt,
  incidents,
  submit,
  pending,
  error,
  reset,
}: IncidentReportProps) {
  const { t, i18n } = useTranslation()
  const now = useNow()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<IncidentCategory>('damage')
  const [description, setDescription] = useState('')
  const canReport =
    ['confirmed', 'in_use', 'completed'].includes(status) &&
    now <= Date.parse(endsAt) + REPORT_WINDOW_MS

  if (!canReport && incidents.length === 0) return null

  const send = async () => {
    try {
      await submit({ category, description })
      setOpen(false)
      setDescription('')
    } catch {
      // The error is shown in the dialog.
    }
  }

  return (
    <section className="space-y-2">
      {incidents.map((incident) => (
        <p
          key={incident.id}
          className="flex flex-wrap items-center gap-2 rounded-control bg-canvas p-3 text-caption text-ink-muted"
        >
          <TriangleAlert aria-hidden className="size-4 shrink-0 text-warning-700" />
          {t('incidents.reported', {
            category: t(`incidents.category.${incident.category}`),
            date: formatDateTime(incident.createdAt, i18n.language, {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            }),
          })}
          <Badge tone={incident.status === 'open' ? 'warning' : 'success'}>
            {t(`incidents.status.${incident.status}`)}
          </Badge>
        </p>
      ))}
      {canReport && (
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            reset()
            setOpen(true)
          }}
        >
          <TriangleAlert aria-hidden className="size-5" />
          {t('incidents.report')}
        </Button>
      )}

      <ConfirmDialog
        open={open}
        busy={pending}
        title={t('incidents.title')}
        confirmLabel={t('incidents.send')}
        cancelLabel={t('incidents.cancel')}
        onCancel={() => setOpen(false)}
        onConfirm={() => void send()}
        body={
          <div className="space-y-4 text-ink">
            <p className="text-ink-muted">{t('incidents.intro')}</p>
            <Select
              label={t('incidents.categoryLabel')}
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`incidents.category.${c}`)}
                </option>
              ))}
            </Select>
            <Textarea
              label={t('incidents.descriptionLabel')}
              hint={t('incidents.descriptionHint')}
              value={description}
              counter={{ current: description.length, max: DESCRIPTION_MAX }}
              onChange={(e) => setDescription(e.target.value)}
              error={error ? errorMessage(t, error) : undefined}
            />
          </div>
        }
      />
    </section>
  )
}
