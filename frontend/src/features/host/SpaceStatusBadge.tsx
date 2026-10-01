import { useTranslation } from 'react-i18next'
import type { SpaceStatus } from '../../api/types'
import { Badge, type BadgeTone } from '../../components/ui'

const tones: Record<SpaceStatus, BadgeTone> = {
  pending_review: 'warning',
  active: 'success',
  paused: 'neutral',
  rejected: 'danger',
}

export function SpaceStatusBadge({ status }: { status: SpaceStatus }) {
  const { t } = useTranslation()
  return <Badge tone={tones[status]}>{t(`host.space.status.${status}`)}</Badge>
}
