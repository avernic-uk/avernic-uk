import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/stats — dashboard summary numbers. Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)

    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)

    const [{ count: totalOrders }, { count: ordersToday }, { count: pendingOrders }, { data: paidOrders }] =
      await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'pending_payment'),
        supabase.from('orders').select('total_minor').eq('payment_status', 'paid'),
      ])

    const revenueMinor = (paidOrders ?? []).reduce((sum, o) => sum + o.total_minor, 0)

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, order_number, email, total_minor, payment_status, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(8)

    return json({
      totalOrders: totalOrders ?? 0,
      ordersToday: ordersToday ?? 0,
      pendingOrders: pendingOrders ?? 0,
      revenueMinor,
      recentOrders: recentOrders ?? [],
    })
  } catch (error) {
    return errorResponse(error)
  }
}
