import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { formatUKDateTime } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { ReviewStars } from '@/components/product/ReviewStars'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface ReviewRow {
  id: string
  product_id: string
  customer_name: string
  customer_email: string | null
  rating: number
  title: string
  comment: string
  is_approved: boolean
  created_at: string
  products: { name: string; slug: string } | { name: string; slug: string }[] | null
}

type StatusFilter = 'pending' | 'approved' | 'all'

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'all', label: 'All' },
]

export default function AdminReviewsPage() {
  useDocumentMeta({ title: 'Reviews — Admin', noindex: true })
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function load() {
    setReviews(null)
    adminFetchJson<{ reviews: ReviewRow[] }>(`/api/admin/reviews?status=${status}`)
      .then((res) => setReviews(res.reviews))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [status])

  async function approve(id: string, isApproved: boolean) {
    setBusyId(id)
    setError(null)
    try {
      await adminFetchJson(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ isApproved }) })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this review.')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await adminFetchJson(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this review.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-ink-950">Reviews</h1>
      <p className="mt-1 text-sm text-ink-500">
        New reviews are hidden from the site until approved here. Before approving, check a review doesn't make any
        medical or therapeutic claim (e.g. "cleared my acne", "healed my skin condition") — everything sold on
        Avernic UK is a cosmetic product, not a medicine, and publishing a claim like that on a product page would be
        a regulatory problem even though a customer wrote it, not us.
      </p>

      <div className="mt-6 flex gap-1 border-b border-ink-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              status === tab.key ? 'border-ink-900 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {reviews === null && <p className="text-sm text-ink-500">Loading…</p>}
        {reviews?.length === 0 && <p className="text-sm text-ink-500">No reviews here.</p>}
        {reviews?.map((review) => {
          const product = Array.isArray(review.products) ? review.products[0] : review.products
          return (
            <div key={review.id} className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ReviewStars rating={review.rating} size="sm" />
                    {review.title && <span className="text-sm font-semibold text-ink-950">{review.title}</span>}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {product ? (
                      <Link to={`/product/${product.slug}`} target="_blank" className="underline">
                        {product.name}
                      </Link>
                    ) : (
                      'Unknown product'
                    )}
                    {' · '}
                    {review.customer_name}
                    {review.customer_email ? ` (${review.customer_email})` : ''}
                    {' · '}
                    {formatUKDateTime(review.created_at)}
                  </p>
                </div>
                <Badge tone={review.is_approved ? 'success' : 'warning'}>{review.is_approved ? 'Approved' : 'Pending'}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{review.comment}</p>
              <div className="mt-3 flex gap-2">
                {!review.is_approved && (
                  <Button size="sm" variant="accent" loading={busyId === review.id} onClick={() => approve(review.id, true)}>
                    Approve
                  </Button>
                )}
                {review.is_approved && (
                  <Button size="sm" variant="outline" loading={busyId === review.id} onClick={() => approve(review.id, false)}>
                    Unapprove
                  </Button>
                )}
                <Button size="sm" variant="ghost" loading={busyId === review.id} onClick={() => remove(review.id)}>
                  Delete
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
