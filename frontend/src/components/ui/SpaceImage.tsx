import { SpacePhoto, type PhotoTone } from './SpacePhoto'

const PLACEHOLDER = 'placeholder://'
const TONES: PhotoTone[] = ['day', 'dusk', 'night']

interface SpaceImageProps {
  /** `photoUrls[0]` from the API. `placeholder://<tone>` renders the illustration; anything else is a real photo. */
  url: string | null | undefined
  alt?: string
  className?: string
}

export function SpaceImage({ url, alt, className }: SpaceImageProps) {
  if (!url || url.startsWith(PLACEHOLDER)) {
    const tone = url?.slice(PLACEHOLDER.length) as PhotoTone
    return (
      <SpacePhoto tone={TONES.includes(tone) ? tone : 'day'} label={alt} className={className} />
    )
  }
  return <img src={url} alt={alt ?? ''} loading="lazy" className={className} />
}
