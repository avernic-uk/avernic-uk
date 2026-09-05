import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/faqs — list all FAQ entries (including inactive), ordered. Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true })
    if (error) throw error
    return json({ faqs: data ?? [] })
  } catch (error) {
    return errorResponse(error)
  }
}

interface FaqInput {
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
}

/** POST /api/admin/faqs — create an FAQ entry, appended to the end of the list by default. Admin-only. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Partial<FaqInput> | null
    if (!body) throw new ApiError(400, 'Invalid request.')
    if (!body.question?.trim()) throw new ApiError(422, 'A question is required.')
    if (!body.answer?.trim()) throw new ApiError(422, 'An answer is required.')

    let sortOrder = body.sortOrder
    if (typeof sortOrder !== 'number') {
      const { data: maxRow } = await supabase.from('faqs').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
      sortOrder = ((maxRow?.sort_order as number | undefined) ?? -1) + 1
    }

    const { data, error } = await supabase
      .from('faqs')
      .insert({
        question: body.question.trim(),
        answer: body.answer.trim(),
        sort_order: sortOrder,
        is_active: body.isActive ?? true,
      })
      .select('*')
      .single()
    if (error) throw error

    return json({ faq: data }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
