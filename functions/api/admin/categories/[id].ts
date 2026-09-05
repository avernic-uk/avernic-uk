import { getSupabaseAdmin } from '../../../_lib/supabaseAdmin'
import { requireAdmin } from '../../../_lib/auth'
import { json, errorResponse, ApiError } from '../../../_lib/respond'
import type { Env } from '../../../_lib/types'

const UNCATEGORISED_SLUG = 'uncategorised'

/** GET /api/admin/categories/:id — Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const { data, error } = await supabase.from('product_categories').select('*').eq('id', context.params.id as string).maybeSingle()
    if (error) throw error
    if (!data) throw new ApiError(404, 'Category not found.')
    return json({ category: data })
  } catch (error) {
    return errorResponse(error)
  }
}

/** PATCH /api/admin/categories/:id — update slug/name/description/sortOrder. Admin-only. */
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const allowed: Record<string, string> = {
      slug: 'slug',
      name: 'name',
      description: 'description',
      sortOrder: 'sort_order',
    }

    const update: Record<string, unknown> = {}
    for (const [key, column] of Object.entries(allowed)) {
      if (key in body) update[column] = body[key]
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'Nothing to update.')
    if (typeof update.slug === 'string') update.slug = update.slug.trim().toLowerCase()
    if (typeof update.name === 'string' && !update.name.trim()) throw new ApiError(422, 'Name is required.')
    if (typeof update.slug === 'string' && !/^[a-z0-9-]+$/.test(update.slug)) {
      throw new ApiError(422, 'Slug may only contain lowercase letters, numbers and hyphens.')
    }

    const { data, error } = await supabase
      .from('product_categories')
      .update(update)
      .eq('id', context.params.id as string)
      .select('*')
      .maybeSingle()

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'A category with that slug already exists.')
      throw error
    }
    if (!data) throw new ApiError(404, 'Category not found.')

    return json({ category: data })
  } catch (error) {
    return errorResponse(error)
  }
}

/**
 * DELETE /api/admin/categories/:id — deletes the category. Any products
 * still assigned to it are first moved to the "Uncategorised" catch-all
 * category (never blocked, and never deleted along with the category).
 * Admin-only.
 */
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const id = context.params.id as string

    const { data: category, error: fetchError } = await supabase.from('product_categories').select('id, slug').eq('id', id).maybeSingle()
    if (fetchError) throw fetchError
    if (!category) throw new ApiError(404, 'Category not found.')

    if (category.slug === UNCATEGORISED_SLUG) {
      throw new ApiError(400, 'The Uncategorised category can’t be deleted.')
    }

    const { data: uncategorised, error: uncatError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', UNCATEGORISED_SLUG)
      .maybeSingle()
    if (uncatError) throw uncatError
    if (!uncategorised) throw new ApiError(500, 'The Uncategorised category is missing — cannot reassign products.')

    const { error: reassignError, count } = await supabase
      .from('products')
      .update({ category_id: uncategorised.id }, { count: 'exact' })
      .eq('category_id', id)
    if (reassignError) throw reassignError

    const { error: deleteError } = await supabase.from('product_categories').delete().eq('id', id)
    if (deleteError) throw deleteError

    return json({ deleted: true, reassignedProducts: count ?? 0 })
  } catch (error) {
    return errorResponse(error)
  }
}
