import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { formatGBP, formatUKDateTime } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps'

interface OrderDetail {
  orderNumber: string
  email: string
  telephone: string
  deliveryAddress: {
    fullName: string
    line1: string
    line2: string | null
    townCity: string
    county: string | null
    postcode: string
    country: string
  }
  items: { sku: string; name: string; quantity: number; unitPriceMinor: number; lineTotalMinor: number }[]
  subtotalMinor: number
  deliveryMinor: number
  totalMinor: number
  paymentStatus: string
  orderStatus: string
  createdAt: string
}

function statusTone(paymentStatus: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (paymentStatus === 'paid') return 'success'
  if (paymentStatus === 'pending' || paymentStatus === 'processing') return 'warning'
  if (paymentStatus === 'failed' || paymentStatus === 'cancelled') return 'danger'
  return 'neutral'
}

export default function OrderConfirmationPage() {
  useDocumentMeta({ title: 'Order confirmation', noindex: true })
  const { orderNumber = '' } = useParams()
  const [searchParams] = useSearchParams()
  const notice = searchParams.get('notice')

  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsEmail, setNeedsEmail] = useState(false)

  async function lookup(withEmail: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email: withEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'We could not find that order.')
        setNeedsEmail(true)
        return
      }
      setOrder(data)
      setNeedsEmail(false)
    } catch {
      setError('We could not reach the server. Please try again.')
      setNeedsEmail(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem('avernic_last_order')
      if (raw) {
        const parsed = JSON.parse(raw) as { orderNumber: string; email: string }
        if (parsed.orderNumber === orderNumber && parsed.email) {
          setEmail(parsed.email)
          lookup(parsed.email)
          return
        }
      }
    } catch {
      // ignore
    }
    setNeedsEmail(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber])

  function onSubmitEmail(e: FormEvent) {
    e.preventDefault()
    lookup(email)
  }

  if (needsEmail && !order) {
    return (
      <div className="container-page max-w-md py-16">
        <h1 className="text-2xl font-semibold text-ink-950">Find your order</h1>
        <p className="mt-2 text-sm text-ink-600">
          Enter the email address you used to place order <strong>{orderNumber}</strong> to view its confirmation.
        </p>
        <form onSubmit={onSubmitEmail} className="mt-6 space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" variant="primary" fullWidth loading={loading}>
            View order
          </Button>
        </form>
      </div>
    )
  }

  if (loading && !order) {
    return <div className="container-page py-20 text-center text-sm text-ink-500">Loading your order…</div>
  }

  if (!order) return null

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <CheckoutSteps current="confirmation" />

      {notice && (
        <div className="mb-6 mt-6">
          <Alert tone="warning" title="Payment not yet completed">
            {notice}
          </Alert>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 text-success-700">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
          <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-semibold">Order received</span>
      </div>
      <h1 className="mt-2 text-3xl font-semibold text-ink-950">Thank you, {order.deliveryAddress.fullName.split(' ')[0]}.</h1>
      <p className="mt-2 text-sm text-ink-600">
        Order <strong>{order.orderNumber}</strong> placed on {formatUKDateTime(order.createdAt)}.
      </p>
      <div className="mt-3 flex gap-2">
        <Badge tone={statusTone(order.paymentStatus)}>Payment: {order.paymentStatus}</Badge>
        <Badge tone="neutral">Order: {order.orderStatus}</Badge>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-200 p-5 sm:p-6">
        <ul className="divide-y divide-ink-100">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between py-3 text-sm">
              <span className="text-ink-700">
                {item.name} <span className="text-ink-400">× {item.quantity}</span>
              </span>
              <span className="font-medium text-ink-950">{formatGBP(item.lineTotalMinor)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-ink-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Subtotal</dt>
            <dd>{formatGBP(order.subtotalMinor)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Delivery</dt>
            <dd>{order.deliveryMinor === 0 ? 'Free' : formatGBP(order.deliveryMinor)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatGBP(order.totalMinor)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">Delivery address</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {order.deliveryAddress.line1}
            <br />
            {order.deliveryAddress.line2 && (
              <>
                {order.deliveryAddress.line2}
                <br />
              </>
            )}
            {order.deliveryAddress.townCity}
            <br />
            {order.deliveryAddress.county && (
              <>
                {order.deliveryAddress.county}
                <br />
              </>
            )}
            {order.deliveryAddress.postcode}
            <br />
            {order.deliveryAddress.country}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink-900">What happens next</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            We'll email you at {order.email} to confirm your order and let you know once it's on its way.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/shop" variant="primary">
          Continue shopping
        </ButtonLink>
        <Link to="/contact" className="inline-flex h-11 items-center px-5 text-sm font-medium text-ink-700 underline">
          Need help with this order?
        </Link>
      </div>
    </div>
  )
}
