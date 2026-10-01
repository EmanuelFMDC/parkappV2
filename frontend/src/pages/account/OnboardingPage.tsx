import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Skeleton, StepIndicator, TopBar } from '../../components/ui'
import { useAccount } from '../../features/account/hooks'
import { IdentityStep } from '../../features/account/IdentityStep'
import { ProfileForm } from '../../features/account/ProfileForm'
import { safeNext, type AccountStage, type Role } from '../../features/account/stage'
import { VehicleForm } from '../../features/account/VehicleForm'
import { SignInPanel } from '../../features/auth/SignInPanel'

/** Drivers register a car; hosts do not, so their account has one step fewer. */
const ORDER: Record<Role, Exclude<AccountStage, 'ready'>[]> = {
  driver: ['signed_out', 'profile', 'vehicle', 'identity'],
  host: ['signed_out', 'profile', 'identity'],
}

/**
 * Creating an account, in order: phone, personal data, vehicle (drivers only), identity. It resumes
 * at the first thing still missing, and when everything is done it returns to where the person
 * was going. `?as=host` is for people who want to publish a space.
 */
export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const role: Role = params.get('as') === 'host' ? 'host' : 'driver'
  const { stage, loading } = useAccount(role)

  useEffect(() => {
    if (stage === 'ready') navigate(next, { replace: true })
  }, [stage, next, navigate])

  const order = ORDER[role]
  const names = order.map((s) => t(`account.steps.${s === 'signed_out' ? 'phone' : s}`))
  const current = stage === 'ready' ? order.length : order.indexOf(stage) + 1
  const titles: Record<Exclude<AccountStage, 'ready'>, string> = {
    signed_out: t('account.phoneTitle'),
    profile: t('account.profile.title'),
    vehicle: t('account.vehicle.title'),
    identity: t('account.identity.title'),
  }

  return (
    <>
      <TopBar title={t('account.title')} onBack={() => navigate(-1)} />
      <Page className="@container space-y-6">
        <StepIndicator steps={names} current={current} />
        <p className="text-caption text-ink-muted">
          {t(role === 'host' ? 'account.hostWhy' : 'account.why')}
        </p>

        {loading || stage === 'ready' ? (
          <div role="status" aria-label={t('common.loading')} className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <section aria-labelledby="stage-title" className="space-y-4">
            <h2 id="stage-title" className="text-headline font-bold">
              {titles[stage]}
            </h2>
            {stage === 'signed_out' && <SignInPanel title={t('account.phoneTitle')} bare />}
            {stage === 'profile' && <ProfileForm />}
            {stage === 'vehicle' && (
              <>
                <p className="text-ink-muted">{t('account.vehicle.intro')}</p>
                <VehicleForm />
              </>
            )}
            {stage === 'identity' && <IdentityStep />}
          </section>
        )}
      </Page>
    </>
  )
}
