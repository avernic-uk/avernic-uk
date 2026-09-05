import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function LoginPage() {
  useDocumentMeta({ title: 'Log in', description: 'Log in to your Avernic UK account to view orders and saved details.', noindex: true })
  const { signInWithPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const { error } = await signInWithPassword(email, password)
    setSubmitting(false)
    if (error) {
      setError('Incorrect email or password. Please try again.')
      return
    }
    navigate(location.state?.from?.pathname ?? '/account')
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-2xl font-semibold text-ink-950">Log in</h1>
      <p className="mt-2 text-sm text-ink-600">
        New to Avernic UK?{' '}
        <Link to="/register" className="font-medium text-ink-900 underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input label="Email address" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" variant="primary" fullWidth loading={submitting}>
          Log in
        </Button>
        <p className="text-center text-sm">
          <Link to="/forgot-password" className="text-ink-600 underline">
            Forgotten your password?
          </Link>
        </p>
      </form>
    </div>
  )
}
