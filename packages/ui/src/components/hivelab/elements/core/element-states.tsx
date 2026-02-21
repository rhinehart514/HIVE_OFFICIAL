'use client';

/**
 * Element State Components
 *
 * Standardized UI states for all elements.
 * These provide consistent empty, loading, and error states.
 */

import * as React from 'react';
import { cn } from '../../../../lib/utils';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================
// Common Props
// ============================================================

interface StateComponentProps {
  className?: string;
  /** Compact mode for smaller elements */
  compact?: boolean;
}

// ============================================================
// Empty State
// ============================================================

interface ElementEmptyProps extends StateComponentProps {
  /** Icon to display (defaults to Inbox) */
  icon?: React.ReactNode;
  /** Main message */
  message?: string;
  /** Secondary description */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ElementEmpty({
  className,
  compact = false,
  icon,
  message = 'No data yet',
  description,
  action,
}: ElementEmptyProps) {
  const Icon = icon ?? <Inbox className={cn('text-muted-foreground', compact ? 'h-5 w-5' : 'h-8 w-8')} />;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 py-3 text-muted-foreground', className)}>
        {Icon}
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 text-center',
        className
      )}
    >
      {Icon}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Loading State
// ============================================================

interface ElementLoadingProps extends StateComponentProps {
  /** Loading message */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Show spinner */
  showSpinner?: boolean;
}

export function ElementLoading({
  className,
  compact = false,
  message = 'Loading...',
  progress,
  showSpinner = true,
}: ElementLoadingProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 py-3', className)}>
        {showSpinner && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8',
        className
      )}
    >
      {showSpinner && (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      )}
      <p className="text-sm text-muted-foreground">{message}</p>
      {progress !== undefined && (
        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Error State
// ============================================================

interface ElementErrorProps extends StateComponentProps {
  /** Error message */
  message?: string;
  /** Error details (for dev mode) */
  details?: string;
  /** Retry action */
  onRetry?: () => void;
}

export function ElementError({
  className,
  compact = false,
  message = 'Something went wrong',
  details,
  onRetry,
}: ElementErrorProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 py-3 text-destructive', className)}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 text-center',
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {details && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-muted-foreground font-sans">{details}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Try again
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Skeleton Loader - For content placeholders
// ============================================================

interface ElementSkeletonProps extends StateComponentProps {
  /** Number of lines to show */
  lines?: number;
  /** Show avatar placeholder */
  showAvatar?: boolean;
}

export function ElementSkeleton({
  className,
  lines = 3,
  showAvatar = false,
}: ElementSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {showAvatar && (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 rounded bg-muted animate-pulse',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Success State - For completed actions
// ============================================================

interface ElementSuccessProps extends StateComponentProps {
  /** Success message */
  message?: string;
  /** Description */
  description?: string;
  /** Auto-dismiss after ms (0 = no auto-dismiss) */
  autoDismiss?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

export function ElementSuccess({
  className,
  compact = false,
  message = 'Done!',
  description,
  autoDismiss = 0,
  onDismiss,
}: ElementSuccessProps) {
  React.useEffect(() => {
    if (autoDismiss > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn('flex items-center gap-2 py-3 text-green-600', className)}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <svg className="h-4 w-4\" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        </motion.div>
        <span className="text-sm">{message}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 text-center',
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="rounded-full bg-green-100 dark:bg-green-900/20 p-3"
      >
        <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          />
        </svg>
      </motion.div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// State Container - Handles all states with transitions
// ============================================================

interface StateContainerProps {
  status: 'empty' | 'loading' | 'error' | 'success' | 'complete' | 'partial' | 'disabled';
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  // Empty state props
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  // Loading state props
  loadingMessage?: string;
  loadingProgress?: number;
  // Error state props
  errorMessage?: string;
  errorDetails?: string;
  onRetry?: () => void;
  // Success state props
  successMessage?: string;
  successDescription?: string;
  onSuccessDismiss?: () => void;
}

export function StateContainer({
  status,
  children,
  className,
  compact = false,
  emptyMessage,
  emptyDescription,
  emptyAction,
  loadingMessage,
  loadingProgress,
  errorMessage,
  errorDetails,
  onRetry,
  successMessage,
  successDescription,
  onSuccessDismiss,
}: StateContainerProps) {
  switch (status) {
    case 'empty':
      return (
        <ElementEmpty
          compact={compact}
          message={emptyMessage}
          description={emptyDescription}
          action={emptyAction}
          className={className}
        />
      );

    case 'loading':
      return (
        <ElementLoading
          compact={compact}
          message={loadingMessage}
          progress={loadingProgress}
          className={className}
        />
      );

    case 'error':
      return (
        <ElementError
          compact={compact}
          message={errorMessage}
          details={errorDetails}
          onRetry={onRetry}
          className={className}
        />
      );

    case 'success':
      return (
        <ElementSuccess
          compact={compact}
          message={successMessage}
          description={successDescription}
          autoDismiss={2000}
          onDismiss={onSuccessDismiss}
          className={className}
        />
      );

    case 'disabled':
      return (
        <div className={cn('opacity-50 pointer-events-none', className)}>
          {children}
        </div>
      );

    case 'complete':
    case 'partial':
    default:
      return <>{children}</>;
  }
}
