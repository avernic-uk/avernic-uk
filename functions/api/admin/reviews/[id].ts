import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { requireAdmin } from '../../../_lib/auth'
import { json, errorResponse, ApiError } from '../../../_lib/respond'
import type { Env } from '../../../_lib/types'

interface PatchBody {
  isApproved?: boolean
}

/** PATCH /api/admin/reviews/:id — approve or unapprove a review. Admin-only. */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as PatchBody | null
    if (!body || typeof body.isApproved !== 'boolean') throw new ApiError(400, 'isApproved (boolean) is required.')

    const { data, error } = await supabase
      .from('product_reviews')
      .update({ is_approved: body.isApproved })
      .eq('id', context.params.id as string)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) throw new ApiError(404, 'Review not found.')

    return json({ review: data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** DELETE /api/admin/reviews/:id — permanently remove a review (spam, abuse, or a claim that shouldn't be published). Admin-only. */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { error } = await supabase.from('product_reviews').delete().eq('id', context.params.id as string)
    if (error) throw error
    return json({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
