'use client';

/**
 * Toast Primitive - LOCKED 2026-01-10
 *
 * Rich style: Card with progress bar, Apple Glass Dark surface
 *
 * Recipe:
 *   surface: Apple Glass Dark (slightly more opaque)
 *   position: bottom-right
 *   animation: 200ms slide from right + scale
 *   progress: gold bar at top, auto-dismiss
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const toastSurfaceClass = 'bg-[#080808] border border-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.5)]';

const toastVariants = cva(
  [
    'group',
    'pointer-events-auto',
    'relative',
    'w-full',
    'overflow-hidden',
    'rounded-2xl',
    'backdrop-blur-xl',
    'transition-all duration-200',
  ].join(' '),
  {
    variants: {
      variant: {
        // Default: Neutral toast
        default: '',
        // Success: Green icon
        success: '',
        // Error: Red glow
        error: '',
        // Warning: Amber icon
        warning: '',
        // Info: Blue icon
        info: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// LOCKED: Circular icon badges for Rich toast
const iconColors = {
  default: 'bg-white/20',
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

// Export for external use
const toastIconVariants = iconColors;

// Variant type for consistency
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

// Icons for each variant - circular badges
const ToastIcon: React.FC<{ variant: ToastVariant }> = ({
  variant = 'default',
}) => {
  const bgColor = iconColors[variant];

  const iconContent = {
    success: '✓',
    error: '✕',
    warning: '!',
    info: 'i',
    default: '•',
  };

  return (
    <div className={cn(
      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white',
      bgColor
    )}>
      {iconContent[variant]}
    </div>
  );
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  /** Toast title */
  title?: string;
  /** Toast description */
  description?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Action button */
  action?: React.ReactNode;
  /** Close callback */
  onClose?: () => void;
  /** Show progress bar (auto-dismiss indicator) */
  showProgress?: boolean;
  /** Progress value 0-100 */
  progress?: number;
  /** Duration in ms for progress animation */
  duration?: number;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant,
      title,
      description,
      showIcon = true,
      action,
      onClose,
      showProgress = true,
      progress,
      duration = 4000,
      children,
      style,
      ...props
    },
    ref
  ) => {
    // Auto-progress if no manual progress provided
    const [autoProgress, setAutoProgress] = React.useState(100);

    React.useEffect(() => {
      if (showProgress && progress === undefined) {
        const interval = setInterval(() => {
          setAutoProgress((p) => {
            if (p <= 0) {
              clearInterval(interval);
              return 0;
            }
            return p - (100 / (duration / 50));
          });
        }, 50);
        return () => clearInterval(interval);
      }
    }, [showProgress, progress, duration]);

    const currentProgress = progress ?? autoProgress;

    return (
      <div
        ref={ref}
        className={cn(
          toastVariants({ variant }),
          toastSurfaceClass,
          variant === 'error' && 'border-red-500/20',
          className
        )}
        style={style}
        role="alert"
        {...props}
      >
        {/* LOCKED: Gold progress bar at top */}
        {showProgress && (
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-[#FFD700] transition-all duration-50"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        )}

        <div className="p-4 flex items-start gap-3">
          {showIcon && (
            <div className="shrink-0 mt-0.5">
              <ToastIcon variant={variant || 'default'} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="text-sm font-medium text-white">
                {title}
              </div>
            )}
            {description && (
              <div className="text-xs text-white/50 mt-0.5">
                {description}
              </div>
            )}
            {children}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

// Toast container for stacking
const ToastContainer: React.FC<{
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}> = ({ children, position = 'bottom-right' }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none',
        positionClasses[position]
      )}
    >
      {children}
    </div>
  );
};

export { Toast, ToastContainer, toastVariants, toastIconVariants };
