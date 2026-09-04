import { Link } from 'react-router-dom'
import type { ProductCategory } from '@/types'

export function CategoryCard({ category }: { category: ProductCategory }) {
  return (
    <Link
      to={`/shop/${category.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-ink-200/70 bg-ink-50 p-6 transition-colors hover:border-accent-300 hover:bg-accent-50"
    >
      <div>
        <h3 className="font-display text-lg font-semibold text-ink-950">{category.name}</h3>
        {category.description && <p className="mt-1.5 text-sm text-ink-600">{category.description}</p>}
      </div>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-900">
        Shop {category.name.toLowerCase()}
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
