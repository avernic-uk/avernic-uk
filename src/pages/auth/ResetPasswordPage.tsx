import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

/**
 * Reached via the link in the password reset email (Supabase redirects here
 * with a recovery token already exchanged into a session by the client SDK).
 */
export default function ResetPasswordPage() {
  useDocumentMeta({ title: 'Set a new password' })
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/account')
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="text-2xl font-semibold text-ink-950">Set a new password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" variant="primary" fullWidth loading={submitting}>
          Update password
        </Button>
      </form>
    </div>
  )
}
