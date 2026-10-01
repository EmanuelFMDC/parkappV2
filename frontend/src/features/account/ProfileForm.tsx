import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Input } from '../../components/ui'
import { utcToLocalParts } from '../../lib/time'
import { toFormError } from './fieldErrors'
import { useUpdateProfile } from './hooks'

/** Personal data and privacy consent. Validation lives on the server; this form just shows what it says. */
export function ProfileForm() {
  const { t } = useTranslation()
  const save = useUpdateProfile()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const error = toFormError(t, save.error)
  const err = (field: string) => (error?.field === field ? error.message : undefined)
  const formLevel = error && !error.field ? error.message : undefined
  const today = utcToLocalParts(new Date().toISOString()).date

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate({ firstName, lastName, birthDate, email, acceptPrivacy })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-ink-muted">{t('account.profile.intro')}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label={t('account.profile.firstName')}
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={err('name')}
        />
        <Input
          label={t('account.profile.lastName')}
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <p className="-mt-3 text-caption text-ink-muted">{t('account.profile.legalHint')}</p>

      <Input
        label={t('account.profile.birthDate')}
        hint={t('account.profile.birthHint')}
        type="date"
        max={today}
        autoComplete="bday"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        error={err('birthDate')}
      />
      <Input
        label={t('account.profile.email')}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={err('email')}
      />

      <section className="space-y-3 rounded-surface bg-primary-soft p-4">
        <p className="text-caption text-signal-800">{t('account.profile.privacyNote')}</p>
        <Checkbox
          label={t('account.profile.consent')}
          checked={acceptPrivacy}
          onChange={(e) => setAcceptPrivacy(e.target.checked)}
          error={err('consent')}
        />
      </section>

      {formLevel && (
        <p role="alert" className="rounded-control bg-danger-50 p-4 font-medium text-danger-600">
          {formLevel}
        </p>
      )}
      <Button type="submit" block loading={save.isPending}>
        {t('account.profile.save')}
      </Button>
    </form>
  )
}
