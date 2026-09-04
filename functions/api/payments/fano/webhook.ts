import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { verifyAndParseFanoWebhook, FanoNotConfiguredError, type NormalisedFanoStatus } from '../../../_lib/fano'
import { sendOrderEmailsIfNotAlreadySent } from '../../../_lib/email'
import { json } from '../../../_lib/respond'
import type { Env, PaymentStatus, OrderStatus } from '../../../_lib/types'

/** Maps a normalised Fano payment status onto Avernic UK's own status vocabulary. */
function mapStatuses(status: NormalisedFanoStatus): { paymentStatus: PaymentStatus; orderStatus: OrderStatus | null } {
  switch (status) {
    case 'paid':
      return { paymentStatus: 'paid', orderStatus: 'paid' }
    case 'processing':
      return { paymentStatus: 'processing', orderStatus: null }
    case 'failed':
      return { paymentStatus: 'failed', orderStatus: null }
    case 'cancelled':
      return { paymentStatus: 'cancelled', orderStatus: 'cancelled' }
    case 'expired':
      return { paymentStatus: 'failed', orderStatus: null }
  }
}

/**
 * POST /api/payments/fano/webhook
 *
 * Fano Open Banking webhook receiver.
 *
 * STATUS: architecture only — verifyAndParseFanoWebhook() throws until the
 * real Fano webhook signature scheme and payload shape are implemented
 * against Fano's documentation (see functions/_lib/fano.ts). Everything
 * below it (idempotency, status transitions, triggering emails) is real and
 * ready to use as soon as that function is filled in.
 *
 * IDEMPOTENCY: a webhook may be delivered more than once for the same
 * event. This handler is safe to call repeatedly for the same payment:
 *   - payments.provider_reference has a unique index, so the payment row is
 *     looked up (not blindly inserted) and only updated if its status
 *     actually changes.
 *   - If the payment is already 'paid', the handler is a no-op and returns
 *     200 immediately — it will NOT re-mark the order, re-decrement stock,
 *     or re-send emails.
 *   - Order confirmation/business emails are additionally guarded by the
 *     email_events unique (order_id, email_type) index (see
 *     functions/_lib/email.ts) as a second, independent idempotency layer.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const supabase = getSupabaseAdmin(context.env)

  let parsed: Awaited<ReturnType<typeof verifyAndParseFanoWebhook>>
  try {
    parsed = await verifyAndParseFanoWebhook(context.request, context.env)
  } catch (error) {
    if (error instanceof FanoNotConfiguredError) {
      // Nothing to do yet in this environment. Acknowledge with 200 so a
      // real Fano sandbox retry-storm isn't provoked once this endpoint is
      // publicly reachable but genuinely not configured.
      return json({ received: true, status: 'not_configured' })
    }
    // Signature verification failure or malformed payload — reject.
    // eslint-disable-next-line no-console
    console.error('[fano webhook] invalid webhook request:', error)
    return json({ error: 'Invalid webhook request.' }, { status: 400 })
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, order_id, status')
    .eq('provider', 'fano')
    .eq('provider_reference', parsed.providerReference)
    .maybeSingle()

  if (paymentError || !payment) {
    // eslint-disable-next-line no-console
    console.error('[fano webhook] unknown payment reference:', parsed.providerReference)
    // Acknowledge receipt (2xx) so Fano doesn't retry forever for a
    // reference that will never exist on our side, but don't process it.
    return json({ received: true, status: 'unknown_reference' })
  }

  // Idempotency: a payment that has already reached a terminal 'paid' state
  // is never modified or re-processed by a later webhook delivery.
  if (payment.status === 'paid') {
    return json({ received: true, status: 'already_processed' })
  }

  const { paymentStatus, orderStatus } = mapStatuses(parsed.status)

  await supabase
    .from('payments')
    .update({ status: paymentStatus === 'processing' ? 'processing' : paymentStatus, raw_response: parsed.raw as object })
    .eq('id', payment.id)

  const orderUpdate: Record<string, unknown> = { payment_status: paymentStatus }
  if (orderStatus) orderUpdate.order_status = orderStatus

  const { data: updatedOrder } = await supabase
    .from('orders')
    .update(orderUpdate)
    .eq('id', payment.order_id)
    .select('id, order_number, email, telephone, delivery_address, subtotal_minor, delivery_minor, total_minor, payment_status, order_status, created_at')
    .single()

  // Only a payment that just became 'paid' triggers the two confirmation emails.
  if (paymentStatus === 'paid' && updatedOrder) {
    const { data: items } = await supabase
      .from('order_items')
      .select('name, sku, quantity, unit_price_minor, line_total_minor')
      .eq('order_id', updatedOrder.id)

    await sendOrderEmailsIfNotAlreadySent(supabase, context.env, {
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

  return json({ received: true, status: 'processed' })
}
