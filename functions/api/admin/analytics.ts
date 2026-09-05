import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/**
 * GET /api/admin/analytics?days=30 — the whole dashboard in one payload.
 *
 * All aggregation happens in Postgres (`analytics_summary`), because PostgREST
 * can't express GROUP BY and pulling raw events into the worker to count them
 * in JavaScript would get slower every week the site stays up.
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)

    const url = new URL(context.request.url)
    const requested = Number(url.searchParams.get('days') ?? '30')
    const days = [7, 30, 90].includes(requested) ? requested : 30

    // Opportunistic retention, in case pg_cron isn't available on this plan.
    // Idempotent and cheap when there's nothing past the cutoff — the delete
    // and the aggregates all filter on an indexed timestamp — so it costs
    // effectively nothing on the overwhelming majority of dashboard loads.
    void supabase.rpc('rollup_analytics', { retain_days: 90 })

    const { data, error } = await supabase.rpc('analytics_summary', { range_days: days })
    if (error) throw error

    return json({ analytics: data })
  } catch (error) {
    return errorResponse(error)
  }
}
