import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { requireAdmin } from '../../../_lib/auth'
import { json, errorResponse, ApiError } from '../../../_lib/respond'
import type { Env } from '../../../_lib/types'

/** GET /api/admin/products/:id — Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase.from('products').select('*').eq('id', context.params.id as string).maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'Product not found.')
    return json({ product: data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** PATCH /api/admin/products/:id — update any product field, including price/stock/active/featured. Admin-only. */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const allowed: Record<string, string> = {
      slug: 'slug',
      sku: 'sku',
      name: 'name',
      shortDescription: 'short_description',
      fullDescription: 'full_description',
      priceMinor: 'price_minor',
      compareAtPriceMinor: 'compare_at_price_minor',
      categoryId: 'category_id',
      stockQuantity: 'stock_quantity',
      imageUrl: 'image_url',
      additionalImages: 'additional_images',
      isActive: 'is_active',
      isFeatured: 'is_featured',
      metadata: 'metadata',
    }

    const update: Record<string, unknown> = {}
    for (const [key, column] of Object.entries(allowed)) {
      if (key in body) update[column] = body[key]
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'Nothing to update.')

    if (
      typeof update.compare_at_price_minor === 'number' &&
      typeof update.price_minor === 'number' &&
      update.compare_at_price_minor < update.price_minor
    ) {
      throw new ApiError(422, 'Compare-at price must not be lower than the price.')
    }

    const { data, error } = await supabase
      .from('products')
      .update(update)
      .eq('id', context.params.id as string)
      .select('*')
      .maybeSingle()

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'A product with that slug or SKU already exists.')
      throw error
    }
    if (!data) throw new ApiError(404, 'Product not found.')

    return json({ product: data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** DELETE /api/admin/products/:id — deactivates the product (soft delete; preserves order history integrity). Admin-only. */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', context.params.id as string)
      .select('id')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'Product not found.')
    return json({ deactivated: true })
  } catch (error) {
    return errorResponse(error)
  }
}
