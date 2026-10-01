import { useTranslation } from 'react-i18next'
import { Page } from '../../components/layout/Page'
import { Button, Segmented, TopBar } from '../../components/ui'
import { useAuth } from '../../features/auth/context'
import { useUpdateLanguage } from '../../features/auth/hooks'
import { SignInPanel } from '../../features/auth/SignInPanel'
import { languages, toSupportedLanguage, type Language } from '../../i18n'

const names: Record<Language, string> = { 'es-MX': 'Español (México)', en: 'English' }

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const updateLanguage = useUpdateLanguage()
  const current = toSupportedLanguage(i18n.resolvedLanguage ?? '')

  const changeLanguage = (language: Language) => {
    void i18n.changeLanguage(language)
    if (user) updateLanguage.mutate(language)
  }

  return (
    <>
      <TopBar title={t('profile.title')} />
      <Page className="space-y-8">
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
          {user ? (
            <>
              <p className="text-ink-muted">
                {t('profile.signedInAs', { who: user.phone ?? user.displayName ?? user.id })}
              </p>
              <Button variant="secondary" onClick={() => void signOut()}>
                {t('auth.signOut')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-ink-muted">{t('profile.signedOut')}</p>
              <SignInPanel />
            </>
          )}
        </section>
      </Page>
    </>
  )
}
