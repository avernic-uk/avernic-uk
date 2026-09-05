import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-accent-500'

// `white` / `ink-*` are semantic (see tailwind.config.ts): in dark mode the
// primary button becomes a bright pill with dark text. `literal-*` colours
// are fixed, for text on backgrounds that don't change with the theme.
const variants = {
  primary:
    'bg-ink-900 text-white shadow-card hover:bg-ink-800 hover:-translate-y-px hover:shadow-card-hover active:translate-y-0 active:bg-ink-950',
  accent:
    'bg-accent-gradient text-literal-ink shadow-glow-sm hover:-translate-y-px hover:shadow-glow hover:brightness-105 active:translate-y-0 active:brightness-95',
  secondary: 'bg-ink-100 text-ink-900 hover:bg-ink-200 active:bg-ink-200',
  outline: 'border border-ink-300 text-ink-900 hover:border-accent-500/60 hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100 hover:text-ink-950',
  danger: 'bg-danger-500 text-literal-white hover:bg-danger-700',
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
