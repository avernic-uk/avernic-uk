import type { SupabaseClient } from '@supabase/supabase-js'
import type { Env, Address, PaymentStatus, OrderStatus } from './types'

interface OrderItemForEmail {
  name: string
  sku: string
  quantity: number
  unitPriceMinor: number
  lineTotalMinor: number
}

interface OrderForEmail {
  id: string
  orderNumber: string
  email: string
  telephone: string
  deliveryAddress: Address
  items: OrderItemForEmail[]
  subtotalMinor: number
  deliveryMinor: number
  totalMinor: number
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  createdAt: string
}

function gbp(minor: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(minor / 100)
}

function ukDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

function itemsTableHtml(items: OrderItemForEmail[]): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">${item.name}<br/><span style="color:#8f929e;font-size:12px;">SKU: ${item.sku}</span></td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${gbp(item.unitPriceMinor)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${gbp(item.lineTotalMinor)}</td>
        </tr>`,
    )
    .join('')
  return `
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;color:#1c1c22;">
      <thead>
        <tr>
          <th align="left" style="padding-bottom:8px;border-bottom:2px solid #1c1c22;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#585a68;">Product</th>
          <th align="center" style="padding-bottom:8px;border-bottom:2px solid #1c1c22;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#585a68;">Qty</th>
          <th align="right" style="padding-bottom:8px;border-bottom:2px solid #1c1c22;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#585a68;">Price</th>
          <th align="right" style="padding-bottom:8px;border-bottom:2px solid #1c1c22;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#585a68;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function totalsHtml(order: OrderForEmail): string {
  return `
    <table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;color:#1c1c22;margin-top:12px;">
      <tr><td style="padding:4px 0;color:#585a68;">Subtotal</td><td style="padding:4px 0;text-align:right;">${gbp(order.subtotalMinor)}</td></tr>
      <tr><td style="padding:4px 0;color:#585a68;">Delivery</td><td style="padding:4px 0;text-align:right;">${order.deliveryMinor === 0 ? 'Free' : gbp(order.deliveryMinor)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;border-top:1px solid #eee;">Total</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #eee;">${gbp(order.totalMinor)}</td></tr>
    </table>`
}

function addressHtml(address: Address): string {
  return [address.fullName, address.line1, address.line2, address.townCity, address.county, address.postcode, address.country]
    .filter(Boolean)
    .join('<br/>')
}

