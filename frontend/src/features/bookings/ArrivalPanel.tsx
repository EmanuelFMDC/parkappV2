import { Camera, LogIn, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Booking } from '../../api/types'
import { Button } from '../../components/ui'
import { CHECK_PHOTOS_MAX, CHECK_PHOTOS_MIN } from '../../lib/arrival'
import { errorMessage } from '../../lib/errors'
import { formatCents } from '../../lib/money'
import { formatDateTime } from '../../lib/time'
import { useNow } from '../../lib/useNow'
import type { DraftPhoto } from '../host/draft'
import { PhotoUploader } from '../host/PhotoUploader'
import { useCheckInOut } from './hooks'

/**
 * Arriving and leaving: photos of the car and the spot on the way in and on the way out
 * (for damage disputes), and the extra hours if the driver stays late.
 */
export function ArrivalPanel({ booking: b }: { booking: Booking }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const now = useNow()
  const mutation = useCheckInOut()
  const [photos, setPhotos] = useState<DraftPhoto[]>([])
  const [problem, setProblem] = useState<string>()
  const time = (iso: string) =>
    formatDateTime(iso, lang, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  const money = (cents: number) => formatCents(cents, lang)

  if (b.status === 'completed' && b.checkedOutAt) {
    return (
      <section aria-labelledby="arrival-title" className="space-y-2">
        <h2 id="arrival-title" className="text-title font-semibold">
          {t('arrival.summaryTitle')}
        </h2>
        <p className="text-ink-muted">
          {t('arrival.summary', {
            in: b.checkedInAt ? time(b.checkedInAt) : '—',
            out: time(b.checkedOutAt),
          })}
        </p>
        <p className="font-medium">
          {(b.overtimeHours ?? 0) > 0
            ? t('arrival.overtimeCharged', {
                count: b.overtimeHours ?? 0,
                amount: money(b.overtimeCents ?? 0),
              })
            : t('arrival.noOvertime')}
        </p>
      </section>
    )
  }

  const arriving = b.status === 'confirmed'
  const leaving = b.status === 'in_use'
  if (!arriving && !leaving) return null
  if (arriving && now >= Date.parse(b.endsAt)) return null

  if (arriving && now < Date.parse(b.checkInOpensAt)) {
    return (
      <p className="flex items-start gap-3 rounded-control bg-canvas p-3 text-ink-muted">
        <LogIn aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        {t('arrival.opensAt', { time: time(b.checkInOpensAt) })}
      </p>
    )
  }

  const late = leaving && now > Date.parse(b.overtimeStartsAt)
  const submit = () => {
    if (photos.length < CHECK_PHOTOS_MIN) {
      setProblem(t('errors.code.check_photos_required', { min: CHECK_PHOTOS_MIN }))
      return
    }
    setProblem(undefined)
    mutation.mutate(
      {
        bookingId: b.id,
        step: arriving ? 'check-in' : 'check-out',
        photoKeys: photos.map((p) => p.key),
      },
      { onSuccess: () => setPhotos([]) },
    )
  }

  return (
    <section
      aria-labelledby="arrival-title"
      className="space-y-4 rounded-surface bg-surface p-5 ring-1 ring-line"
    >
      <h2 id="arrival-title" className="flex items-center gap-2 text-title font-semibold">
        <Camera aria-hidden className="size-5 text-primary" />
        {arriving ? t('arrival.inTitle') : t('arrival.outTitle')}
      </h2>
      <p className="text-ink-muted">{arriving ? t('arrival.inBody') : t('arrival.outBody')}</p>
      {leaving && b.checkedInAt && (
        <p className="text-caption text-ink-muted">
          {t('arrival.inUseSince', { time: time(b.checkedInAt) })}
        </p>
      )}
      {leaving && (
        <p
          role={late ? 'alert' : undefined}
          className={
            late
              ? 'rounded-control bg-warning-50 p-3 font-medium text-warning-700'
              : 'text-caption text-ink-muted'
          }
        >
          {late
            ? t('arrival.lateNow', { price: money(b.overtimeHourCents) })
            : t('arrival.leaveBy', {
                time: time(b.overtimeStartsAt),
                price: money(b.overtimeHourCents),
              })}
        </p>
      )}

      <PhotoUploader
        photos={photos}
        onChange={(next) => {
          setPhotos(next)
          setProblem(undefined)
        }}
        min={CHECK_PHOTOS_MIN}
        max={CHECK_PHOTOS_MAX}
        showCover={false}
        error={problem}
      />

      {mutation.error && (
        <p role="alert" className="rounded-control bg-danger-50 p-3 font-medium text-danger-600">
          {errorMessage(t, mutation.error)}
        </p>
      )}

      <Button block loading={mutation.isPending} onClick={submit}>
        {arriving ? (
          <LogIn aria-hidden className="size-5" />
        ) : (
          <LogOut aria-hidden className="size-5" />
        )}
        {arriving ? t('arrival.inCta') : t('arrival.outCta')}
      </Button>
    </section>
  )
}
