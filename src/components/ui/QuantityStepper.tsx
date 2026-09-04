interface QuantityStepperProps {
  quantity: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
  label?: string
}

export function QuantityStepper({ quantity, onChange, min = 1, max = 99, label = 'Quantity' }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-ink-300">
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={quantity <= min}
        onClick={() => onChange(Math.max(min, quantity - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-ink-700 disabled:opacity-30 hover:bg-ink-100"
      >
        −
      </button>
      <span aria-live="polite" className="w-8 text-center text-sm font-medium text-ink-900">
        {quantity}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-ink-700 disabled:opacity-30 hover:bg-ink-100"
      >
        +
      </button>
    </div>
  )
}