function emailShell(preheader: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en-GB">
  <body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" style="background:#f7f7f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eeeef0;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #eeeef0;">
                <span style="font-size:18px;font-weight:600;color:#101014;">Avernic <span style="color:#8f6c27;">UK</span></span>
              </td>
            </tr>
            <tr><td style="padding:32px;">${bodyHtml}</td></tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #eeeef0;color:#8f929e;font-size:12px;">
                Avernic UK — UK delivery only. Questions? Visit our Contact page or reply to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function customerConfirmationHtml(order: OrderForEmail): string {
  return emailShell(
    `Order confirmation — #${order.orderNumber}`,
    `
    <h1 style="font-size:20px;margin:0 0 8px;color:#101014;">Thank you for your order</h1>
    <p style="font-size:14px;color:#474854;line-height:1.6;">
      We've received your order and it's being processed. Here's your confirmation.
    </p>
    <table role="presentation" style="margin:20px 0;font-size:14px;">
      <tr><td style="color:#585a68;padding-right:16px;">Order number</td><td style="font-weight:600;">${order.orderNumber}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Date</td><td>${ukDate(order.createdAt)}</td></tr>
    </table>
    ${itemsTableHtml(order.items)}
    ${totalsHtml(order)}
    <h2 style="font-size:14px;margin:28px 0 8px;color:#101014;">Delivery address</h2>
    <p style="font-size:14px;color:#474854;line-height:1.6;">${addressHtml(order.deliveryAddress)}</p>
    <h2 style="font-size:14px;margin:28px 0 8px;color:#101014;">What happens next</h2>
    <p style="font-size:14px;color:#474854;line-height:1.6;">
      We'll get your order ready and dispatch it to the address above. You can check your order
      status at any time from your Avernic UK account.
    </p>
    <h2 style="font-size:14px;margin:28px 0 8px;color:#101014;">Need help?</h2>
    <p style="font-size:14px;color:#474854;line-height:1.6;">
      Contact us via the Contact page on avernic.co.uk and quote your order number.
    </p>
    `,
  )
}

function businessNotificationHtml(order: OrderForEmail, adminOrderUrl: string): string {
  return emailShell(
    `New order — #${order.orderNumber}`,
    `
    <h1 style="font-size:20px;margin:0 0 8px;color:#101014;">New Avernic UK order</h1>
    <table role="presentation" style="margin:16px 0;font-size:14px;">
      <tr><td style="color:#585a68;padding-right:16px;">Order number</td><td style="font-weight:600;">${order.orderNumber}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Date/time</td><td>${ukDate(order.createdAt)}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Customer</td><td>${order.deliveryAddress.fullName}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Email</td><td>${order.email}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Telephone</td><td>${order.telephone}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Payment status</td><td>${order.paymentStatus}</td></tr>
      <tr><td style="color:#585a68;padding-right:16px;">Order status</td><td>${order.orderStatus}</td></tr>
    </table>
    ${itemsTableHtml(order.items)}
    ${totalsHtml(order)}
    <h2 style="font-size:14px;margin:28px 0 8px;color:#101014;">Delivery address</h2>
    <p style="font-size:14px;color:#474854;line-height:1.6;">${addressHtml(order.deliveryAddress)}</p>
    <p style="margin-top:24px;"><a href="${adminOrderUrl}" style="color:#8f6c27;font-weight:600;">View order in admin →</a></p>
    `,
  )
}

export async function sendViaResend(env: Env, to: string, subject: string, html: string): Promise<string | null> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    // eslint-disable-next-line no-console
    console.warn('[email] RESEND_API_KEY / RESEND_FROM_EMAIL not configured — skipping send.', { to, subject })
    return null
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Avernic UK <${env.RESEND_FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend send failed (${res.status}): ${body}`)
  }
  const data = (await res.json()) as { id?: string }
  return data.id ?? null
}

/**
 * Sends both the customer confirmation and business notification emails for
 * an order that has JUST become verified-paid, idempotently. Each email
 * type is recorded in email_events (order_id, email_type) with a unique
 * index — a duplicate call (e.g. a retried/duplicate Fena webhook) will
 * fail the insert for an already-sent type and simply skip re-sending it,
 * rather than sending twice.
 */
export async function sendOrderEmailsIfNotAlreadySent(
  supabase: SupabaseClient,
  env: Env,
  order: OrderForEmail,
): Promise<{ customerSent: boolean; businessSent: boolean }> {
  const result = { customerSent: false, businessSent: false }

  // Customer confirmation
  {
    const { error: insertError } = await supabase
      .from('email_events')
      .insert({ order_id: order.id, email_type: 'customer_confirmation' })
    if (!insertError) {
      const messageId = await sendViaResend(
        env,
        order.email,
        `Order confirmation — #${order.orderNumber}`,
        customerConfirmationHtml(order),
      )
      if (messageId) {
        await supabase
          .from('email_events')
          .update({ resend_message_id: messageId })
          .eq('order_id', order.id)
          .eq('email_type', 'customer_confirmation')
      }
      result.customerSent = true
    }
    // insertError (unique violation) means this email type was already sent — skip silently.
  }

  // Business notification
  if (env.ADMIN_NOTIFICATION_EMAIL) {
    const { error: insertError } = await supabase
      .from('email_events')
      .insert({ order_id: order.id, email_type: 'business_notification' })
    if (!insertError) {
      const adminOrderUrl = `${env.SITE_URL}/admin/orders/${order.id}`
      const messageId = await sendViaResend(
        env,
        env.ADMIN_NOTIFICATION_EMAIL,
        `New Avernic UK order — #${order.orderNumber}`,
        businessNotificationHtml(order, adminOrderUrl),
      )
      if (messageId) {
        await supabase
          .from('email_events')
          .update({ resend_message_id: messageId })
          .eq('order_id', order.id)
          .eq('email_type', 'business_notification')
      }
      result.businessSent = true
    }
  }

  return result
}
