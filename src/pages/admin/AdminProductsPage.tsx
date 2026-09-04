import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminFetchJson } from '@/lib/api/adminFetch'
import { formatGBP } from '@/lib/format'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink, Button } from '@/components/ui/Button'

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

export default function AdminProductsPage() {
  useDocumentMeta({ title: 'Products — Admin' })
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''

  const [products, setProducts] = useState<ProductRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    const qs = new URLSearchParams()
    if (search) qs.set('search', search)
    adminFetchJson<{ products: ProductRow[] }>(`/api/admin/products?${qs}`)
      .then((res) => setProducts(res.products))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [search])

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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-950">Products</h1>
        <ButtonLink to="/admin/products/new" variant="accent">
          New product
        </ButtonLink>
      </div>

      <div className="mt-6 max-w-sm">
        <Input
          label="Search products"
          value={search}
          onChange={(e) => setSearchParams(e.target.value ? { search: e.target.value } : {})}
        />
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
    </div>
  )
}
