import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/settings — the single site_settings row. Admin-only (public reads go straight to Supabase via RLS). */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'Settings not found.')
    return json({ settings: data })
  } catch (error) {
    return errorResponse(error)
  }
}

const ALLOWED: Record<string, string> = {
  companyName: 'company_name',
  companyNumber: 'company_number',
  registeredAddress: 'registered_address',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
  deliveryStandardMinor: 'delivery_standard_minor',
  deliveryFreeThresholdMinor: 'delivery_free_threshold_minor',
  heroHeading: 'hero_heading',
  heroSubheading: 'hero_subheading',
  ageNoticeText: 'age_notice_text',
}

/** PATCH /api/admin/settings — update any subset of business/delivery/content fields. Admin-only. */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const update: Record<string, unknown> = {}
    for (const [key, column] of Object.entries(ALLOWED)) {
      if (key in body) update[column] = body[key]
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'Nothing to update.')

    if (
      'delivery_standard_minor' in update &&
      (typeof update.delivery_standard_minor !== 'number' || update.delivery_standard_minor < 0)
    ) {
      throw new ApiError(422, 'Standard delivery price must be a valid amount.')
    }
    if (
      'delivery_free_threshold_minor' in update &&
      (typeof update.delivery_free_threshold_minor !== 'number' || update.delivery_free_threshold_minor < 0)
    ) {
      throw new ApiError(422, 'Free delivery threshold must be a valid amount.')
    }

    const { data, error } = await supabase.from('site_settings').update(update).eq('id', 1).select('*').maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'Settings not found.')

    return json({ settings: data })
  } catch (error) {
    return errorResponse(error)
  }
}
