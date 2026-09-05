import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { formatGBP, formatUKDateTime } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'

interface OrderDetail {
  id: string
  order_number: string
  email: string
  telephone: string
  delivery_address: { fullName: string; line1: string; line2: string | null; townCity: string; county: string | null; postcode: string; country: string }
  subtotal_minor: number
  delivery_minor: number
  delivery_method: string
  delivery_method_label: string
  total_minor: number
  payment_status: string
  order_status: string
  fena_payment_reference: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}
interface OrderItem {
  sku: string
  name: string
  quantity: number
  unit_price_minor: number
  line_total_minor: number
}
interface Payment {
  id: string
  provider: string
  provider_reference: string
  status: string
  amount_minor: number
  created_at: string
}

const ORDER_STATUSES = ['pending_payment', 'paid', 'processing', 'dispatched', 'completed', 'cancelled', 'refunded']

export default function AdminOrderDetailPage() {
  useDocumentMeta({ title: 'Order — Admin', noindex: true })
  const { id = '' } = useParams()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function load() {
    adminFetchJson<{ order: OrderDetail; items: OrderItem[]; payments: Payment[] }>(`/api/admin/orders/${id}`)
      .then((res) => {
        setOrder(res.order)
        setItems(res.items)
        setPayments(res.payments)
        setNotes(res.order.internal_notes ?? '')
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [id])

  async function updateStatus(orderStatus: string) {
    setSaving(true)
    setError(null)
    try {
      await adminFetchJson(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ orderStatus }) })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order status.')
    } finally {
      setSaving(false)
    }
  }

  async function saveNotes() {
    setSaving(true)
    setError(null)
    try {
      await adminFetchJson(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ internalNotes: notes }) })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save notes.')
    } finally {
      setSaving(false)
    }
  }

  if (error && !order) return <Alert tone="danger">{error}</Alert>
  if (!order) return <p className="text-sm text-ink-500">Loading…</p>

  return (
    <div>
      <Link to="/admin/orders" className="text-xs text-ink-500 underline">
        ← Back to orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-950">{order.order_number}</h1>
          <p className="text-sm text-ink-500">Placed {formatUKDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={order.payment_status === 'paid' ? 'success' : 'warning'}>Payment: {order.payment_status}</Badge>
          <Select
            label="Order status"
            value={order.order_status}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={saving}
            className="min-w-[180px]"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <table className="w-full text-sm">
              <tbody>
                {items.map((item) => (
                  <tr key={item.sku} className="border-b border-ink-100 last:border-0">
                    <td className="py-2">
                      {item.name} <span className="text-ink-400">({item.sku})</span>
                    </td>
                    <td className="py-2 text-center">× {item.quantity}</td>
                    <td className="py-2 text-right font-medium">{formatGBP(item.line_total_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-2 border-t border-ink-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Subtotal</dt>
                <dd>{formatGBP(order.subtotal_minor)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">
                  Delivery
                  {order.delivery_method_label && <span className="block text-xs text-ink-400">{order.delivery_method_label}</span>}
                </dt>
                <dd className="whitespace-nowrap">{formatGBP(order.delivery_minor)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatGBP(order.total_minor)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-900">Payment attempts</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">No payment attempts yet.</p>
            ) : (
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-ink-500">
                    <th className="py-1">Reference</th>
                    <th className="py-1">Status</th>
                    <th className="py-1 text-right">Amount</th>
                    <th className="py-1 text-right">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-ink-100">
                      <td className="py-2 font-mono text-xs">{p.provider_reference}</td>
                      <td className="py-2">{p.status}</td>
                      <td className="py-2 text-right">{formatGBP(p.amount_minor)}</td>
                      <td className="py-2 text-right text-ink-500">{formatUKDateTime(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-900">Internal notes</h2>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-lg border border-ink-300 p-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-500"
              placeholder="Notes visible to admin staff only — not shown to the customer."
            />
            <Button size="sm" variant="outline" className="mt-2" onClick={saveNotes} loading={saving}>
              {saved ? 'Saved ✓' : 'Save notes'}
            </Button>
          </div>
        </div>

        <aside>
          <div className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-900">Customer</h2>
            <p className="mt-2 text-sm text-ink-700">{order.delivery_address.fullName}</p>
            <p className="text-sm text-ink-600">{order.email}</p>
            <p className="text-sm text-ink-600">{order.telephone}</p>

            <h2 className="mt-6 text-sm font-semibold text-ink-900">Delivery address</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {order.delivery_address.line1}
              <br />
              {order.delivery_address.line2 && (
                <>
                  {order.delivery_address.line2}
                  <br />
                </>
              )}
              {order.delivery_address.townCity}
              <br />
              {order.delivery_address.county && (
                <>
                  {order.delivery_address.county}
                  <br />
                </>
              )}
              {order.delivery_address.postcode}
              <br />
              {order.delivery_address.country}
            </p>

            {order.fena_payment_reference && (
              <>
                <h2 className="mt-6 text-sm font-semibold text-ink-900">Payment reference</h2>
                <p className="mt-2 break-all font-mono text-xs text-ink-600">{order.fena_payment_reference}</p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
