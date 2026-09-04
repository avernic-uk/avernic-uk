import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent-500'

const variants = {
  primary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
  accent: 'bg-accent-500 text-ink-950 hover:bg-accent-400 active:bg-accent-600',
  secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-200',
  outline: 'border border-ink-300 text-ink-900 hover:border-ink-500 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'bg-danger-500 text-white hover:bg-danger-700',
} as const

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
} as const

type Variant = keyof typeof variants
type Size = keyof typeof sizes

interface ButtonOwnProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

type ButtonProps = ButtonOwnProps & ButtonHTMLAttributes<HTMLButtonElement>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
})

type ButtonLinkProps = ButtonOwnProps & LinkProps

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  )
}
