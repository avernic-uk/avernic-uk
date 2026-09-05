import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function RegisterPage() {
  useDocumentMeta({ title: 'Create an account', description: 'Create an Avernic UK account for faster checkout and order tracking.', noindex: true })
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await signUp(email, password, fullName)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/account')
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-2xl font-semibold text-ink-950">Create an account</h1>
      <p className="mt-2 text-sm text-ink-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ink-900 underline">
          Log in
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="Full name" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email address" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" variant="primary" fullWidth loading={submitting}>
          Create account
        </Button>
        <p className="text-xs text-ink-500">
          By creating an account you agree to our{' '}
          <Link to="/terms" className="underline">
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  )
}
