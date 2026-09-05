import type { SupabaseClient } from '@supabase/supabase-js'
import { checkFenaPaymentStatus, type NormalisedFenaStatus } from './fena'
import { sendOrderEmailsIfNotAlreadySent } from './email'
import type { Env, PaymentStatus, OrderStatus } from './types'

/**
 * The single place that turns a normalised Fena status into Avernic UK's
 * own payment_status/order_status vocabulary, and — on the transition into
 * 'paid' — triggers the (idempotent) order confirmation emails.
 *
 * Called from two places, both of which must behave identically:
 *   - functions/api/payments/fena/webhook.ts, after re-fetching status fresh
 *     from Fena (the webhook body itself is never trusted — see fena.ts).
 *   - functions/api/orders/lookup.ts, when a customer lands back on the
 *     order-confirmation page with a payment still pending/processing.
 *
 * Idempotent: a payment already at 'paid' is left untouched and returns
 * without re-processing (payments.status plus the email_events unique
 * index are the two independent guards against double-processing).
 */

function mapStatus(status: NormalisedFenaStatus): { paymentStatus: PaymentStatus; orderStatus: OrderStatus | null } | null {
  switch (status) {
    case 'paid':
      return { paymentStatus: 'paid', orderStatus: 'paid' }
    case 'processing':
      return { paymentStatus: 'processing', orderStatus: null }
    case 'failed':
      return { paymentStatus: 'failed', orderStatus: null }
    case 'cancelled':
      return { paymentStatus: 'cancelled', orderStatus: 'cancelled' }
    case 'refunded':
      return { paymentStatus: 'refunded', orderStatus: 'refunded' }
    case 'expired':
      return { paymentStatus: 'failed', orderStatus: null }
    case 'unknown':
      // Never treated as a change — see fena.ts on why unrecognised status
      // strings must not be misread as a failure.
      return null
  }
}

interface PaymentRow {
  id: string
  order_id: string
  status: string
  fena_hashed_id: string | null
}

/**
 * Re-checks a payment's status directly against Fena and applies any real
 * change. Safe to call repeatedly / concurrently for the same payment.
 */
export async function reconcileFenaPayment(supabase: SupabaseClient, env: Env, payment: PaymentRow): Promise<void> {
  if (payment.status === 'paid') return // terminal state — never re-processed
  if (!payment.fena_hashed_id) return // nothing to check yet

  const { status, raw } = await checkFenaPaymentStatus(env, payment.fena_hashed_id)
  const mapped = mapStatus(status)
  if (!mapped) return // 'unknown' — no-op by design

  if (mapped.paymentStatus === payment.status) return // no change

  await supabase.from('payments').update({ status: mapped.paymentStatus, raw_response: raw as object }).eq('id', payment.id)

  const orderUpdate: Record<string, unknown> = { payment_status: mapped.paymentStatus }
  if (mapped.orderStatus) orderUpdate.order_status = mapped.orderStatus

  const { data: updatedOrder } = await supabase
    .from('orders')
    .update(orderUpdate)
    .eq('id', payment.order_id)
    .select('id, order_number, email, telephone, delivery_address, subtotal_minor, delivery_minor, total_minor, payment_status, order_status, created_at')
    .single()

  if (mapped.paymentStatus === 'paid' && updatedOrder) {
    const { data: items } = await supabase
      .from('order_items')
      .select('name, sku, quantity, unit_price_minor, line_total_minor')
      .eq('order_id', updatedOrder.id)

    await sendOrderEmailsIfNotAlreadySent(supabase, env, {
      id: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      email: updatedOrder.email,
      telephone: updatedOrder.telephone,
      deliveryAddress: updatedOrder.delivery_address,
      items: (items ?? []).map((i) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitPriceMinor: i.unit_price_minor,
        lineTotalMinor: i.line_total_minor,
      })),
      subtotalMinor: updatedOrder.subtotal_minor,
      deliveryMinor: updatedOrder.delivery_minor,
      totalMinor: updatedOrder.total_minor,
      paymentStatus: updatedOrder.payment_status,
      orderStatus: updatedOrder.order_status,
      createdAt: updatedOrder.created_at,
    })
  }
}
