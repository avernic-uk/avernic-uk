import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { reconcileFenaPayment } from '../../../_lib/paymentReconciliation'
import { json } from '../../../_lib/respond'
import type { Env } from '../../../_lib/types'

/**
 * POST /api/payments/fena/webhook
 *
 * Fena's exact webhook payload shape and signature scheme are not publicly
 * documented (see functions/_lib/fena.ts for what IS confirmed, from Fena's
 * own PHP SDK). Rather than invent a signature check for a payments
 * webhook — which would be worse than not trusting it — this handler
 * treats the webhook purely as a "something changed for this payment, go
 * check" TRIGGER. It never reads a status out of the request body and acts
 * on it directly. The only thing it takes from the body is a best-effort
 * guess at which payment the notification is about (tried against a few
 * plausible field names, per Fena's SDK field list); the actual status is
 * always then fetched fresh, server-to-server, from Fena's own public
 * status endpoint.
 *
 * A shared secret query parameter (?key=...) is required, matched against
 * FENA_WEBHOOK_SHARED_SECRET, purely to stop random internet traffic from
 * spamming this endpoint into making needless upstream calls — set the
 * Fena dashboard's "payment notification URL" to include it, e.g.
 * https://avernic-uk.pages.dev/api/payments/fena/webhook?key=<secret>.
 * This is NOT a substitute for verifying the payload is genuinely from
 * Fena (nothing here claims it is) — it's why the body is never trusted.
 *
 * IDEMPOTENCY: safe to call repeatedly / out of order for the same
 * payment — reconcileFenaPayment() no-ops once a payment is 'paid', and
 * order-confirmation emails are additionally guarded by the email_events
 * unique (order_id, email_type) index.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (context.env.FENA_WEBHOOK_SHARED_SECRET) {
    const key = new URL(context.request.url).searchParams.get('key')
    if (key !== context.env.FENA_WEBHOOK_SHARED_SECRET) {
      return json({ error: 'Invalid webhook request.' }, { status: 400 })
    }
  }

  const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null

  // Best-effort: Fena's own SDK (NotificationHandler) reads $token['orderID']
  // for what it calls the order id — for this integration that is expected
  // to be the short Fena reference generated in fena.ts and stored as
  // payments.provider_reference. A few alternate field names are tried
  // since the exact payload shape isn't confirmed publicly.
  const reference =
    (body?.orderID as string | undefined) ??
    (body?.reference as string | undefined) ??
    (body?.orderId as string | undefined) ??
    null

  if (!reference) {
    // Can't tell which payment this is about. Acknowledge so Fena doesn't
    // retry forever, but there's nothing to reconcile.
    return json({ received: true, status: 'no_reference_in_payload' })
  }

  const supabase = getSupabaseAdmin(context.env)
  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, order_id, status, fena_hashed_id')
    .eq('provider', 'fena')
    .eq('provider_reference', reference)
    .maybeSingle()

  if (error || !payment) {
    return json({ received: true, status: 'unknown_reference' })
  }

  try {
    await reconcileFenaPayment(supabase, context.env, payment)
  } catch (reconcileError) {
    // eslint-disable-next-line no-console
    console.error('[fena webhook] reconciliation failed:', reconcileError)
    // Still 200 — Fena's retry behaviour on non-2xx is unknown, and the
    // order-confirmation page's own reconciliation call is the backstop.
  }

  return json({ received: true, status: 'processed' })
}
