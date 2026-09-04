import { sendViaResend } from '../_lib/email'
import { json, errorResponse, ApiError } from '../_lib/respond'
import type { Env } from '../_lib/types'

interface ContactBody {
  name: string
  email: string
  message: string
  /** Honeypot field — real users never fill this in. */
  company?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** POST /api/contact — sends the contact form to ADMIN_NOTIFICATION_EMAIL via Resend. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => null)) as ContactBody | null
    if (!body) throw new ApiError(400, 'Invalid request.')
    if (body.company) return json({ ok: true }) // honeypot tripped — pretend success, do nothing

    if (!body.name?.trim()) throw new ApiError(422, 'Please enter your name.')
    if (!body.email || !EMAIL_REGEX.test(body.email)) throw new ApiError(422, 'Please enter a valid email address.')
    if (!body.message?.trim() || body.message.trim().length < 10) throw new ApiError(422, 'Please enter your message.')

    if (!context.env.ADMIN_NOTIFICATION_EMAIL) {
      throw new ApiError(503, 'The contact form is not yet configured. Please email us directly instead.')
    }

    await sendViaResend(
      context.env,
      context.env.ADMIN_NOTIFICATION_EMAIL,
      `Avernic UK contact form — ${body.name.trim()}`,
      `<p><strong>From:</strong> ${body.name.trim()} (${body.email.trim()})</p><p>${body.message.trim().replace(/\n/g, '<br/>')}</p>`,
    )

    return json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
