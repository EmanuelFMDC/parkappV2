import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { Button, EmptyState, TopBar } from '../components/ui'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <>
      <TopBar title={t('notFound.title')} />
      <Page>
        <EmptyState
          icon={<Compass className="size-6" />}
          title={t('notFound.title')}
          body={t('notFound.body')}
          action={<Button onClick={() => navigate('/')}>{t('notFound.home')}</Button>}
        />
      </Page>
    </>
  )
}
