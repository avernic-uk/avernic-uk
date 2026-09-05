import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function SearchBar({ className = '', autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop')
  }

  return (
    <form role="search" onSubmit={onSubmit} className={className}>
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <div className="relative">
        <input
          id="site-search"
          type="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="h-10 w-full rounded-full border border-ink-300/80 bg-ink-50 pl-4 pr-10 text-sm text-ink-900 transition-colors placeholder:text-ink-400 hover:border-ink-400 focus:bg-white dark:focus:bg-ink-100 focus-visible:outline-2 focus-visible:outline-accent-500"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
              d="M9 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm10 3-4.35-4.35"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
