import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { priceBasket, isDeliveryMethod } from '../../_lib/pricing'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env, BasketLine } from '../../_lib/types'

interface RequestBody {
  lines: BasketLine[]
  /** Which Royal Mail shipping option to price delivery at. Defaults to 'standard'. */
  shippingMethod?: string
}

/**
 * POST /api/basket/price
 *
 * The server is the ONLY source of truth for prices and totals. The browser
 * sends product ids + quantities (and which shipping method the customer
 * currently has selected); everything else (unit price, availability,
 * subtotal, delivery, total) is derived here from the database, never
 * trusted from the request.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json().catch(() => null)) as RequestBody | null
    if (!body || !Array.isArray(body.lines)) {
      throw new ApiError(400, 'Invalid basket.')
    }
    const shippingMethod = isDeliveryMethod(body.shippingMethod) ? body.shippingMethod : 'standard'
    const supabase = getSupabaseAdmin(context.env)
    const priced = await priceBasket(supabase, body.lines, shippingMethod)
    return json(priced)
  } catch (error) {
    return errorResponse(error)
  }
}
