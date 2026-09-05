/**
 * Site-wide 18+ notice. Not a legal age-verification gate (cosmetic peptide
 * skincare isn't age-restricted by law) — a plain caution banner the
 * business asked to keep on every page. Rendered once in Layout.tsx, above
 * the header, so it's the first thing on every public route.
 */
export function AgeNotice() {
  return (
    <div className="border-b border-accent-500/25 bg-accent-50 text-ink-800">
      <p className="container-page flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-xs font-medium sm:text-sm">
        <span aria-hidden="true" className="font-semibold text-accent-700">
          18+
        </span>
        Our products are cosmetic skincare intended for adults aged 18 and over.
      </p>
    </div>
  )
}
