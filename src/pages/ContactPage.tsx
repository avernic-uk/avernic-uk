import { useState, type FormEvent } from 'react'
import { InfoPageLayout, Placeholder } from '@/components/layout/InfoPageLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, company }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error ?? 'Something went wrong sending your message.')
        setStatus('error')
        return
      }
      setStatus('sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setErrorMessage('We could not reach the server. Please try again.')
      setStatus('error')
    }
  }

  return (
    <InfoPageLayout title="Contact us" description="Get in touch with Avernic UK.">
      <p>
        Registered business address: <Placeholder>registered business address</Placeholder>
        <br />
        Customer service email: <Placeholder>customer service email</Placeholder>
        <br />
        Customer service telephone: <Placeholder>customer service telephone number</Placeholder>
      </p>

      {status === 'sent' ? (
        <Alert tone="success" title="Message sent">
          Thanks for getting in touch — we'll reply as soon as we can.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="max-w-lg space-y-4">
          {/* Honeypot field, hidden from real users */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>

          <Input label="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink-800">
              Message <span className="text-accent-600">*</span>
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-ink-300 bg-white p-3.5 text-sm text-ink-900 focus-visible:outline-2 focus-visible:outline-accent-500"
            />
          </div>
          {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
          <Button type="submit" variant="primary" loading={status === 'submitting'}>
            Send message
          </Button>
        </form>
      )}
    </InfoPageLayout>
  )
}
