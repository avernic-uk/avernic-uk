import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Select, Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { queryProducts, getCategories, type ProductQuery } from '@/lib/api/products'
import type { Product, ProductCategory } from '@/types'

const PAGE_SIZE = 12

export default function ShopPage() {
  useDocumentMeta({
    title: 'Shop',
    description: 'Browse the full Avernic UK range of everyday healthcare and wellbeing essentials.',
  })

  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const sort = (searchParams.get('sort') as ProductQuery['sort']) ?? 'newest'
  const page = Number(searchParams.get('page') ?? '1')
  const maxPrice = searchParams.get('maxPrice') ?? ''

  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [result, setResult] = useState<{ products: Product[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    queryProducts({
      search: q || undefined,
      categorySlug: category || undefined,
      sort,
      maxPriceMinor: maxPrice ? Number(maxPrice) * 100 : undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return
        setResult(res)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong loading products.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [q, category, sort, maxPrice, page])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-ink-950">Shop</h1>
        <p className="text-sm text-ink-600">
          {q ? (
            <>
              Showing results for <span className="font-medium text-ink-900">“{q}”</span>
            </>
          ) : (
            'Browse our full range of everyday healthcare and wellbeing essentials.'
          )}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filters" className="space-y-6">
          <Select label="Category" value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select label="Sort by" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name_asc">Name: A to Z</option>
          </Select>

          <Input
            type="number"
            min={0}
            label="Max price (£)"
            placeholder="No limit"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
          />

          {(category || maxPrice || sort !== 'newest' || q) && (
            <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
              Clear filters
            </Button>
          )}
        </aside>

        <div>
          {error && (
            <Alert tone="danger" title="We couldn't load products">
              {error}
            </Alert>
          )}

          {!error && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                {loading
                  ? Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)
                  : result && result.products.length > 0
                    ? result.products.map((product) => <ProductCard key={product.id} product={product} />)
                    : null}
              </div>

              {!loading && result && result.products.length === 0 && (
                <div className="rounded-2xl border border-dashed border-ink-300 py-16 text-center">
                  <p className="text-sm font-medium text-ink-800">No products match your filters.</p>
                  <p className="mt-1 text-sm text-ink-500">Try clearing a filter or searching for something else.</p>
                </div>
              )}

              {!loading && totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-sm text-ink-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', String(page + 1))}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
