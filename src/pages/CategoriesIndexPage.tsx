import { useEffect, useState } from 'react'
import { CategoryCard } from '@/components/product/CategoryCard'
import { useDocumentMeta } from '@/lib/useDocumentMeta'
import { getCategories } from '@/lib/api/products'
import type { ProductCategory } from '@/types'

export default function CategoriesIndexPage() {
  useDocumentMeta({ title: 'Categories', description: 'Browse the Avernic UK range by category.' })
  const [categories, setCategories] = useState<ProductCategory[] | null>(null)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink-950">Categories</h1>
      <p className="mt-2 text-sm text-ink-600">Browse our range by category.</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories === null
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-ink-100" />)
          : categories.map((category) => <CategoryCard key={category.id} category={category} />)}
      </div>
    </div>
  )
}
