import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { requireAdmin } from '../../../_lib/auth'
import { json, errorResponse, ApiError } from '../../../_lib/respond'
import type { Env, OrderStatus, PaymentStatus } from '../../../_lib/types'

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'processing',
  'dispatched',
  'completed',
  'cancelled',
  'refunded',
]

// Admins may only move payment status to these values manually (e.g. after
// processing a refund outside Fano, or cancelling an unpaid order). Moving
// a payment TO 'paid' must only ever happen via the verified Fano webhook.
const ADMIN_SETTABLE_PAYMENT_STATUSES: PaymentStatus[] = ['cancelled', 'refunded']

/** GET /api/admin/orders/:id — full order detail. Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const id = context.params.id as string

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!order) throw new ApiError(404, 'Order not found.')

    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id)
    const { data: payments } = await supabase.from('payments').select('*').eq('order_id', id).order('created_at', { ascending: false })

    return json({ order, items: items ?? [], payments: payments ?? [] })
  } catch (error) {
    return errorResponse(error)
  }
}

interface PatchBody {
  orderStatus?: OrderStatus
  paymentStatus?: PaymentStatus
  internalNotes?: string
}

/** PATCH /api/admin/orders/:id — update fulfilment status / internal notes. Admin-only. */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const id = context.params.id as string
    const body = (await context.request.json().catch(() => null)) as PatchBody | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const update: Record<string, unknown> = {}
    if (body.orderStatus) {
      if (!VALID_ORDER_STATUSES.includes(body.orderStatus)) throw new ApiError(400, 'Invalid order status.')
      update.order_status = body.orderStatus
    }
    if (body.paymentStatus) {
      if (!ADMIN_SETTABLE_PAYMENT_STATUSES.includes(body.paymentStatus)) {
        throw new ApiError(400, 'Payment can only be manually set to cancelled or refunded — paid status is set automatically by verified payment confirmation only.')
      }
      update.payment_status = body.paymentStatus
    }
    if (typeof body.internalNotes === 'string') update.internal_notes = body.internalNotes

    if (Object.keys(update).length === 0) throw new ApiError(400, 'Nothing to update.')

    const { data, error } = await supabase.from('orders').update(update).eq('id', id).select('*').maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'Order not found.')

    return json({ order: data })
  } catch (error) {
    return errorResponse(error)
  }
}
