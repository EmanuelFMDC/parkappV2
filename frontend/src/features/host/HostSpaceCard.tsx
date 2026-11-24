import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { HostSpace } from '../../api/types'
import { Button, ConfirmDialog, SpaceImage } from '../../components/ui'
import type { Availability } from '../../lib/availability'
import { errorMessage } from '../../lib/errors'
import { formatDistance } from '../../lib/distance'
import { formatCents } from '../../lib/money'
import { AvailabilityField } from './AvailabilityField'
import { useUpdateHostSpace } from './hooks'
import { scheduleText } from './scheduleText'
import { SpaceStatusBadge } from './SpaceStatusBadge'

/** One of the host's spaces, with what they can do to it in its current state. */
export function HostSpaceCard({ space }: { space: HostSpace }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const update = useUpdateHostSpace()
  const live = space.status === 'active' || space.status === 'paused'
  // The schedule being edited in the dialog; undefined while the dialog is closed.
  const [editing, setEditing] = useState<Availability | null | undefined>(undefined)

  return (
    <article className="overflow-hidden rounded-surface bg-surface ring-1 ring-line sm:flex">
      <SpaceImage
        url={space.photoUrls[0]}
        className={`aspect-[4/3] w-full sm:w-48 sm:shrink-0 ${space.status === 'paused' ? 'grayscale' : ''}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-body font-semibold leading-snug">{space.title}</h3>
          <SpaceStatusBadge status={space.status} />
        </div>
        <p className="text-caption text-ink-muted">
          {space.street}, {space.municipality}
        </p>
        <p className="text-caption text-ink-muted">
          {t('host.space.nearVenue', {
            distance: formatDistance(space.distanceM, lang),
            venue: space.venue.name,
          })}
        </p>
        <p className="flex items-center gap-2 text-caption text-ink-muted">
          <CalendarClock aria-hidden className="size-4 shrink-0 text-primary" />
          {t('host.space.spots', { count: space.quantity })} ·{' '}
          {scheduleText(t, lang, space.availability)}
        </p>
        {/* ParkApp sets the price from the zone; the host sees what they earn. */}
        <div>
          <p className="font-display text-title font-bold tabular-nums">
            {t('host.space.earnPerHour', { amount: formatCents(space.priceCentsPerHour, lang) })}
          </p>
          {space.zoneSurchargeCents > 0 && (
            <p className="text-caption text-ink-muted">
              {t('host.space.surchargeNote', {
                amount: formatCents(space.zoneSurchargeCents, lang),
              })}
            </p>
          )}
        </div>

        {space.status === 'pending_review' && (
          <p className="rounded-control bg-warning-50 p-3 text-caption text-warning-700">
            {t('host.space.pendingNote')}
          </p>
        )}
        {space.status === 'paused' && (
          <p className="rounded-control bg-canvas p-3 text-caption text-ink-muted">
            {t('host.space.pausedNote')}
          </p>
        )}
        {space.status === 'rejected' && (
          <p role="alert" className="rounded-control bg-danger-50 p-3 text-caption text-danger-600">
            {t('host.space.rejectedNote', { note: space.reviewNote ?? '' })}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {live && (
            <Button
              variant="secondary"
              size="md"
              loading={update.isPending}
              onClick={() =>
                update.mutate({
                  spaceId: space.id,
                  patch: { status: space.status === 'active' ? 'paused' : 'active' },
                })
              }
            >
              {space.status === 'active' ? t('host.space.pause') : t('host.space.resume')}
            </Button>
          )}
          {space.status !== 'rejected' && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                update.reset()
                setEditing(space.availability)
              }}
            >
              {t('host.availability.change')}
            </Button>
          )}
          {space.status === 'rejected' && (
            <Link
              to="/host/new/location"
              className="inline-flex h-touch items-center rounded-control px-4 font-semibold text-primary hover:bg-primary-soft"
            >
              {t('host.space.republish')}
            </Link>
          )}
        </div>
        {update.error && editing === undefined && (
          <p role="alert" className="text-caption font-medium text-danger-600">
            {errorMessage(t, update.error)}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={editing !== undefined}
        busy={update.isPending}
        title={t('host.availability.change')}
        confirmLabel={t('host.availability.save')}
        cancelLabel={t('host.availability.cancel')}
        onCancel={() => setEditing(undefined)}
        onConfirm={() =>
          update.mutate(
            { spaceId: space.id, patch: { availability: editing ?? null } },
            { onSuccess: () => setEditing(undefined) },
          )
        }
        body={
          editing !== undefined && (
            <AvailabilityField
              value={editing}
              onChange={setEditing}
              error={update.error ? errorMessage(t, update.error) : undefined}
            />
          )
        }
      />
    </article>
  )
}
