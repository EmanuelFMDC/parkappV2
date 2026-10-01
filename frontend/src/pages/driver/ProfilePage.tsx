import { BadgeCheck, CarFront, Trash2, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Badge, Button, IconButton, Segmented, TopBar } from '../../components/ui'
import { useAccount, useRemoveVehicle } from '../../features/account/hooks'
import { VehicleForm } from '../../features/account/VehicleForm'
import { describeVehicle } from '../../features/account/vehicleFit'
import { useAuth } from '../../features/auth/context'
import { useUpdateLanguage } from '../../features/auth/hooks'
import { languages, toSupportedLanguage, type Language } from '../../i18n'
import { HOME_OF, PROFILE_OF, useMode } from '../../lib/mode'

const names: Record<Language, string> = { 'es-MX': 'Español (México)', en: 'English' }

/**
 * The profile is the same in both modes (one account), reached from each mode's bar. It is also
 * where someone switches mode. Cars only matter when looking for a spot, so host mode hides them.
 */
export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const mode = useMode()
  const { user, signOut } = useAuth()
  const { stage, me } = useAccount(mode)
  const updateLanguage = useUpdateLanguage()
  const removeVehicle = useRemoveVehicle()
  const [adding, setAdding] = useState(false)
  const current = toSupportedLanguage(i18n.resolvedLanguage ?? '')

  const changeLanguage = (language: Language) => {
    void i18n.changeLanguage(language)
    if (user) updateLanguage.mutate(language)
  }
  const createAccount = () =>
    navigate(
      `/account/new?next=${encodeURIComponent(PROFILE_OF[mode])}${mode === 'host' ? '&as=host' : ''}`,
    )

  return (
    <>
      <TopBar title={t('profile.title')} />
      <Page className="space-y-8">
        {/* In host mode the banner already offers the way back on every screen, so no second button. */}
        {mode === 'driver' && (
          <section
            aria-labelledby="mode-title"
            className="space-y-3 rounded-surface bg-surface p-5 ring-1 ring-line"
          >
            <h2 id="mode-title" className="flex items-center gap-2 text-title font-semibold">
              <Warehouse aria-hidden className="size-6 text-primary" />
              {t('mode.profileHostTitle')}
            </h2>
            <p className="text-ink-muted">{t('mode.profileHostBody')}</p>
            <Button variant="brand" onClick={() => navigate(HOME_OF.host)}>
              {t('mode.switchToHost')}
            </Button>
          </section>
        )}

        <Segmented
          label={t('profile.language')}
          value={current}
          onChange={changeLanguage}
          options={languages.map((l) => ({ value: l, label: names[l], lang: l }))}
        />

        <section aria-labelledby="account-title" className="space-y-3">
          <h2 id="account-title" className="text-title font-semibold">
            {t('profile.account')}
          </h2>

          {!user ? (
            <>
              <p className="text-ink-muted">{t('profile.signedOut')}</p>
              <Button onClick={createAccount}>{t('account.create')}</Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-title font-semibold">
                  {me?.firstName ? `${me.firstName} ${me.lastName}` : (me?.phone ?? '')}
                </p>
                {me?.identityStatus === 'verified' ? (
                  <Badge tone="success" icon={<BadgeCheck className="size-3.5" />}>
                    {t('profile.identity.verified')}
                  </Badge>
                ) : (
                  <Badge tone="warning">
                    {t(`profile.identity.${me?.identityStatus ?? 'not_started'}`)}
                  </Badge>
                )}
              </div>
              {me?.email && <p className="text-ink-muted">{me.email}</p>}
              {me?.phone && <p className="text-ink-muted">{me.phone}</p>}

              <div className="flex flex-wrap gap-3">
                {stage !== 'ready' && (
                  <Button onClick={createAccount}>{t('profile.complete')}</Button>
                )}
                <Button variant="secondary" onClick={() => void signOut()}>
                  {t('auth.signOut')}
                </Button>
              </div>
            </>
          )}
        </section>

        {mode === 'driver' && user && me && (
          <section aria-labelledby="vehicles-title" className="space-y-3">
            <h2 id="vehicles-title" className="text-title font-semibold">
              {t('profile.vehicles')}
            </h2>
            {me.vehicles.length === 0 ? (
              <p className="text-ink-muted">{t('profile.noVehicles')}</p>
            ) : (
              <ul className="divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
                {me.vehicles.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 p-4">
                    <CarFront aria-hidden className="size-6 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{describeVehicle(v)}</p>
                      <p className="text-caption text-ink-muted">{t(`vehicles.${v.type}`)}</p>
                    </div>
                    <IconButton
                      label={t('profile.removeVehicle', { plate: v.plate })}
                      icon={<Trash2 />}
                      onClick={() => removeVehicle.mutate(v.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {adding ? (
              <div className="space-y-4 rounded-surface bg-surface p-5 ring-1 ring-line">
                <VehicleForm
                  submitLabel={t('profile.addVehicle')}
                  onSaved={() => setAdding(false)}
                />
                <Button variant="ghost" size="md" onClick={() => setAdding(false)}>
                  {t('profile.cancelAdd')}
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setAdding(true)}>
                {t('profile.addVehicle')}
              </Button>
            )}
          </section>
        )}
      </Page>
    </>
  )
}
