import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LatLng } from '../../api/types'
import type { DraftPhoto } from '../../features/host/draft'
import { PhotoUploader } from '../../features/host/PhotoUploader'
import { PinPicker } from '../../features/host/PinPicker'
import { Section, Subsection } from '../Section'
import { sampleVenue } from '../samples'

export function HostSection() {
  const { t } = useTranslation()
  const venue = useMemo(() => sampleVenue(t('samples.venue')), [t])
  const [pin, setPin] = useState<LatLng | null>(null)
  const [photos, setPhotos] = useState<DraftPhoto[]>([])

  return (
    <Section id="host" title={t('styleguide.host.title')} intro={t('styleguide.host.intro')}>
      <div className="grid gap-8 lg:grid-cols-2">
        <Subsection title={t('styleguide.host.pin')}>
          <p className="text-caption text-ink-muted">{t('styleguide.host.pinIntro')}</p>
          <PinPicker venue={venue} value={pin} onChange={setPin} />
        </Subsection>
        <Subsection title={t('styleguide.host.photos')}>
          <p className="text-caption text-ink-muted">{t('styleguide.host.photosIntro')}</p>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </Subsection>
      </div>
    </Section>
  )
}
