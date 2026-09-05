import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/**
 * GET /api/admin/reviews?status=pending|approved|all&page= — Admin-only.
 * Defaults to 'pending' so the moderation queue is what an admin sees first.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const url = new URL(context.request.url)
    const status = url.searchParams.get('status') ?? 'pending'
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = 25

    let query = supabase
      .from('product_reviews')
      .select('*, products(name, slug)', { count: 'exact' })

    if (status === 'pending') query = query.eq('is_approved', false)
    else if (status === 'approved') query = query.eq('is_approved', true)

    const rangeFrom = (page - 1) * pageSize
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(rangeFrom, rangeFrom + pageSize - 1)
    if (error) throw error

    return json({ reviews: data ?? [], total: count ?? 0, page, pageSize })
  } catch (error) {
    return errorResponse(error)
  }
}
