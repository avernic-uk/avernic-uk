import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/orders?search=&paymentStatus=&orderStatus=&from=&to=&page= — Admin-only order list. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const url = new URL(context.request.url)

    const search = url.searchParams.get('search')?.trim()
    const paymentStatus = url.searchParams.get('paymentStatus')
    const orderStatus = url.searchParams.get('orderStatus')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = 20

    let query = supabase
      .from('orders')
      .select('id, order_number, email, telephone, total_minor, payment_status, order_status, created_at', { count: 'exact' })

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (paymentStatus) query = query.eq('payment_status', paymentStatus)
    if (orderStatus) query = query.eq('order_status', orderStatus)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const rangeFrom = (page - 1) * pageSize
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(rangeFrom, rangeFrom + pageSize - 1)

    if (error) throw error

    return json({ orders: data ?? [], total: count ?? 0, page, pageSize })
  } catch (error) {
    return errorResponse(error)
  }
}
