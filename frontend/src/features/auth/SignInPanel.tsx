import { Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from '../../components/ui'
import { useAuth } from './context'

const digitsOnly = (value: string) => value.replace(/\D/g, '')

interface SignInPanelProps {
  title?: string
  /** Render only the form: the page around it already has its own heading and card. */
  bare?: boolean
}

/** Phone + code sign-in, or Google. Once there is a session the account state takes over. */
export function SignInPanel({ title, bare }: SignInPanelProps) {
  const { t } = useTranslation()
  const auth = useAuth()
  const [phone, setPhone] = useState('')
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(undefined)
    try {
      await action()
    } catch {
      setError(t('auth.invalidCode'))
    } finally {
      setBusy(false)
    }
  }

  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    if (digitsOnly(phone).length !== 10) {
      setError(t('auth.invalidPhone'))
      return
    }
    void run(async () => setVerificationId(await auth.requestCode(digitsOnly(phone))))
  }

  const verify = (e: FormEvent) => {
    e.preventDefault()
    if (!verificationId) return
    void run(() => auth.confirmCode(verificationId, code.trim()))
  }

  const body = (
    <>
      {!verificationId ? (
        <form onSubmit={sendCode} noValidate className="space-y-4">
          <Input
            label={t('auth.phone')}
            hint={t('auth.phoneHint')}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={t('auth.phonePlaceholder')}
            icon={<Phone className="size-5" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={error}
          />
          <Button type="submit" variant="brand" block loading={busy}>
            {t('auth.sendCode')}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="space-y-4">
          <Input
            label={t('auth.code')}
            hint={t('auth.codeHint')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(digitsOnly(e.target.value))}
            error={error}
          />
          <Button type="submit" variant="brand" block loading={busy}>
            {t('auth.verify')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setVerificationId(null)
              setCode('')
              setError(undefined)
            }}
          >
            {t('auth.changePhone')}
          </Button>
        </form>
      )}

      <div className="flex items-center gap-3 text-caption text-ink-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        {t('auth.or')}
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" block onClick={() => void run(() => auth.signInWithGoogle())}>
        {t('auth.google')}
      </Button>
    </>
  )

  if (bare) return <div className="space-y-4">{body}</div>

  return (
    <section
      aria-labelledby="signin-title"
      className="space-y-4 rounded-surface bg-surface p-5 ring-1 ring-line"
    >
      <h2 id="signin-title" className="text-title font-semibold">
        {title ?? t('auth.title')}
      </h2>
      {body}
    </section>
  )
}
