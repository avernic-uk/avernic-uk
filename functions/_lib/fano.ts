import type { Env } from './types'

// ============================================================================
// Fano Open Banking — payment provider adapter
//
// STATUS: NOT YET INTEGRATED. This file defines the boundary the rest of the
// application talks to, so that once Avernic UK has real Fano API
// documentation and credentials, only this file (plus the webhook handler in
// functions/api/payments/fano/webhook.ts) needs to be filled in — nothing
// else in the codebase needs to change.
//
// Per the build brief for this project, this integration must NOT invent:
//   - Fano API base URLs / endpoint paths
//   - Request or response field names
//   - Authentication mechanism (API key header vs OAuth2 client-credentials
//     vs signed requests, etc.)
//   - Webhook payload shape or signature scheme
// None of the above are guessed here. What IS real and load-bearing:
//   - The order/payment status machine (pending -> processing -> paid/failed)
//   - Idempotency (payments.provider_reference has a unique index; webhook
//     handling upserts on it rather than blindly inserting)
//   - Where secrets live (env vars, server-only, never in the frontend bundle)
//
// TO FINISH THIS INTEGRATION, you need from Fano:
//   1. API base URL(s) for sandbox and production.
//   2. How to authenticate server-to-server (client id/secret grant? static
//      API key? mTLS?) — env vars FANO_CLIENT_ID / FANO_CLIENT_SECRET below
//      are placeholders for whatever that turns out to be.
//   3. The "create payment" request: exact endpoint, required fields (likely
//      something like amount, currency, a merchant reference, return/redirect
//      URLs, description) and the exact response shape (a redirect URL the
//      customer is sent to, and a payment/session id to store).
//   4. The "get payment status" endpoint, if polling is supported/required
//      in addition to webhooks.
//   5. The webhook: what Fano POSTs on payment completion, and how to verify
//      the request really came from Fano (signature header + algorithm, or
//      IP allow-listing, or a shared secret in the payload).
//   6. Fano's status vocabulary, mapped below to Avernic UK's own
//      PaymentStatus so the rest of the app never has to know Fano's exact
//      terms.
// ============================================================================

export class FanoNotConfiguredError extends Error {
  constructor() {
    super(
      'Fano Open Banking is not yet configured for this environment. ' +
        'Set FANO_API_BASE_URL, FANO_CLIENT_ID, FANO_CLIENT_SECRET and ' +
        'FANO_WEBHOOK_SIGNING_SECRET, and implement the calls in ' +
        'functions/_lib/fano.ts against the official Fano API documentation.',
    )
  }
}

export interface CreateFanoPaymentRequest {
  /** Avernic UK's own order number — pass through as Fano's merchant reference, if supported. */
  reference: string
  amountMinor: number
  currency: 'GBP'
  description: string
  returnUrl: string
  cancelUrl: string
}

export interface CreateFanoPaymentResult {
  /** Fano's own identifier for this payment/session — stored in payments.provider_reference. */
  providerReference: string
  /** URL to send the customer to in order to authorise payment with their bank. */
  redirectUrl: string
}

function isFanoConfigured(env: Env): boolean {
  return Boolean(env.FANO_API_BASE_URL && env.FANO_CLIENT_ID && env.FANO_CLIENT_SECRET)
}

/**
 * Creates a Fano Open Banking payment for an order.
 *
 * NOT IMPLEMENTED: throws FanoNotConfiguredError until the real Fano API
 * documentation is available and this function is written against it. The
 * caller (functions/api/checkout/create-order.ts) already handles this
 * gracefully — the order is still created as pending_payment, and the
 * customer is shown a clear "payment is not available yet" message rather
 * than a fake success.
 */
export async function createFanoPayment(
  env: Env,
  _req: CreateFanoPaymentRequest,
): Promise<CreateFanoPaymentResult> {
  if (!isFanoConfigured(env)) {
    throw new FanoNotConfiguredError()
  }

  // TODO: replace with a real call once Fano's API documentation is
  // available, e.g. (illustrative only — endpoint/fields are NOT confirmed):
  //
  //   const res = await fetch(`${env.FANO_API_BASE_URL}/<documented-endpoint>`, {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer <token from documented auth flow>`, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ /* documented fields */ }),
  //   })
  //   if (!res.ok) throw new Error(`Fano payment creation failed (${res.status})`)
  //   const data = await res.json()
  //   return { providerReference: data.<documented id field>, redirectUrl: data.<documented url field> }
  //
  throw new FanoNotConfiguredError()
}

export type NormalisedFanoStatus = 'processing' | 'paid' | 'failed' | 'cancelled' | 'expired'

/**
 * Verifies an inbound Fano webhook request is authentic and returns its
 * normalised payload. NOT IMPLEMENTED — the exact signature scheme (header
 * name, algorithm, signed payload format) must come from Fano's docs before
 * this can be written; guessing one here would be worse than refusing.
 */
export async function verifyAndParseFanoWebhook(
  _request: Request,
  env: Env,
): Promise<{ providerReference: string; status: NormalisedFanoStatus; raw: unknown }> {
  if (!env.FANO_WEBHOOK_SIGNING_SECRET) {
    throw new FanoNotConfiguredError()
  }
  // TODO: verify the request signature against FANO_WEBHOOK_SIGNING_SECRET
  // using Fano's documented scheme, THEN parse and map their status field
  // onto NormalisedFanoStatus. Do not process the payload before the
  // signature is verified.
  throw new FanoNotConfiguredError()
}
