import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthError } from '@supabase/supabase-js'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useSession } from './useSession'

// Must match `otp_length` in supabase/config.toml and the cloud project's Email OTP length.
const OTP_LENGTH = 6

const emailSchema = z.object({ email: z.email('Ingresa un email válido') })
type EmailForm = z.infer<typeof emailSchema>

export function LoginPage() {
  const state = useSession()
  const location = useLocation()
  const [email, setEmail] = useState<string | null>(null)

  if (state.status === 'ready' && state.session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src="/logo.svg" alt="" className="size-16 rounded-2xl shadow-md" />
        <h1 className="text-2xl font-bold">Coffee Log</h1>
      </div>
      {email ? (
        <CodeStep email={email} onChangeEmail={() => setEmail(null)} />
      ) : (
        <EmailStep onSent={setEmail} />
      )}
    </main>
  )
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(describeAuthError(error))
    else onSent(email)
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="tu@email.com"
          className="h-12 text-base"
          {...form.register('email')}
        />
        <FieldError message={form.formState.errors.email?.message ?? error} />
      </div>
      <Button type="submit" size="lg" className="h-12 text-base" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Enviando…' : 'Enviarme un código'}
      </Button>
    </form>
  )
}

function CodeStep({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)

  async function verify(token: string) {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    setBusy(false)
    if (error) {
      setError(describeAuthError(error))
      setCode('')
      return
    }
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    navigate(from, { replace: true })
  }

  async function resend() {
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setError(describeAuthError(error))
    else setResent(true)
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="text-sm text-muted-foreground">
        Te enviamos un código de {OTP_LENGTH} dígitos a <strong className="text-foreground">{email}</strong>
      </p>
      <InputOTP
        maxLength={OTP_LENGTH}
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={busy}
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="^[0-9]+$"
      >
        <InputOTPGroup>
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <InputOTPSlot key={i} index={i} className="size-12 text-lg" />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <FieldError message={error} />
      {busy && <p className="text-sm text-muted-foreground">Verificando…</p>}
      <div className="flex gap-2">
        <Button variant="ghost" onClick={onChangeEmail}>
          Cambiar email
        </Button>
        <Button variant="ghost" onClick={resend} disabled={resent}>
          {resent ? 'Código reenviado' : 'Reenviar código'}
        </Button>
      </div>
    </div>
  )
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}

function describeAuthError(error: AuthError): string {
  switch (error.code) {
    case 'otp_expired':
      return 'El código es incorrecto o expiró. Intenta de nuevo.'
    case 'signup_disabled':
    case 'otp_disabled':
      return 'Este email no tiene acceso a la app.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Demasiados intentos. Espera un momento y vuelve a intentar.'
    default:
      // Surface the raw message so misconfigurations (wrong URL, SMTP) are diagnosable on the phone.
      return `Algo salió mal (${error.message}). Intenta de nuevo.`
  }
}
