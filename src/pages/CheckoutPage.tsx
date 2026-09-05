import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBasket } from '@/lib/basket/BasketProvider'
import { useAuth } from '@/lib/auth/AuthProvider'
import { formatGBP } from '@/lib/format'
import { isValidUKPostcode } from '@/lib/validation/postcode'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input, Checkbox } from '@/components/ui/Input'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

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

export default function CheckoutPage() {
  useDocumentMeta({ title: 'Checkout' })
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
    if (!validate()) return

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

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink-950">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={onSubmit} noValidate className="space-y-10">
          <section aria-labelledby="customer-details-heading">
            <h2 id="customer-details-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-500">
              Your details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          </section>

          <section aria-labelledby="delivery-address-heading">
            <h2 id="delivery-address-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-500">
              UK delivery address
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                <div className="flex h-11 w-full items-center rounded-lg border border-ink-200 bg-ink-50 px-3.5 text-sm text-ink-600">
                  United Kingdom
                </div>
                <p className="mt-1.5 text-xs text-ink-500">Avernic UK delivers to UK addresses only.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="text-sm font-semibold uppercase tracking-wide text-ink-500">
              Payment
            </h2>
            <p className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
              Payment is completed securely via Open Banking, powered by Fena. After placing your
              order you'll be taken to your bank to authorise payment directly — we never see or
              store your banking details.
            </p>
          </section>

          <section aria-labelledby="legal-heading" className="space-y-3">
            <h2 id="legal-heading" className="sr-only">
              Terms
            </h2>
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
          </section>

          {submitError && <Alert tone="danger">{submitError}</Alert>}

          <Button type="submit" variant="accent" size="lg" fullWidth loading={submitting}>
            Pay securely
          </Button>
        </form>

        <aside className="h-fit rounded-2xl border border-ink-200 bg-ink-50/60 p-6">
          <h2 className="text-sm font-semibold text-ink-900">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {priced.lines.map((line) => (
              <li key={line.productId} className="flex justify-between text-sm">
                <span className="text-ink-700">
                  {line.name} <span className="text-ink-400">× {line.quantity}</span>
                </span>
                <span className="font-medium text-ink-950">{formatGBP(line.lineTotalMinor)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-ink-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="text-ink-900">{formatGBP(priced.subtotalMinor)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="text-ink-900">{priced.deliveryMinor === 0 ? 'Free' : formatGBP(priced.deliveryMinor)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold">
              <dt className="text-ink-950">Total</dt>
              <dd className="text-ink-950">{formatGBP(priced.totalMinor)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
