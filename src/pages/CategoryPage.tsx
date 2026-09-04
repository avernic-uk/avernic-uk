import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { queryProducts, getCategoryBySlug } from '@/lib/api/products'
import type { Product, ProductCategory } from '@/types'

export default function CategoryPage() {
  const { categorySlug = '' } = useParams()
  const [category, setCategory] = useState<ProductCategory | null | undefined>(undefined)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useDocumentMeta({
    title: category ? category.name : 'Category',
    description: category?.description ?? undefined,
  })

  useEffect(() => {
    let cancelled = false
    setCategory(undefined)
    setProducts(null)
    setError(null)

    getCategoryBySlug(categorySlug)
      .then((cat) => {
        if (cancelled) return
        setCategory(cat)
        if (!cat) return null
        return queryProducts({ categorySlug, pageSize: 24 })
      })
      .then((res) => {
        if (cancelled || !res) return
        setProducts(res.products)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Something went wrong loading this category.')
      })

    return () => {
      cancelled = true
    }
  }, [categorySlug])

  if (category === null) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">Category not found</h1>
        <p className="mt-2 text-sm text-ink-600">
          <Link to="/shop/categories" className="underline">
            Browse all categories
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink-950">{category ? category.name : <span className="inline-block h-8 w-48 animate-pulse rounded bg-ink-100" />}</h1>
      {category?.description && <p className="mt-2 max-w-2xl text-sm text-ink-600">{category.description}</p>}

      <div className="mt-8">
        {error && (
          <Alert tone="danger" title="We couldn't load this category">
            {error}
          </Alert>
        )}
        {!error && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products === null
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.length === 0
                ? <p className="col-span-full text-sm text-ink-500">No products in this category yet.</p>
                : products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  )
}
