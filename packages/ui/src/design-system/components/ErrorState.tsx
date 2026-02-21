'use client';

/**
 * ErrorState Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Displays error messages with optional retry action.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FULL ERROR STATE (page-level):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │                            ┌───────────┐                                │
 * │                            │     ⚠     │   64x64 container              │
 * │                            │   ERROR   │   Red icon (#FF6B6B)           │
 * │                            └───────────┘   bg: red/10                   │
 * │                                                                         │
 * │                    Something went wrong                                 │
 * │                    Title: text-lg, font-medium                          │
 * │                                                                         │
 * │              We couldn't load this content.                             │
 * │              Please try again.                                          │
 * │                    Description: text-sm, text-muted                     │
 * │                                                                         │
 * │                      ┌─────────────────┐                                │
 * │                      │   Try Again     │   Primary retry button         │
 * │                      └─────────────────┘   variant="primary"            │
 * │                                                                         │
 * │                        ┌──────────────────────────────────────┐         │
 * │                        │ Error: Connection timeout (code: 504)│         │
 * │                        └──────────────────────────────────────┘         │
 * │                        Technical details: text-xs, text-muted           │
 * │                        Collapsible, hidden by default                   │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * INLINE ERROR (component-level):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ⚠  Failed to load messages            [Retry]                         │
 * │     Connection timeout                                                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * TOAST ERROR (notification):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ⚠  Failed to save changes                                         ✕   │
 * │     Your draft has been preserved                                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ERROR SEVERITY COLORS:
 * - error (red): #FF6B6B / var(--color-status-error)
 * - warning (amber): #FFA500
 * - info (blue): #4A9EFF
 *
 * ICON CONTAINER:
 * - Rounded-2xl
 * - Background: error=red/10, warning=amber/10, info=blue/10
 * - Border: 1px with matching color at 20% opacity
 * - Icon: Matching color at full opacity
 *
 * SIZE VARIANTS:
 * - sm: Icon 32px, smaller padding
 * - default: Icon 64px, standard layout
 * - lg: Icon 96px, larger typography
 *
 * ANIMATION:
 * - Icon: Subtle shake on mount (0.5s)
 * - Fade-in on mount: animate-in fade-in-0 duration-300
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { Button } from '../primitives/Button';

const errorStateVariants = cva(
  'animate-in fade-in-0 duration-300',
  {
    variants: {
      variant: {
        full: 'flex flex-col items-center justify-center text-center p-12',
        inline: 'flex flex-row items-start gap-3 p-4 rounded-xl border',
        toast: 'flex flex-row items-start gap-3 p-4 rounded-xl border shadow-lg',
      },
      severity: {
        error: '',
        warning: '',
        info: '',
      },
    },
    compoundVariants: [
      {
        variant: ['inline', 'toast'],
        severity: 'error',
        className: 'border-red-500/20 bg-red-500/5',
      },
      {
        variant: ['inline', 'toast'],
        severity: 'warning',
        className: 'border-orange-400/20 bg-orange-400/5',
      },
      {
        variant: ['inline', 'toast'],
        severity: 'info',
        className: 'border-blue-500/20 bg-blue-500/5',
      },
    ],
    defaultVariants: {
      variant: 'full',
      severity: 'error',
    },
  }
);

const severityColors = {
  error: {
    icon: 'rgb(239, 68, 68)', // red-500
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.2)',
  },
  warning: {
    icon: 'rgb(251, 146, 60)', // orange-400
    bg: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.2)',
  },
  info: {
    icon: 'rgb(59, 130, 246)', // blue-500
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
};

export interface ErrorStateProps
  extends VariantProps<typeof errorStateVariants> {
  /** Error title */
  title?: string;
  /** Error description */
  description?: string;
  /** Technical error details (can be collapsed) */
  details?: string;
  /** Error code */
  code?: string | number;
  /** Retry action */
  onRetry?: () => void;
  /** Retry button text */
  retryLabel?: string;
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Dismiss action (for toast variant) */
  onDismiss?: () => void;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Show technical details by default */
  showDetails?: boolean;
}

/**
 * ErrorState - Error display component
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  variant = 'full',
  severity = 'error',
  title = 'Something went wrong',
  description,
  details,
  code,
  onRetry,
  retryLabel = 'Try Again',
  secondaryAction,
  onDismiss,
  icon,
  className,
  showDetails = false,
}) => {
  const [detailsExpanded, setDetailsExpanded] = React.useState(showDetails);
  const colors = severityColors[severity || 'error'];

  // Default icons by severity
  const defaultIcon = {
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth={2} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth={2} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth={2} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  };

  // Inline/toast variant
  if (variant === 'inline' || variant === 'toast') {
    return (
      <div className={cn(errorStateVariants({ variant, severity }), className)}>
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || (
            <svg viewBox="0 0 24 24" fill="none" stroke={colors.icon} strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Text size="sm" weight="medium">
            {title}
          </Text>
          {description && (
            <Text size="xs" tone="muted" className="mt-0.5">
              {description}
            </Text>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {variant === 'toast' && onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn(errorStateVariants({ variant, severity }), className)}>
      {/* Icon container */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        {icon || defaultIcon[severity || 'error']}
      </div>

      {/* Title */}
      <Text size="lg" weight="medium" className="mb-2">
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text size="sm" tone="muted" className="max-w-sm mb-6">
          {description}
        </Text>
      )}

      {/* Actions */}
      {(onRetry || secondaryAction) && (
        <div className="flex items-center gap-3 mb-6">
          {onRetry && (
            <Button variant="default" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Technical details */}
      {(details || code) && (
        <div className="w-full max-w-md">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={cn('w-3 h-3 transition-transform', detailsExpanded && 'rotate-90')}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            Technical details
          </button>

          {detailsExpanded && (
            <div className="mt-2 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-left">
              {code && (
                <Text size="xs" tone="muted" className="font-sans">
                  Error code: {code}
                </Text>
              )}
              {details && (
                <Text size="xs" tone="muted" className="font-sans mt-1 break-all">
                  {details}
                </Text>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ErrorState.displayName = 'ErrorState';

/**
 * ErrorStatePresets - Common error state configurations
 */
export const ErrorStatePresets = {
  networkError: {
    title: 'Connection failed',
    description: "We couldn't connect to the server. Check your internet connection and try again.",
    code: 'NETWORK_ERROR',
  },
  serverError: {
    title: 'Server error',
    description: "Something went wrong on our end. We're working on it.",
    code: 500,
  },
  notFound: {
    title: 'Not found',
    description: "The page or resource you're looking for doesn't exist.",
    code: 404,
  },
  unauthorized: {
    title: 'Access denied',
    description: "You don't have permission to view this content.",
    code: 403,
  },
  timeout: {
    title: 'Request timeout',
    description: 'The request took too long. Please try again.',
    code: 408,
  },
  validationError: {
    title: 'Invalid input',
    description: 'Please check your input and try again.',
    severity: 'warning' as const,
  },
};

export { ErrorState };
