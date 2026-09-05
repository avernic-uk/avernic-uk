import { useEffect, useState, type FormEvent } from 'react'
import { formatUKDate } from '@/lib/format'
import { getProductReviews, submitProductReview } from '@/lib/api/reviews'
import { ReviewStars, ReviewStarPicker } from '@/components/product/ReviewStars'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import type { ProductReview, ReviewSummary } from '@/types'

interface FormState {
  customerName: string
  customerEmail: string
  rating: number
  title: string
  comment: string
  company: string // honeypot
}

const initialForm: FormState = { customerName: '', customerEmail: '', rating: 0, title: '', comment: '', company: '' }

export function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const [reviews, setReviews] = useState<ProductReview[] | null>(null)
  const [summary, setSummary] = useState<ReviewSummary>({ average: 0, count: 0 })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProductReviews(productId)
      .then(({ reviews: r, summary: s }) => {
        if (cancelled) return
        setReviews(r)
        setSummary(s)
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldError(null)
    setSubmitError(null)

    if (!form.customerName.trim()) return setFieldError('Please enter your name.')
    if (form.rating < 1) return setFieldError('Please choose a star rating.')
    if (form.comment.trim().length < 5) return setFieldError('Please enter a short review.')

    setSubmitting(true)
    try {
      await submitProductReview({
        productId,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        rating: form.rating,
        title: form.title.trim() || undefined,
        comment: form.comment.trim(),
      })
      setSubmitted(true)
      setForm(initialForm)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-16 border-t border-ink-200 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink-950">Customer reviews</h2>
          {summary.count > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <ReviewStars rating={summary.average} />
              <span className="text-sm font-medium text-ink-900">{summary.average.toFixed(1)} out of 5</span>
              <span className="text-sm text-ink-500">
                ({summary.count} review{summary.count === 1 ? '' : 's'})
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-500">No reviews yet — be the first to review {productName}.</p>
          )}
        </div>
        {!showForm && !submitted && (
          <Button variant="outline" onClick={() => setShowForm(true)}>
            Write a review
          </Button>
        )}
      </div>

      {submitted && (
        <div className="mt-6">
          <Alert tone="success" title="Thank you for your review">
            It's been submitted and will appear here once it's been checked by our team.
          </Alert>
        </div>
      )}

      {showForm && !submitted && (
        <form onSubmit={onSubmit} className="mt-6 max-w-xl space-y-4 rounded-2xl border border-ink-200 bg-ink-50/60 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-ink-900">Write a review</h3>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-800">
              Your rating <span aria-hidden="true" className="text-accent-600">*</span>
            </span>
            <ReviewStarPicker value={form.rating} onChange={(rating) => set('rating', rating)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" required value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
            <Input
              label="Email (optional)"
              type="email"
              value={form.customerEmail}
              onChange={(e) => set('customerEmail', e.target.value)}
              hint="Never shown publicly."
            />
          </div>

          <Input
            label="Review title (optional)"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />

          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-ink-800">
              Your review <span aria-hidden="true" className="text-accent-600">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              required
              value={form.comment}
              onChange={(e) => set('comment', e.target.value)}
              placeholder="What did you think of this product?"
              className="w-full rounded-lg border border-ink-300 bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-accent-500"
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Please keep reviews to your own experience of using the product — we can't publish reviews making medical or
              therapeutic claims, as everything we sell is a cosmetic skincare product, not a medicine.
            </p>
          </div>

          {/* Honeypot — hidden from real users via CSS, left blank by them; bots that fill every field trip it. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="review-company">Company</label>
            <input
              id="review-company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
            />
          </div>

          {fieldError && <Alert tone="danger">{fieldError}</Alert>}
          {submitError && <Alert tone="danger">{submitError}</Alert>}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="accent" loading={submitting}>
              Submit review
            </Button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-ink-600 underline">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-6">
        {reviews === null && <p className="text-sm text-ink-500">Loading reviews…</p>}
        {reviews?.map((review) => (
          <article key={review.id} className="border-b border-ink-100 pb-6 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ReviewStars rating={review.rating} size="sm" />
                {review.title && <span className="text-sm font-semibold text-ink-950">{review.title}</span>}
              </div>
              <span className="text-xs text-ink-400">{formatUKDate(review.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.comment}</p>
            <p className="mt-1.5 text-xs font-medium text-ink-500">{review.customerName}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
