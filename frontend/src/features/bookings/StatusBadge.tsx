import { useTranslation } from 'react-i18next'
import type { BookingStatus } from '../../api/types'
import { Badge, type BadgeTone } from '../../components/ui'

const tones: Record<BookingStatus, BadgeTone> = {
  pending_payment: 'warning',
  confirmed: 'success',
  cancelled: 'neutral',
  expired: 'neutral',
  completed: 'brand',
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation()
  return <Badge tone={tones[status]}>{t(`bookings.status.${status}`)}</Badge>
}
