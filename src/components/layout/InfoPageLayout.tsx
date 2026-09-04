import type { ReactNode } from 'react'
import { useDocumentMeta } from '@/lib/useDocumentMeta'

export function InfoPageLayout({
  title,
  description,
  lastUpdated,
  children,
}: {
  title: string
  description?: string
  lastUpdated?: string
  children: ReactNode
}) {
  useDocumentMeta({ title, description })
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <h1 className="text-3xl font-semibold text-ink-950">{title}</h1>
      {lastUpdated && <p className="mt-2 text-xs text-ink-500">Last updated: {lastUpdated}</p>}
      <div className="prose-avernic mt-8 space-y-6 text-sm leading-relaxed text-ink-700">{children}</div>
    </div>
  )
}

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-accent-100 px-1.5 py-0.5 font-medium text-accent-800">[{children}]</span>
  )
}
