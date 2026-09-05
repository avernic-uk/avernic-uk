import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { formatGBP, formatUKDateTime } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'

interface OrderDetail {
  order_number: string
  delivery_address: { fullName: string; line1: string; line2: string | null; townCity: string; county: string | null; postcode: string; country: string }
  subtotal_minor: number
  delivery_minor: number
  total_minor: number
  payment_status: string
  order_status: string
  created_at: string
}

interface OrderItemRow {
  sku: string
  name: string
  quantity: number
  unit_price_minor: number
  line_total_minor: number
}

export default function AccountOrderDetailPage() {
  useDocumentMeta({ title: 'Order details', noindex: true })
  const { id = '' } = useParams()
  const [order, setOrder] = useState<OrderDetail | null | undefined>(undefined)
  const [items, setItems] = useState<OrderItemRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // RLS restricts both selects to the signed-in customer's own order.
    supabase
      .from('orders')
      .select('order_number, delivery_address, subtotal_minor, delivery_minor, total_minor, payment_status, order_status, created_at')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setOrder(data ?? null)
      })
    supabase
      .from('order_items')
      .select('sku, name, quantity, unit_price_minor, line_total_minor')
      .eq('order_id', id)
      .then(({ data }) => setItems(data ?? []))
  }, [id])

  if (error) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Alert tone="danger">{error}</Alert>
      </div>
    )
  }

  if (order === null) {
    return (
      <div className="container-page max-w-2xl py-14 text-center">
        <p className="text-sm text-ink-600">Order not found.</p>
        <Link to="/account/orders" className="mt-4 inline-block text-sm underline">
          Back to orders
        </Link>
      </div>
    )
  }

  if (order === undefined) {
    return <div className="container-page py-14 text-center text-sm text-ink-500">Loading…</div>
  }

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <Link to="/account/orders" className="text-xs text-ink-500 underline">
        ← Back to orders
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-ink-950">{order.order_number}</h1>
      <p className="mt-1 text-sm text-ink-500">Placed {formatUKDateTime(order.created_at)}</p>
      <div className="mt-3 flex gap-2">
        <Badge tone="neutral">Payment: {order.payment_status}</Badge>
        <Badge tone="neutral">Status: {order.order_status}</Badge>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-200 p-5 sm:p-6">
        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.sku} className="flex justify-between py-3 text-sm">
              <span className="text-ink-700">
                {item.name} <span className="text-ink-400">× {item.quantity}</span>
              </span>
              <span className="font-medium text-ink-950">{formatGBP(item.line_total_minor)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-ink-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Subtotal</dt>
            <dd>{formatGBP(order.subtotal_minor)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Delivery</dt>
            <dd>{order.delivery_minor === 0 ? 'Free' : formatGBP(order.delivery_minor)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatGBP(order.total_minor)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-ink-900">Delivery address</h2>
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
          {order.delivery_address.postcode}
          <br />
          {order.delivery_address.country}
        </p>
      </div>
    </div>
  )
}
