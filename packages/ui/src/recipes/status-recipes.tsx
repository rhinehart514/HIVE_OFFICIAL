import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * Loading spinner with optional message.
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  message,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <svg
        className={cn('animate-spin text-text-tertiary', sizeClasses[size])}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <p className="text-sm text-text-secondary">{message}</p>
      )}
    </div>
  )
}

/**
 * Full-page loading state.
 */
interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" message={message} />
    </div>
  )
}

/**
 * Skeleton loading placeholder.
 */
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'h-10 w-10 rounded-full',
    rectangular: 'h-20 w-full rounded-lg',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-background-tertiary',
        variantClasses[variant],
        className
      )}
    />
  )
}

/**
 * Card skeleton for loading states.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 bg-background-secondary rounded-lg border border-border-subtle space-y-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-8 w-8" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

/**
 * Empty state with icon, message, and optional action.
 */
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center mb-4 text-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Error state with retry action.
 */
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-status-error/10 flex items-center justify-center mb-4">
        <svg
          className="h-6 w-6 text-status-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 h-9 px-4 text-sm font-medium bg-background-secondary hover:bg-background-tertiary rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

/**
 * Success state with check icon.
 */
interface SuccessStateProps {
  title: string
  message?: string
  action?: React.ReactNode
  className?: string
}

export function SuccessState({
  title,
  message,
  action,
  className,
}: SuccessStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-status-success/10 flex items-center justify-center mb-4">
        <svg
          className="h-6 w-6 text-status-success"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {message && (
        <p className="text-sm text-text-secondary mt-1 max-w-sm">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/**
 * Inline alert for form messages or notices.
 */
interface InlineAlertProps {
  variant: 'info' | 'success' | 'warning' | 'error'
  children: React.ReactNode
  className?: string
}

export function InlineAlert({ variant, children, className }: InlineAlertProps) {
  const variantStyles = {
    info: 'bg-status-info/10 text-status-info border-status-info/20',
    success: 'bg-status-success/10 text-status-success border-status-success/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    error: 'bg-status-error/10 text-status-error border-status-error/20',
  }

  return (
    <div
      className={cn(
        'px-3 py-2 text-sm rounded-lg border',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  )
}

/**
 * Progress indicator for multi-step processes.
 */
interface ProgressStepsProps {
  steps: Array<{ label: string; description?: string }>
  currentStep: number
  className?: string
}

export function ProgressSteps({
  steps,
  currentStep,
  className,
}: ProgressStepsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                  isCompleted && 'bg-brand-primary text-black',
                  isCurrent && 'bg-background-tertiary text-text-primary ring-2 ring-brand-primary',
                  !isCompleted && !isCurrent && 'bg-background-secondary text-text-tertiary'
                )}
              >
                {isCompleted ? (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-1',
                    isCompleted ? 'bg-brand-primary' : 'bg-background-tertiary'
                  )}
                />
              )}
            </div>
            <div className="pb-8">
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent || isCompleted ? 'text-text-primary' : 'text-text-tertiary'
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
