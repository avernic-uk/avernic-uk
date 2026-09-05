import { supabase } from '@/lib/supabaseClient'
import type { Product, ProductCategory } from '@/types'

interface ProductRow {
  id: string
  slug: string
  sku: string
  name: string
  short_description: string
  full_description: string
  size_label: string | null
  key_ingredients: string | null
  how_to_use: string | null
  suitability: string | null
  ingredients_inci: string | null
  price_minor: number
  compare_at_price_minor: number | null
  category_id: string
  stock_quantity: number
  image_url: string
  additional_images: { url: string; alt: string }[] | null
  is_active: boolean
  is_featured: boolean
  metadata: Record<string, string> | null
  created_at: string
  updated_at: string
  product_categories?: { slug: string } | null
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    // Nullish-coalesced so the storefront keeps working against a database
    // where migration 0007 has not been applied yet.
    sizeLabel: row.size_label ?? '',
    keyIngredients: row.key_ingredients ?? '',
    howToUse: row.how_to_use ?? '',
    suitability: row.suitability ?? '',
    ingredientsInci: row.ingredients_inci ?? '',
    priceMinor: row.price_minor,
    compareAtPriceMinor: row.compare_at_price_minor,
    categoryId: row.category_id,
    categorySlug: row.product_categories?.slug ?? '',
    stockQuantity: row.stock_quantity,
    imageUrl: row.image_url,
    additionalImages: row.additional_images ?? [],
    isActive: row.is_active,
    isFeatured: row.is_featured,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const PRODUCT_SELECT = '*, product_categories(slug)'

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data as unknown as ProductRow[]).map(mapProduct)
}

export interface ProductQuery {
  search?: string
  categorySlug?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc'
  minPriceMinor?: number
  maxPriceMinor?: number
  page?: number
  pageSize?: number
}

export interface ProductQueryResult {
  products: Product[]
  total: number
  page: number
  pageSize: number
}

export async function queryProducts(query: ProductQuery): Promise<ProductQueryResult> {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 12
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let builder = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)

  if (query.categorySlug) {
    // Filter via the joined category slug.
    const { data: cat } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', query.categorySlug)
      .maybeSingle()
    if (!cat) return { products: [], total: 0, page, pageSize }
    builder = builder.eq('category_id', cat.id)
  }

  if (query.search) {
    builder = builder.or(`name.ilike.%${query.search}%,short_description.ilike.%${query.search}%`)
  }

  if (typeof query.minPriceMinor === 'number') {
    builder = builder.gte('price_minor', query.minPriceMinor)
  }
  if (typeof query.maxPriceMinor === 'number') {
    builder = builder.lte('price_minor', query.maxPriceMinor)
  }

  switch (query.sort) {
    case 'price_asc':
      builder = builder.order('price_minor', { ascending: true })
      break
    case 'price_desc':
      builder = builder.order('price_minor', { ascending: false })
      break
    case 'name_asc':
      builder = builder.order('name', { ascending: true })
      break
    default:
      builder = builder.order('created_at', { ascending: false })
  }

  const { data, error, count } = await builder.range(from, to)
  if (error) throw new Error(error.message)

  return {
    products: (data as unknown as ProductRow[]).map(mapProduct),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return mapProduct(data as unknown as ProductRow)
}

export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .neq('id', excludeProductId)
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data as unknown as ProductRow[]).map(mapProduct)
}

export async function getCategories(): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }))
}

export async function getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  const { data, error } = await supabase.from('product_categories').select('*').eq('slug', slug).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return { id: data.id, slug: data.slug, name: data.name, description: data.description, sortOrder: data.sort_order }
}
