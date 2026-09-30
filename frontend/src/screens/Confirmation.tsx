import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { TicketStub } from '../components/TicketStub'
import { Button } from '../components/ui'
import { getLot } from '../data/lots'
import { useSession } from '../lib/session'

export default function Confirmation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session } = useSession()
  const lot = getLot(session?.lotId)

  if (!session || !lot) return <Navigate to="/" replace />

  return (
    <div className="space-y-6 px-4 pt-8">
      <header className="space-y-2">
        <CheckCircle2 className="size-10 text-success-600" aria-hidden />
        <h1 className="text-headline font-bold" role="status">
          {t('ticket.confirmedTitle')}
        </h1>
        <p className="max-w-[34ch] text-ink-muted">{t('ticket.confirmedBody')}</p>
      </header>

      <TicketStub session={session} lot={lot} />

      <div className="space-y-3">
        <Button block onClick={() => navigate('/spot')}>
          {t('ticket.viewSession')}
        </Button>
        <Link
          to="/"
          className="flex h-11 items-center justify-center font-semibold text-primary underline underline-offset-4"
        >
          {t('ticket.backToMap')}
        </Link>
      </div>
    </div>
  )
}
