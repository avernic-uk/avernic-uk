const STEPS = [
  { key: 'basket', label: 'Basket' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'confirmation', label: 'Confirmation' },
] as const

type StepKey = (typeof STEPS)[number]['key']

/** Shared progress indicator shown across the basket → checkout → confirmation flow. */
export function CheckoutSteps({ current }: { current: StepKey }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)

  return (
    <ol aria-label="Checkout progress" className="flex items-center">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isComplete
                    ? 'bg-accent-gradient text-literal-ink shadow-glow-sm'
                    : isCurrent
                      ? 'border-2 border-accent-500 text-accent-600'
                      : 'border border-ink-300 text-ink-400'
                }`}
              >
                {isComplete ? (
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                    <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCurrent ? 'text-ink-950' : isComplete ? 'text-ink-700' : 'text-ink-400'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className={`mx-3 h-px flex-1 ${isComplete ? 'bg-accent-500/60' : 'bg-ink-200'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
