import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

interface LookupBody {
  orderNumber: string
  email: string
}

/**
 * POST /api/orders/lookup
 *
 * Used by the order-confirmation page, which must work for BOTH guest and
 * signed-in customers immediately after checkout. Row Level Security would
 * block an anonymous SELECT on `orders` entirely (correctly — customers
 * must never be able to browse each other's orders), so this narrow,
 * server-side lookup requires the caller to already know both the order
 * number AND the email address on the order before returning anything.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => null)) as LookupBody | null
    if (!body?.orderNumber || !body?.email) throw new ApiError(400, 'Order number and email are required.')

    const supabase = getSupabaseAdmin(context.env)
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        'id, order_number, email, telephone, delivery_address, subtotal_minor, delivery_minor, total_minor, currency, payment_status, order_status, created_at',
      )
      .eq('order_number', body.orderNumber.trim())
      .eq('email', body.email.trim().toLowerCase())
      .maybeSingle()

    if (error) throw new ApiError(500, 'Could not look up your order.')
    if (!order) throw new ApiError(404, 'We could not find an order matching those details.')

    const { data: items } = await supabase
      .from('order_items')
      .select('sku, name, quantity, unit_price_minor, line_total_minor')
      .eq('order_id', order.id)

    return json({
      orderNumber: order.order_number,
      email: order.email,
      telephone: order.telephone,
      deliveryAddress: order.delivery_address,
      items: (items ?? []).map((i) => ({
        sku: i.sku,
        name: i.name,
        quantity: i.quantity,
        unitPriceMinor: i.unit_price_minor,
        lineTotalMinor: i.line_total_minor,
      })),
      subtotalMinor: order.subtotal_minor,
      deliveryMinor: order.delivery_minor,
      totalMinor: order.total_minor,
      currency: order.currency,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      createdAt: order.created_at,
    })
  } catch (error) {
    return errorResponse(error)
  }
}
