import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-ink-200/70 bg-white shadow-card transition-[box-shadow,border-color] dark:bg-ink-50 ${className}`}
      {...rest}
    />
  )
}

export function CardBody({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 sm:p-6 ${className}`} {...rest} />
}
