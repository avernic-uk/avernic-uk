import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { sendOrderEmailsIfNotAlreadySent } from '../../_lib/email'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/**
 * TEMPORARY DIAGNOSTIC ROUTE — not part of the real product.
 *
 * POST /api/admin/test-email  { orderId: string }
 *
 * Manually triggers sendOrderEmailsIfNotAlreadySent for an existing order,
 * so the Resend integration and email templates can be verified end-to-end
 * before Fano is wired up (normally this only fires from the Fano webhook
 * once a payment is confirmed). Admin-only. Delete this file once the
 * Resend test is confirmed working.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)

    const body = (await context.request.json().catch(() => null)) as { orderId?: string } | null
    if (!body?.orderId) throw new ApiError(400, 'orderId is required.')

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, email, telephone, delivery_address, subtotal_minor, delivery_minor, total_minor, payment_status, order_status, created_at')
      .eq('id', body.orderId)
      .maybeSingle()
    if (orderError) throw new ApiError(500, `Could not load order: ${orderError.message}`)
    if (!order) throw new ApiError(404, 'Order not found.')

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('sku, name, quantity, unit_price_minor, line_total_minor')
      .eq('order_id', order.id)
    if (itemsError) throw new ApiError(500, `Could not load order items: ${itemsError.message}`)

    const result = await sendOrderEmailsIfNotAlreadySent(supabase, context.env, {
      id: order.id,
      orderNumber: order.order_number,
      email: order.email,
      telephone: order.telephone,
      deliveryAddress: order.delivery_address,
      items: (items ?? []).map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitPriceMinor: i.unit_price_minor,
        lineTotalMinor: i.line_total_minor,
      })),
      subtotalMinor: order.subtotal_minor,
      deliveryMinor: order.delivery_minor,
      totalMinor: order.total_minor,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      createdAt: order.created_at,
    })

    return json({ ok: true, result })
  } catch (error) {
    return errorResponse(error)
  }
}
