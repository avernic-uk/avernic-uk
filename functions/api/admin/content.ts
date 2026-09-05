import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/content — every editable page block, grouped in display order. Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase
      .from('content_blocks')
      .select('key, page, page_path, label, hint, body, sort_order')
      .order('page', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) throw error
    return json({ blocks: data ?? [] })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * PATCH /api/admin/content — save edited block bodies. Admin-only.
 *
 * Takes a map of key → body and writes only the bodies. `label`, `hint`,
 * `page` and `sort_order` describe the admin UI itself and are set by the
 * migration, so they are deliberately not writable here: an accidental edit
 * shouldn't be able to detach a block from the page that renders it.
 */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const body = (await context.request.json().catch(() => null)) as { blocks?: Record<string, string> } | null
    const blocks = body?.blocks
    if (!blocks || typeof blocks !== 'object') throw new ApiError(400, 'Nothing to save.')

    const entries = Object.entries(blocks).filter(([, value]) => typeof value === 'string')
    if (entries.length === 0) throw new ApiError(400, 'Nothing to save.')

    const supabase = getSupabaseAdmin(context.env)
    for (const [key, value] of entries) {
      const { error } = await supabase.from('content_blocks').update({ body: value }).eq('key', key)
      if (error) throw error
    }

    return json({ saved: entries.length })
  } catch (error) {
    return errorResponse(error)
  }
}
