import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBasket } from '@/lib/basket/BasketProvider'
import { useAuth } from '@/lib/auth/AuthProvider'
import { formatGBP } from '@/lib/format'
import { isValidUKPostcode } from '@/lib/validation/postcode'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input, Checkbox } from '@/components/ui/Input'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps'
import { SecureCheckoutBadges } from '@/components/checkout/SecureCheckoutBadges'

interface FormState {
  fullName: string
  email: string
  telephone: string
  line1: string
  line2: string
  townCity: string
  county: string
  postcode: string
  termsAccepted: boolean
}

const initialState: FormState = {
  fullName: '',
  email: '',
  telephone: '',
  line1: '',
  line2: '',
  townCity: '',
  county: '',
  postcode: '',
  termsAccepted: false,
}

const sectionIcons = {
  user: (
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  pin: (
    <path
      d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  shield: (
    <path
      d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Zm-2.5 9 2 2 3.5-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
} as const

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof sectionIcons
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card dark:bg-ink-50 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-accent-600">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            {sectionIcons[icon]}
          </svg>
        </span>
        <h2 className="text-sm font-semibold text-ink-950">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function CheckoutPage() {
  useDocumentMeta({ title: 'Checkout', noindex: true })
  const { priced, lines, clear } = useBasket()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>({ ...initialState, email: user?.email ?? '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {}
    if (!form.fullName.trim()) errors.fullName = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.'
    if (form.telephone.replace(/\s+/g, '').length < 9) errors.telephone = 'Enter a valid UK telephone number.'
    if (!form.line1.trim()) errors.line1 = 'Enter your address.'
    if (!form.townCity.trim()) errors.townCity = 'Enter your town or city.'
    if (!isValidUKPostcode(form.postcode)) errors.postcode = 'Enter a valid UK postcode.'
    if (!form.termsAccepted) errors.termsAccepted = 'You must accept the Terms & Conditions to continue.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return // prevent double submission
    setSubmitError(null)
    if (!validate()) {
      // Bring the first invalid field into view — sections are stacked and
      // the error could be well below the fold on mobile.
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName: form.fullName, email: form.email, telephone: form.telephone },
          address: {
            line1: form.line1,
            line2: form.line2 || undefined,
            townCity: form.townCity,
            county: form.county || undefined,
            postcode: form.postcode,
          },
          lines,
          consent: { termsAccepted: form.termsAccepted },
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setSubmitError(data.error ?? 'Your basket has changed — please review it and try again.')
        return
      }
      if (!res.ok && res.status !== 502) {
        setSubmitError(data.error ?? 'We could not place your order. Please try again.')
        return
      }

      // Order was created either way (502 = order saved, Fena unavailable).
      window.sessionStorage.setItem('avernic_last_order', JSON.stringify({ orderNumber: data.orderNumber, email: form.email }))

      if (data.payment?.redirectUrl) {
        clear()
        window.location.href = data.payment.redirectUrl
        return
      }

      // Fena not available in this environment — still land on confirmation,
      // which will show the order as pending payment, and surface the message.
      clear()
      navigate(`/order-confirmation/${data.orderNumber}?notice=${encodeURIComponent(data.error ?? '')}`)
    } catch {
      setSubmitError('We could not reach the server. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!priced || priced.lines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">Your basket is empty</h1>
        <div className="mt-8">
          <ButtonLink to="/shop">Continue shopping</ButtonLink>
        </div>
      </div>
    )
  }

  const summary = (
    <>
      <ul className="space-y-4">
        {priced.lines.map((line) => (
          <li key={line.productId} className="flex gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50 dark:bg-ink-100">
              {line.imageUrl && <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />}
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-[10px] font-semibold text-white dark:bg-ink-950">
                {line.quantity}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-3">
              <span className="text-sm text-ink-700">{line.name}</span>
              <span className="whitespace-nowrap text-sm font-medium text-ink-950">{formatGBP(line.lineTotalMinor)}</span>
            </div>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2 border-t border-ink-200 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-600">Subtotal</dt>
          <dd className="text-ink-900">{formatGBP(priced.subtotalMinor)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-600">Delivery</dt>
          <dd className="text-ink-900">{priced.deliveryMinor === 0 ? 'Free' : formatGBP(priced.deliveryMinor)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink-200 pt-3 text-base font-semibold">
          <dt className="text-ink-950">Total</dt>
          <dd className="text-ink-950">{formatGBP(priced.totalMinor)}</dd>
        </div>
      </dl>
      <div className="mt-5 border-t border-ink-200 pt-4">
        <SecureCheckoutBadges />
      </div>
    </>
  )

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <CheckoutSteps current="checkout" />
      </div>
      <h1 className="mt-6 text-center font-display text-3xl font-semibold text-ink-950 sm:text-left">Checkout</h1>

      {/* Compact order total, visible only until the desktop summary card appears */}
      <details className="group mt-6 rounded-2xl border border-ink-200 bg-ink-50/60 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm">
          <span className="font-medium text-ink-900">
            Order summary <span className="text-ink-500">({priced.lines.length} item{priced.lines.length === 1 ? '' : 's'})</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="font-semibold text-ink-950">{formatGBP(priced.totalMinor)}</span>
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-ink-500 transition-transform group-open:rotate-180">
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </summary>
        <div className="border-t border-ink-200 p-4 pt-4">{summary}</div>
      </details>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <SectionCard icon="user" title="Your details">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Full name"
                  required
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  error={fieldErrors.fullName}
                  autoComplete="name"
                />
              </div>
              <Input
                label="Email address"
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                error={fieldErrors.email}
                autoComplete="email"
              />
              <Input
                label="Telephone"
                type="tel"
                required
                value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)}
                error={fieldErrors.telephone}
                autoComplete="tel"
                hint="Needed in case we need to contact you about delivery."
              />
            </div>
          </SectionCard>

          <SectionCard icon="pin" title="UK delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Address line 1"
                  required
                  value={form.line1}
                  onChange={(e) => set('line1', e.target.value)}
                  error={fieldErrors.line1}
                  autoComplete="address-line1"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address line 2 (optional)"
                  value={form.line2}
                  onChange={(e) => set('line2', e.target.value)}
                  autoComplete="address-line2"
                />
              </div>
              <Input
                label="Town / city"
                required
                value={form.townCity}
                onChange={(e) => set('townCity', e.target.value)}
                error={fieldErrors.townCity}
                autoComplete="address-level2"
              />
              <Input
                label="County (optional)"
                value={form.county}
                onChange={(e) => set('county', e.target.value)}
                autoComplete="address-level1"
              />
              <Input
                label="Postcode"
                required
                value={form.postcode}
                onChange={(e) => set('postcode', e.target.value.toUpperCase())}
                error={fieldErrors.postcode}
                autoComplete="postal-code"
                className="uppercase"
              />
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-800">Country</span>
                <div className="flex h-11 w-full items-center rounded-xl border border-ink-200 bg-ink-50 px-3.5 text-sm text-ink-600">
                  United Kingdom
                </div>
                <p className="mt-1.5 text-xs text-ink-500">Avernic UK delivers to UK addresses only.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon="shield" title="Payment">
            <div className="flex items-start gap-3 rounded-xl border border-accent-500/25 bg-accent-50 p-4 dark:bg-accent-50/60">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0 text-accent-600">
                <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm leading-relaxed text-ink-700">
                Payment is completed securely via Open Banking, powered by Fena. After placing your
                order you'll be taken to your bank to authorise payment directly — we never see or
                store your banking details.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Checkbox
                label={
                  <>
                    I have read and accept the{' '}
                    <Link to="/terms" target="_blank" className="underline">
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </>
                }
                checked={form.termsAccepted}
                onChange={(e) => set('termsAccepted', e.target.checked)}
                error={fieldErrors.termsAccepted}
              />
            </div>

            {submitError && (
              <div className="mt-4">
                <Alert tone="danger">{submitError}</Alert>
              </div>
            )}

            <Button type="submit" variant="accent" size="lg" fullWidth loading={submitting} className="mt-5">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Pay {formatGBP(priced.totalMinor)} securely
            </Button>
            <p className="mt-3 text-center text-xs text-ink-500 lg:hidden">Redirects to your bank to complete payment.</p>
          </SectionCard>
        </form>

        <aside className="hidden h-fit rounded-2xl border border-ink-200 bg-ink-50/60 p-6 lg:sticky lg:top-24 lg:block">
          <h2 className="text-sm font-semibold text-ink-900">Order summary</h2>
          <div className="mt-4">{summary}</div>
        </aside>
      </div>
    </div>
  )
}
