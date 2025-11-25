import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * Form field group with label, input, hint, and error.
 * Standard pattern for all form inputs.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   hint="We'll never share your email"
 *   error={errors.email}
 *   required
 * >
 *   <Input
 *     type="email"
 *     placeholder="you@buffalo.edu"
 *     {...register('email')}
 *   />
 * </FormField>
 * ```
 */
interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const id = React.useId()

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-text-primary"
      >
        {label}
        {required && <span className="text-status-error ml-1">*</span>}
      </label>

      {React.isValidElement(children) &&
        React.cloneElement(children, {
          id,
          'aria-describedby': hint || error ? `${id}-description` : undefined,
          'aria-invalid': !!error,
        } as any)}

      {(hint || error) && (
        <p
          id={`${id}-description`}
          className={cn(
            'text-xs',
            error ? 'text-status-error' : 'text-text-tertiary'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}

/**
 * Inline form field for compact layouts (label and input on same row).
 */
export function InlineFormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const id = React.useId()

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-4">
        <label
          htmlFor={id}
          className="text-sm font-medium text-text-primary w-32 shrink-0"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>

        <div className="flex-1">
          {React.isValidElement(children) &&
            React.cloneElement(children, {
              id,
              'aria-describedby': hint || error ? `${id}-description` : undefined,
              'aria-invalid': !!error,
            } as any)}
        </div>
      </div>

      {(hint || error) && (
        <p
          id={`${id}-description`}
          className={cn(
            'text-xs ml-36',
            error ? 'text-status-error' : 'text-text-tertiary'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}

/**
 * Form section with title and description.
 */
interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

/**
 * Form actions row (submit, cancel buttons).
 */
interface FormActionsProps {
  children: React.ReactNode
  align?: 'left' | 'right' | 'between'
  className?: string
}

export function FormActions({
  children,
  align = 'right',
  className,
}: FormActionsProps) {
  const alignmentClasses = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-border-subtle',
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Checkbox group with label and optional hint.
 */
interface CheckboxGroupProps {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}

export function CheckboxGroup({
  label,
  hint,
  children,
  className,
}: CheckboxGroupProps) {
  return (
    <fieldset className={cn('space-y-3', className)}>
      <legend className="text-sm font-medium text-text-primary">
        {label}
      </legend>
      {hint && <p className="text-xs text-text-tertiary">{hint}</p>}
      <div className="space-y-2">{children}</div>
    </fieldset>
  )
}

/**
 * Radio group with label.
 */
interface RadioGroupProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; description?: string }>
  className?: string
}

export function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn('space-y-3', className)}>
      <legend className="text-sm font-medium text-text-primary">
        {label}
      </legend>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-start gap-3 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 h-4 w-4 border-border-subtle text-brand-primary focus:ring-brand-primary"
            />
            <div>
              <span className="text-sm text-text-primary">{option.label}</span>
              {option.description && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Search input with icon and clear button.
 */
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, className, ...props }, ref) => {
    return (
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            'w-full h-10 pl-10 pr-10 bg-background-secondary border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary hover:text-text-secondary"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'
