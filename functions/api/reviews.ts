import { getSupabaseAdmin } from '../_lib/supabaseAdmin'
import { json, errorResponse, ApiError } from '../_lib/respond'
import type { Env } from '../_lib/types'

interface ReviewRow {
  id: string
  customer_name: string
  rating: number
  title: string
  comment: string
  created_at: string
}

/**
 * GET /api/reviews?productId=... — public. Returns only approved reviews for
 * the product, newest first, plus a rating summary. Approval is enforced by
 * both this query (is_approved filter) and RLS (see migration 0006), so even
 * a stray public read some other way could never surface an unmoderated one.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url)
    const productId = url.searchParams.get('productId')
    if (!productId) throw new ApiError(400, 'productId is required.')

    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, customer_name, rating, title, comment, created_at')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const reviews = (data ?? []) as ReviewRow[]
    const count = reviews.length
    const average = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count

    return json({
      reviews: reviews.map((r) => ({
        id: r.id,
        customerName: r.customer_name,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.created_at,
      })),
      summary: { average, count },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

interface SubmitReviewBody {
  productId: string
  customerName: string
  customerEmail?: string
  rating: number
  title?: string
  comment: string
  /** Honeypot field — real users never fill this in. */
  company?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/reviews — public. Anyone can submit a review for an active
 * product; it is stored with is_approved = false and never shown on the
 * storefront until an admin approves it (Admin → Reviews). See migration
 * 0006 for why moderation, not just spam control, matters here.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => null)) as SubmitReviewBody | null
    if (!body) throw new ApiError(400, 'Invalid request.')
    if (body.company) return json({ submitted: true }) // honeypot tripped — pretend success, do nothing

    if (!body.productId) throw new ApiError(422, 'productId is required.')
    if (!body.customerName?.trim()) throw new ApiError(422, 'Please enter your name.')
    if (body.customerEmail && !EMAIL_REGEX.test(body.customerEmail)) throw new ApiError(422, 'Please enter a valid email address.')
    const rating = Math.round(Number(body.rating))
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new ApiError(422, 'Please choose a star rating from 1 to 5.')
    if (!body.comment?.trim() || body.comment.trim().length < 5) throw new ApiError(422, 'Please enter a short review.')
    if (body.comment.trim().length > 2000) throw new ApiError(422, 'Reviews are limited to 2000 characters.')

    const supabase = getSupabaseAdmin(context.env)

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', body.productId)
      .eq('is_active', true)
      .maybeSingle()
    if (productError) throw productError
    if (!product) throw new ApiError(404, 'This product could not be found.')

    const { error: insertError } = await supabase.from('product_reviews').insert({
      product_id: body.productId,
      customer_name: body.customerName.trim().slice(0, 120),
      customer_email: body.customerEmail?.trim().toLowerCase() || null,
      rating,
      title: body.title?.trim().slice(0, 150) ?? '',
      comment: body.comment.trim(),
      is_approved: false,
    })
    if (insertError) throw insertError

    return json({ submitted: true }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
