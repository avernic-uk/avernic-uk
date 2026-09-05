import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { formatGBP, formatUKDate } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'

interface Stats {
  totalOrders: number
  ordersToday: number
  pendingOrders: number
  revenueMinor: number
  recentOrders: { id: string; order_number: string; email: string; total_minor: number; payment_status: string; order_status: string; created_at: string }[]
}

export default function AdminDashboardPage() {
  useDocumentMeta({ title: 'Admin dashboard', noindex: true })
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminFetchJson<Stats>('/api/admin/stats').then(setStats).catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-950">Dashboard</h1>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Orders today', value: stats?.ordersToday },
          { label: 'Total orders', value: stats?.totalOrders },
          { label: 'Pending orders', value: stats?.pendingOrders },
          { label: 'Revenue (paid)', value: stats ? formatGBP(stats.revenueMinor) : undefined },
        ].map((tile) => (
          <Card key={tile.label}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{tile.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink-950">{tile.value ?? '—'}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold text-ink-900">Recent orders</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
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
            {(stats?.recentOrders ?? []).map((order) => (
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
