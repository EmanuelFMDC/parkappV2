import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Input, Textarea } from '../../components/ui'
import { HostStepFrame } from '../../features/host/HostStepFrame'
import { stepPath, useStepGuard } from '../../features/host/steps'
import { useHostDraft } from '../../features/host/draft'
import { PhotoUploader } from '../../features/host/PhotoUploader'
import { validatePhotos, type FieldProblem } from '../../features/host/validate'
import { DESCRIPTION_MAX, TITLE_MAX, TITLE_MIN } from '../../lib/hostRules'

/** Step 3 of 4 for hosts: photos, a title and a short description. */
export default function PhotosStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, patch } = useHostDraft()
  const guard = useStepGuard('photos', draft)
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const err = (field: string) =>
    problem?.field === field ? t(`errors.code.${problem.code}`) : undefined

  if (guard) return <>{guard}</>

  const change = (changes: Parameters<typeof patch>[0]) => {
    setProblem(null)
    patch(changes)
  }
  const next = () => {
    const found = validatePhotos(draft)
    setProblem(found)
    if (!found) navigate(stepPath('price'))
  }

  return (
    <HostStepFrame
      step="photos"
      title={t('host.photos.title')}
      intro={t('host.photos.intro')}
      onNext={next}
      nextLabel={t('host.next')}
    >
      <PhotoUploader
        photos={draft.photos}
        onChange={(photos) => change({ photos })}
        error={err('photos')}
      />
      <Input
        label={t('host.photos.titleLabel')}
        hint={t('host.photos.titleHint', { min: TITLE_MIN, max: TITLE_MAX })}
        maxLength={TITLE_MAX + 20}
        value={draft.title}
        error={err('title')}
        onChange={(e) => change({ title: e.target.value })}
      />
      <Textarea
        label={t('host.photos.descriptionLabel')}
        hint={t('host.photos.descriptionHint')}
        value={draft.description}
        counter={{ current: draft.description.length, max: DESCRIPTION_MAX }}
        error={err('description')}
        onChange={(e) => change({ description: e.target.value })}
      />
    </HostStepFrame>
  )
}
