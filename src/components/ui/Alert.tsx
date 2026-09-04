import type { ReactNode } from 'react'

const tones = {
  info: { wrap: 'bg-ink-50 border-ink-200 text-ink-800', icon: 'ℹ' },
  success: { wrap: 'bg-success-50 border-success-500/30 text-success-700', icon: '✓' },
  warning: { wrap: 'bg-warning-50 border-warning-500/30 text-warning-700', icon: '!' },
  danger: { wrap: 'bg-danger-50 border-danger-500/30 text-danger-700', icon: '✕' },
} as const

interface AlertProps {
  tone?: keyof typeof tones
  title?: string
  children: ReactNode
}

export function Alert({ tone = 'info', title, children }: AlertProps) {
  const t = tones[tone]
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border p-4 text-sm ${t.wrap}`}>
      <span aria-hidden="true" className="mt-0.5 font-semibold">
        {t.icon}
      </span>
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  )
}
