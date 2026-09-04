import { getSupabaseAdmin } from '../../_lib/supabaseAdmin'
import { requireAdmin } from '../../_lib/auth'
import { json, errorResponse, ApiError } from '../../_lib/respond'
import type { Env } from '../../_lib/types'

/** GET /api/admin/products?search=&categoryId=&page= — Admin-only product list (includes inactive). */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const url = new URL(context.request.url)
    const search = url.searchParams.get('search')?.trim()
    const categoryId = url.searchParams.get('categoryId')
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = 25

    let query = supabase.from('products').select('*, product_categories(name, slug)', { count: 'exact' })
    if (search) query = query.ilike('name', `%${search}%`)
    if (categoryId) query = query.eq('category_id', categoryId)

    const rangeFrom = (page - 1) * pageSize
    const { data, error, count } = await query.order('updated_at', { ascending: false }).range(rangeFrom, rangeFrom + pageSize - 1)
    if (error) throw error

    return json({ products: data ?? [], total: count ?? 0, page, pageSize })
  } catch (error) {
    return errorResponse(error)
  }
}

interface ProductInput {
  slug: string
  sku: string
  name: string
  shortDescription: string
  fullDescription: string
  priceMinor: number
  compareAtPriceMinor: number | null
  categoryId: string
  stockQuantity: number
  imageUrl: string
  additionalImages: { url: string; alt: string }[]
  isActive: boolean
  isFeatured: boolean
}

function validateProduct(body: Partial<ProductInput>): string[] {
  const errors: string[] = []
  if (!body.slug?.trim()) errors.push('Slug is required.')
  if (!body.sku?.trim()) errors.push('SKU is required.')
  if (!body.name?.trim()) errors.push('Name is required.')
  if (!body.categoryId) errors.push('Category is required.')
  if (typeof body.priceMinor !== 'number' || body.priceMinor < 0) errors.push('A valid price is required.')
  if (
    typeof body.compareAtPriceMinor === 'number' &&
    typeof body.priceMinor === 'number' &&
    body.compareAtPriceMinor < body.priceMinor
  ) {
    errors.push('Compare-at price must not be lower than the price.')
  }
  if (typeof body.stockQuantity !== 'number' || body.stockQuantity < 0) errors.push('A valid stock quantity is required.')
  return errors
}

/** POST /api/admin/products — create a product. Admin-only. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env)
    const supabase = getSupabaseAdmin(context.env)
    const body = (await context.request.json().catch(() => null)) as Partial<ProductInput> | null
    if (!body) throw new ApiError(400, 'Invalid request.')

    const errors = validateProduct(body)
    if (errors.length > 0) throw new ApiError(422, errors.join(' '))

    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: body.slug!.trim(),
        sku: body.sku!.trim(),
        name: body.name!.trim(),
        short_description: body.shortDescription ?? '',
        full_description: body.fullDescription ?? '',
        price_minor: body.priceMinor,
        compare_at_price_minor: body.compareAtPriceMinor ?? null,
        category_id: body.categoryId,
        stock_quantity: body.stockQuantity,
        image_url: body.imageUrl ?? '',
        additional_images: body.additionalImages ?? [],
        is_active: body.isActive ?? true,
        is_featured: body.isFeatured ?? false,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'A product with that slug or SKU already exists.')
      throw error
    }

    return json({ product: data }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
