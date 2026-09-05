import type { ReactNode } from 'react'

const tones = {
  neutral: 'bg-ink-100 text-ink-700',
  accent: 'bg-accent-100 text-accent-800 ring-1 ring-inset ring-accent-500/30',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
} as const

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
