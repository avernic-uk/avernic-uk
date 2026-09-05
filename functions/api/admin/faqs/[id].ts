import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { requireAdmin } from '../../../_lib/auth'
import { json, errorResponse, ApiError } from '../../../_lib/respond'
import type { Env } from '../../../_lib/types'

/** PATCH /api/admin/faqs/:id — update question/answer/sortOrder/isActive (reordering is just a sortOrder update). Admin-only. */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const allowed: Record<string, string> = {
      question: 'question',
      answer: 'answer',
      sortOrder: 'sort_order',
      isActive: 'is_active',
    }

    const update: Record<string, unknown> = {}
    for (const [key, column] of Object.entries(allowed)) {
      if (key in body) update[column] = body[key]
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'Nothing to update.')
    if (typeof update.question === 'string' && !update.question.trim()) throw new ApiError(422, 'A question is required.')
    if (typeof update.answer === 'string' && !update.answer.trim()) throw new ApiError(422, 'An answer is required.')

    const { data, error } = await supabase.from('faqs').update(update).eq('id', context.params.id as string).select('*').maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'FAQ entry not found.')

    return json({ faq: data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** DELETE /api/admin/faqs/:id — permanently removes the FAQ entry. Admin-only. */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { error, count } = await supabase.from('faqs').delete({ count: 'exact' }).eq('id', context.params.id as string)
    if (error) throw error
    if (!count) throw new ApiError(404, 'FAQ entry not found.')
    return json({ deleted: true })
  } catch (error) {
    return errorResponse(error)
  }
}
