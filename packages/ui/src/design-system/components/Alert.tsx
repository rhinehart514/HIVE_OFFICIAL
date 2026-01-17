'use client';

/**
 * Alert Primitive
 * LOCKED: January 11, 2026
 *
 * Decisions:
 * - Border: Full border (consistent with Card pattern)
 * - Background tint: 10% opacity (subtle, doesn't overwhelm)
 * - Colors: Semantic variants (default, success, warning, error, gold)
 * - Gold: Reserved for achievements/special moments only
 * - Radius: rounded-xl (12px)
 *
 * Static alert/notification boxes.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC ALERT:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ℹ️  Alert Title                                               │
 * │      Alert description text goes here. This provides more     │
 * │      context about the alert.                                  │
 * └────────────────────────────────────────────────────────────────┘
 *
 * ALERT VARIANTS:
 *
 * Default (neutral):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ℹ️  Information                                               │ bg-elevated, muted icon
 * │      Some informational message.                               │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Success (green):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ✓  Success                                                    │ green/10 bg, green icon
 * │      Operation completed successfully.                         │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Warning (amber):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ⚠  Warning                                                    │ amber/10 bg, amber icon
 * │      Please review before continuing.                          │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Error (red):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ✕  Error                                                      │ red/10 bg, red icon
 * │      Something went wrong.                                     │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Gold (special):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ★  Achievement                                                │ gold/10 bg, gold icon
 * │      You've unlocked something special!                        │
 * └────────────────────────────────────────────────────────────────┘
 *
 * WITH CLOSE BUTTON:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ℹ️  Dismissible Alert                                    ✕    │
 * │      You can close this alert.                                 │
 * └────────────────────────────────────────────────────────────────┘
 *
 * WITH ACTION:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ⚠  Update Available                                           │
 * │      A new version is available.              [Update Now]     │
 * └────────────────────────────────────────────────────────────────┘
 *
 * INLINE ALERT (Compact):
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ⚠  Please verify your email address.               [Resend]  │
 * └────────────────────────────────────────────────────────────────┘
 *
 * COLORS:
 * - Default: bg-elevated, muted text/icon
 * - Success: #22C55E/10 bg, #22C55E icon/border
 * - Warning: #FFA500/10 bg, #FFA500 icon/border
 * - Error: #FF6B6B/10 bg, #FF6B6B icon/border
 * - Gold: #FFD700/10 bg, #FFD700 icon/border
 *
 * BORDER:
 * - Left accent border (4px) matching variant color
 * - Or full subtle border
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl p-4',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        success: 'bg-green-500/10 border border-green-500/20',
        warning: 'bg-amber-500/10 border border-amber-500/20',
        error: 'bg-red-500/10 border border-red-500/20',
        gold: 'bg-life-gold/10 border border-life-gold/20',
      },
      accent: {
        true: 'border-l-4',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'success', accent: true, className: 'border-l-green-500' },
      { variant: 'warning', accent: true, className: 'border-l-amber-500' },
      { variant: 'error', accent: true, className: 'border-l-red-500' },
      { variant: 'gold', accent: true, className: 'border-l-life-gold' },
      { variant: 'default', accent: true, className: 'border-l-[var(--color-text-muted)]' },
    ],
    defaultVariants: {
      variant: 'default',
      accent: false,
    },
  }
);

const iconColors = {
  default: 'text-[var(--color-text-muted)]',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  gold: 'text-life-gold',
};

const icons = {
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  gold: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ),
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Alert title */
  title?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Hide default icon */
  hideIcon?: boolean;
  /** Dismissible */
  onClose?: () => void;
  /** Action button */
  action?: React.ReactNode;
}

/**
 * Alert - Static notification box
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      accent,
      title,
      icon,
      hideIcon = false,
      onClose,
      action,
      children,
      ...props
    },
    ref
  ) => {
    const variantIcon = icons[variant || 'default'];
    const iconColor = iconColors[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, accent }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {!hideIcon && (
            <div className={cn('shrink-0 mt-0.5', iconColor)}>
              {icon || variantIcon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h5 className="text-sm font-medium text-white mb-1">{title}</h5>
            )}
            {children && (
              <div className="text-sm text-[var(--color-text-muted)]">{children}</div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 transition-colors"
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
);
Alert.displayName = 'Alert';

/**
 * AlertTitle - Alert title component
 */
const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('text-sm font-medium text-white mb-1', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

/**
 * AlertDescription - Alert description component
 */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-[var(--color-text-muted)]', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

/**
 * InlineAlert - Compact single-line alert
 */
export interface InlineAlertProps extends Omit<AlertProps, 'title' | 'children'> {
  /** Message text */
  message: string;
}

const InlineAlert = React.forwardRef<HTMLDivElement, InlineAlertProps>(
  ({ className, variant = 'default', message, icon, hideIcon = false, action, onClose, ...props }, ref) => {
    const variantIcon = icons[variant || 'default'];
    const iconColor = iconColors[variant || 'default'];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2',
          alertVariants({ variant, accent: false }),
          className
        )}
        {...props}
      >
        {!hideIcon && (
          <span className={cn('shrink-0', iconColor)}>
            {icon || React.cloneElement(variantIcon, { className: 'w-4 h-4' })}
          </span>
        )}
        <span className="flex-1 text-sm text-white">{message}</span>
        {action && <div className="shrink-0">{action}</div>}
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 p-0.5 rounded text-[var(--color-text-muted)] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
InlineAlert.displayName = 'InlineAlert';

export { Alert, AlertTitle, AlertDescription, InlineAlert, alertVariants };
