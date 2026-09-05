import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/categories — list all categories (including empty ones), with a live product count. Admin-only. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)

    const [{ data: categories, error: catError }, { data: counts, error: countError }] = await Promise.all([
      supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('category_id'),
    ])
    if (catError) throw catError
    if (countError) throw countError

    const countByCategory = new Map<string, number>()
    for (const row of counts ?? []) {
      const id = (row as { category_id: string }).category_id
      countByCategory.set(id, (countByCategory.get(id) ?? 0) + 1)
    }

    const result = (categories ?? []).map((c) => ({ ...c, product_count: countByCategory.get(c.id) ?? 0 }))
    return json({ categories: result })
  } catch (error) {
    return errorResponse(error)
  }
}

interface CategoryInput {
  slug: string
  name: string
  description: string | null
  sortOrder: number
}

function validateCategory(body: Partial<CategoryInput>): string[] {
  const errors: string[] = []
  if (!body.slug?.trim()) errors.push('Slug is required.')
  if (body.slug && !/^[a-z0-9-]+$/.test(body.slug.trim())) errors.push('Slug may only contain lowercase letters, numbers and hyphens.')
  if (!body.name?.trim()) errors.push('Name is required.')
  return errors
}

/** POST /api/admin/categories — create a category. Admin-only. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Partial<CategoryInput> | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const errors = validateCategory(body)
    if (errors.length > 0) throw new ApiError(422, errors.join(' '))

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        slug: body.slug!.trim().toLowerCase(),
        name: body.name!.trim(),
        description: body.description?.trim() || null,
        sort_order: body.sortOrder ?? 0,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'A category with that slug already exists.')
      throw error
    }

    return json({ category: data }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
