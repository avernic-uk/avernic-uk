export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-ink-100 ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-3">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}
