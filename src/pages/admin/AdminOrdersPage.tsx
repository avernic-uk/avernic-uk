import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { formatGBP, formatUKDate } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

interface OrderRow {
  id: string
  order_number: string
  email: string
  total_minor: number
  payment_status: string
  order_status: string
  created_at: string
}

export default function AdminOrdersPage() {
  useDocumentMeta({ title: 'Orders — Admin', noindex: true })
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const paymentStatus = searchParams.get('paymentStatus') ?? ''
  const orderStatus = searchParams.get('orderStatus') ?? ''
  const page = Number(searchParams.get('page') ?? '1')

  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (paymentStatus) qs.set('paymentStatus', paymentStatus)
    if (orderStatus) qs.set('orderStatus', orderStatus)
    qs.set('page', String(page))

    adminFetchJson<{ orders: OrderRow[]; total: number }>(`/api/admin/orders?${qs}`)
      .then((res) => {
        setOrders(res.orders)
        setTotal(res.total)
      })
      .catch((err) => setError(err.message))
  }, [search, paymentStatus, orderStatus, page])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-950">Orders</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Input label="Search" placeholder="Order number or email" value={search} onChange={(e) => updateParam('search', e.target.value)} />
        <Select label="Payment status" value={paymentStatus} onChange={(e) => updateParam('paymentStatus', e.target.value)}>
          <option value="">All</option>
          {['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select label="Order status" value={orderStatus} onChange={(e) => updateParam('orderStatus', e.target.value)}>
          <option value="">All</option>
          {['pending_payment', 'paid', 'processing', 'dispatched', 'completed', 'cancelled', 'refunded'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link to={`/admin/orders/${order.id}`} className="font-medium text-ink-900 underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-600">{order.email}</td>
                <td className="px-4 py-3 text-ink-600">{formatUKDate(order.created_at)}</td>
                <td className="px-4 py-3">
                  <Badge tone={order.payment_status === 'paid' ? 'success' : 'warning'}>{order.payment_status}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-600">{order.order_status}</td>
                <td className="px-4 py-3 text-right font-medium text-ink-900">{formatGBP(order.total_minor)}</td>
              </tr>
            ))}
            {orders && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>
            Previous
          </Button>
          <span className="text-sm text-ink-600">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParam('page', String(page + 1))}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
