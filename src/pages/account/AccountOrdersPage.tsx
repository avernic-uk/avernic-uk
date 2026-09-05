import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { formatGBP, formatUKDate } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'

interface OrderRow {
  id: string
  order_number: string
  total_minor: number
  payment_status: string
  order_status: string
  created_at: string
}

export default function AccountOrdersPage() {
  useDocumentMeta({ title: 'Your orders', noindex: true })
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // RLS (orders_select_own) restricts this to the signed-in customer's own orders.
    supabase
      .from('orders')
      .select('id, order_number, total_minor, payment_status, order_status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setOrders(data ?? [])
      })
  }, [])

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink-950">Your orders</h1>

      {error && (
        <div className="mt-6">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {!error && orders === null && <p className="mt-8 text-sm text-ink-500">Loading your orders…</p>}

      {orders !== null && orders.length === 0 && (
        <p className="mt-8 text-sm text-ink-600">
          You haven't placed any orders yet.{' '}
          <Link to="/shop" className="underline">
            Start shopping
          </Link>
          .
        </p>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-8 divide-y divide-ink-200 rounded-2xl border border-ink-200">
          {orders.map((order) => (
            <li key={order.id}>
              <Link to={`/account/orders/${order.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-ink-50 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-ink-950">{order.order_number}</p>
                  <p className="text-xs text-ink-500">{formatUKDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="neutral">{order.order_status}</Badge>
                  <span className="text-sm font-medium text-ink-900">{formatGBP(order.total_minor)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
