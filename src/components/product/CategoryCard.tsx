import { Link } from 'react-router-dom'
import type { ProductCategory } from '@/types'

export function CategoryCard({ category }: { category: ProductCategory }) {
  return (
    <Link
      to={`/shop/${category.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-200/70 bg-ink-50 p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-500/50 hover:shadow-glow-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-500/10 blur-2xl transition-opacity duration-300 group-hover:bg-accent-500/20"
      />
      <div>
        <h3 className="font-display text-lg font-semibold text-ink-950">{category.name}</h3>
        {category.description && <p className="mt-1.5 text-sm text-ink-600">{category.description}</p>}
      </div>
      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600">
        Shop {category.name.toLowerCase()}
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
