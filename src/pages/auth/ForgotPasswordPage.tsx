import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function ForgotPasswordPage() {
  useDocumentMeta({ title: 'Reset your password', noindex: true })
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const { error } = await requestPasswordReset(email)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setSent(true)
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-2xl font-semibold text-ink-950">Reset your password</h1>
      {sent ? (
        <Alert tone="success" title="Check your email">
          If an account exists for {email}, we've sent a link to reset your password.
        </Alert>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input label="Email address" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" variant="primary" fullWidth loading={submitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-ink-600 underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
