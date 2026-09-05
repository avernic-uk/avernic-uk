import type { ProductReview, ReviewSummary } from '@/types'

interface ReviewsResponse {
  reviews: ProductReview[]
  summary: ReviewSummary
}

/** Public GET of a product's approved reviews + rating summary (see functions/api/reviews.ts). */
export async function getProductReviews(productId: string): Promise<ReviewsResponse> {
  const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
  if (!res.ok) throw new Error('Could not load reviews.')
  return res.json()
}

export interface SubmitReviewInput {
  productId: string
  customerName: string
  customerEmail?: string
  rating: number
  title?: string
  comment: string
}

/** Submits a new review. It won't appear publicly until an admin approves it. */
export async function submitProductReview(input: SubmitReviewInput): Promise<void> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Could not submit your review. Please try again.')
  }
}
