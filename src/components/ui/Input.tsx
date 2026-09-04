import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

interface FieldWrapperProps {
  label: string
  error?: string | null
  hint?: string
  required?: boolean
}

type InputProps = FieldWrapperProps & InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, id, className = '', ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span aria-hidden="true" className="text-accent-600">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={`h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-accent-500 ${
          error ? 'border-danger-500' : 'border-ink-300'
        } ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
})

type SelectProps = FieldWrapperProps & SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, id, className = '', children, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <div>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span aria-hidden="true" className="text-accent-600">
            {' '}
            *
          </span>
        )}
      </label>
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className={`h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink-900 focus-visible:outline-2 focus-visible:outline-accent-500 ${
          error ? 'border-danger-500' : 'border-ink-300'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}
    </div>
  )
})

export function Checkbox({
  label,
  id,
  error,
  ...rest
}: { label: ReactNode; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div>
      <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3 text-sm text-ink-800">
        <input
          id={fieldId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-400 text-accent-600 focus-visible:outline-2 focus-visible:outline-accent-500"
          aria-invalid={Boolean(error) || undefined}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>}
    </div>
  )
}
