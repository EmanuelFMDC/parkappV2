import { ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, IconButton, SpacePhoto } from '../../components/ui'
import { PHOTO_MAX_BYTES, PHOTO_TYPES, PHOTOS_MAX, PHOTOS_MIN } from '../../lib/hostRules'
import { useServices } from '../../services/context'
import type { DraftPhoto } from './draft'

/** Local previews of this session's uploads. They cannot survive a reload, so those show an illustration. */
const previews = new Map<string, string>()

interface PhotoUploaderProps {
  photos: DraftPhoto[]
  onChange: (photos: DraftPhoto[]) => void
  error?: string
}

/**
 * Picks photos, checks type and size, and uploads each one through the storage service
 * (signed URLs in production). The first photo is the cover.
 */
export function PhotoUploader({ photos, onChange, error }: PhotoUploaderProps) {
  const { t } = useTranslation()
  const { storage } = useServices()
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [problems, setProblems] = useState<string[]>([])
  // Photos finish at different times; keep the list we are building in a ref so none is lost.
  const current = useRef(photos)
  useEffect(() => {
    current.current = photos
  }, [photos])

  const add = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = '' // lets the same file be picked again after removing it
    const found: string[] = []
    const room = PHOTOS_MAX - current.current.length
    const accepted: File[] = []
    for (const file of files) {
      if (!PHOTO_TYPES.includes(file.type))
        found.push(t('host.photos.badType', { name: file.name }))
      else if (file.size > PHOTO_MAX_BYTES) found.push(t('host.photos.tooBig', { name: file.name }))
      else if (accepted.length >= room) {
        found.push(t('host.photos.tooMany', { max: PHOTOS_MAX }))
        break
      } else accepted.push(file)
    }
    setProblems(found)
    if (accepted.length === 0) return

    setUploading((n) => n + accepted.length)
    await Promise.all(
      accepted.map(async (file) => {
        try {
          const target = await storage.requestUploadUrl({
            filename: file.name,
            contentType: file.type,
          })
          await storage.upload(file, target)
          previews.set(target.objectKey, URL.createObjectURL(file))
          current.current = [...current.current, { key: target.objectKey, name: file.name }]
          onChange(current.current)
        } catch {
          setProblems((p) => [...p, t('host.photos.uploadFailed', { name: file.name })])
        } finally {
          setUploading((n) => n - 1)
        }
      }),
    )
  }

  const remove = (photo: DraftPhoto) => {
    const url = previews.get(photo.key)
    if (url) URL.revokeObjectURL(url)
    previews.delete(photo.key)
    current.current = current.current.filter((p) => p.key !== photo.key)
    onChange(current.current)
    setProblems([])
  }

  const full = photos.length >= PHOTOS_MAX

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">
          {t('host.photos.count', { count: photos.length, max: PHOTOS_MAX, min: PHOTOS_MIN })}
        </p>
        <label
          htmlFor={inputId}
          className={`inline-flex h-touch cursor-pointer items-center gap-2 rounded-control bg-surface px-4 font-semibold text-primary ring-1 ring-inset ring-control hover:bg-canvas has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${full ? 'pointer-events-none opacity-50' : ''}`}
        >
          <ImagePlus aria-hidden className="size-5" />
          {t('host.photos.add')}
          <input
            ref={input}
            id={inputId}
            type="file"
            accept={PHOTO_TYPES.join(',')}
            multiple
            disabled={full}
            onChange={(e) => void add(e)}
            className="sr-only"
          />
        </label>
      </div>

      {uploading > 0 && (
        <p role="status" className="text-caption text-ink-muted">
          {t('host.photos.uploading')}
        </p>
      )}

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, i) => {
            const preview = previews.get(photo.key)
            return (
              <li
                key={photo.key}
                className="relative overflow-hidden rounded-control ring-1 ring-line"
              >
                {preview ? (
                  <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <SpacePhoto
                    tone={(['day', 'dusk', 'night'] as const)[i % 3]}
                    className="aspect-[4/3] w-full"
                  />
                )}
                {i === 0 && (
                  <span className="absolute left-2 top-2">
                    <Badge tone="brand">{t('host.photos.cover')}</Badge>
                  </span>
                )}
                <span className="absolute right-1 top-1">
                  <IconButton
                    tone="raised"
                    label={t('host.photos.remove', { name: photo.name })}
                    icon={<Trash2 />}
                    onClick={() => remove(photo)}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {problems.map((problem) => (
        <p key={problem} role="alert" className="text-caption font-medium text-danger-600">
          {problem}
        </p>
      ))}
      {error && (
        <p role="alert" className="text-caption font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
