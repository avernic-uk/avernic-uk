import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { getCategories } from '@/lib/api/products'
import { formatGBP } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink, Button } from '@/components/ui/Button'
import type { ProductCategory } from '@/types'

interface ProductRow {
  id: string
  sku: string
  name: string
  price_minor: number
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  product_categories: { name: string } | null
}

const PAGE_SIZE = 25

export default function AdminProductsPage() {
  useDocumentMeta({ title: 'Products — Admin', noindex: true })
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const page = Number(searchParams.get('page') ?? '1')

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [products, setProducts] = useState<ProductRow[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  function load() {
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    if (categoryId) qs.set('categoryId', categoryId)
    qs.set('page', String(page))
    adminFetchJson<{ products: ProductRow[]; total: number }>(`/api/admin/products?${qs}`)
      .then((res) => {
        setProducts(res.products)
        setTotal(res.total)
      })
      .catch((err) => setError(err.message))
  }

  useEffect(load, [search, categoryId, page])

  function updateParams(next: Record<string, string>) {
    const merged = { search, categoryId, ...next }
    const qs: Record<string, string> = {}
    if (merged.search) qs.search = merged.search
    if (merged.categoryId) qs.categoryId = merged.categoryId
    // Any filter change resets pagination back to page 1.
    setSearchParams(qs)
  }

  async function toggleActive(product: ProductRow) {
    try {
      await adminFetchJson(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !product.is_active }),
      })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update product.')
    }
  }

  function goToPage(next: number) {
    const qs: Record<string, string> = {}
    if (search) qs.search = search
    if (categoryId) qs.categoryId = categoryId
    qs.page = String(next)
    setSearchParams(qs)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-950">Products</h1>
        <ButtonLink to="/admin/products/new" variant="accent">
          New product
        </ButtonLink>
      </div>

      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <Input label="Search products" value={search} onChange={(e) => updateParams({ search: e.target.value })} />
        <Select label="Category" value={categoryId} onChange={(e) => updateParams({ categoryId: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => (
              <tr key={product.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                <td className="px-4 py-3">
                  <Link to={`/admin/products/${product.id}`} className="font-medium text-ink-900 underline">
                    {product.name}
                  </Link>
                  <p className="text-xs text-ink-400">{product.sku}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">{product.product_categories?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right">{formatGBP(product.price_minor)}</td>
                <td className="px-4 py-3 text-right">{product.stock_quantity}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Badge tone={product.is_active ? 'success' : 'neutral'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
                    {product.is_featured && <Badge tone="accent">Featured</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(product)}>
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
            {products && products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-ink-500">
            Page {page} of {totalPages} · {total} product{total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
