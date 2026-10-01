import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { HostSpace } from '../../api/types'
import { Button, ConfirmDialog, Input, SpaceImage } from '../../components/ui'
import { errorMessage } from '../../lib/errors'
import { formatDistance } from '../../lib/distance'
import { PRICE_MAX_CENTS, PRICE_MIN_CENTS } from '../../lib/hostRules'
import { formatCents, parsePesosToCents } from '../../lib/money'
import { useUpdateHostSpace } from './hooks'
import { SpaceStatusBadge } from './SpaceStatusBadge'

/** One of the host's spaces, with what they can do to it in its current state. */
export function HostSpaceCard({ space }: { space: HostSpace }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const update = useUpdateHostSpace()
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState('')
  const [priceError, setPriceError] = useState<string>()
  const live = space.status === 'active' || space.status === 'paused'

  const openPrice = () => {
    setPrice(String(space.priceCentsPerHour / 100))
    setPriceError(undefined)
    update.reset()
    setEditing(true)
  }
  const savePrice = () => {
    const cents = parsePesosToCents(price)
    if (cents === null || cents < PRICE_MIN_CENTS || cents > PRICE_MAX_CENTS) {
      setPriceError(t('errors.code.invalid_price'))
      return
    }
    update.mutate(
      { spaceId: space.id, patch: { priceCentsPerHour: cents } },
      { onSuccess: () => setEditing(false) },
    )
  }

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
        <p className="font-display text-title font-bold tabular-nums">
          {formatCents(space.priceCentsPerHour, lang)}{' '}
          <span className="font-sans text-caption font-normal text-ink-muted">
            {t('ui.perHour')}
          </span>
        </p>

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
            <>
              <Button
                variant="secondary"
                size="md"
                loading={update.isPending && !editing}
                onClick={() =>
                  update.mutate({
                    spaceId: space.id,
                    patch: { status: space.status === 'active' ? 'paused' : 'active' },
                  })
                }
              >
                {space.status === 'active' ? t('host.space.pause') : t('host.space.resume')}
              </Button>
              <Button variant="ghost" size="md" onClick={openPrice}>
                {t('host.space.changePrice')}
              </Button>
            </>
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
        {update.error && !editing && (
          <p role="alert" className="text-caption font-medium text-danger-600">
            {errorMessage(t, update.error)}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={editing}
        busy={update.isPending}
        title={t('host.space.priceTitle')}
        confirmLabel={t('host.space.priceSave')}
        cancelLabel={t('host.space.cancel')}
        onCancel={() => setEditing(false)}
        onConfirm={savePrice}
        body={
          <Input
            label={t('host.space.priceLabel')}
            inputMode="decimal"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value)
              setPriceError(undefined)
            }}
            error={priceError ?? (update.error ? errorMessage(t, update.error) : undefined)}
          />
        }
      />
    </article>
  )
}
