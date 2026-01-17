'use client';

/**
 * NotificationBanner Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Full-width notification banner for announcements, alerts, and status.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC BANNER (dismissible):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ℹ️  New features are available! Check out what's new.      [Dismiss]  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *    │                                                              │
 *    └── Icon based on variant                                      └── Dismiss button
 *
 * WITH ACTION:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ⚠️  Your session will expire in 5 minutes.    [Extend]    [Dismiss]   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                                     │
 *                                                     └── Action button
 *
 * VARIANTS:
 *
 * Info (default):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ℹ️  Information message                                    [Dismiss]  │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Blue accent (#4A9EFF)
 * - Blue-tinted background
 *
 * Success:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✓  Your changes have been saved!                           [Dismiss]  │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Green accent (#22C55E)
 * - Green-tinted background
 *
 * Warning:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ⚠️  Scheduled maintenance tonight at 11pm.                 [Dismiss]  │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Amber accent (#FFA500)
 * - Amber-tinted background
 *
 * Error:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✕  Connection lost. Retrying...                   [Retry]  [Dismiss]  │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Red accent (#FF6B6B)
 * - Red-tinted background
 *
 * Announcement (Gold):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ✨  HIVE 2.0 is here! Discover the new features.  [Learn More]        │
 * └─────────────────────────────────────────────────────────────────────────┘
 * - Gold accent (#FFD700)
 * - Subtle gold-tinted background
 *
 * POSITIONS:
 * - top: Fixed to top of viewport
 * - bottom: Fixed to bottom of viewport
 * - inline: Normal document flow (default)
 *
 * SIZES:
 * - compact: py-2, smaller text
 * - default: py-3
 * - prominent: py-4, larger text
 *
 * ANIMATIONS:
 * - Enter: Slide in + fade
 * - Exit: Slide out + fade
 * - Auto-dismiss: Optional timer
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

const bannerVariants = cva(
  'flex items-center justify-between gap-4 px-4',
  {
    variants: {
      variant: {
        info: 'bg-blue-500/10 border-blue-500/20',
        success: 'bg-green-500/10 border-green-500/20',
        warning: 'bg-amber-500/10 border-amber-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        announcement: 'bg-life-gold/5 border-life-gold/20',
      },
      size: {
        compact: 'py-2',
        default: 'py-3',
        prominent: 'py-4',
      },
      position: {
        inline: 'relative rounded-xl border',
        top: 'fixed top-0 left-0 right-0 z-50 border-b',
        bottom: 'fixed bottom-0 left-0 right-0 z-50 border-t',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'default',
      position: 'inline',
    },
  }
);

const variantIcons: Record<string, React.ReactNode> = {
  info: (
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
  announcement: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
};

const variantColors: Record<string, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  announcement: 'text-life-gold',
};

export interface NotificationBannerProps extends VariantProps<typeof bannerVariants> {
  /** Banner message */
  message: React.ReactNode;
  /** Custom icon (overrides variant icon) */
  icon?: React.ReactNode;
  /** Hide icon */
  hideIcon?: boolean;
  /** Action button text */
  actionText?: string;
  /** Action button handler */
  onAction?: () => void;
  /** Dismiss handler (shows dismiss button) */
  onDismiss?: () => void;
  /** Auto-dismiss after ms (0 to disable) */
  autoDismiss?: number;
  /** Additional className */
  className?: string;
}

/**
 * NotificationBanner - Full-width notification
 */
const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  icon,
  hideIcon = false,
  variant = 'info',
  size = 'default',
  position = 'inline',
  actionText,
  onAction,
  onDismiss,
  autoDismiss = 0,
  className,
}) => {
  const [visible, setVisible] = React.useState(true);

  // Auto-dismiss
  React.useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  if (!visible) return null;

  const displayIcon = icon || variantIcons[variant || 'info'];

  return (
    <div
      className={cn(
        bannerVariants({ variant, size, position }),
        'animate-in fade-in-0 slide-in-from-top-2',
        className
      )}
      role="alert"
    >
      {/* Icon + Message */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {!hideIcon && (
          <div className={cn('flex-shrink-0', variantColors[variant || 'info'])}>
            {displayIcon}
          </div>
        )}
        <Text size={size === 'compact' ? 'xs' : size === 'prominent' ? 'lg' : 'sm'}>
          {message}
        </Text>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actionText && onAction && (
          <button
            onClick={onAction}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-white/10',
              variantColors[variant || 'info']
            )}
          >
            {actionText}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-muted hover:text-white"
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

NotificationBanner.displayName = 'NotificationBanner';

/**
 * NotificationBannerStack - Stack multiple banners
 */
export interface NotificationBannerStackProps {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

const NotificationBannerStack: React.FC<NotificationBannerStackProps> = ({
  children,
  position = 'top',
  className,
}) => (
  <div
    className={cn(
      'fixed left-0 right-0 z-50 flex flex-col gap-1',
      position === 'top' ? 'top-0' : 'bottom-0',
      className
    )}
  >
    {children}
  </div>
);

NotificationBannerStack.displayName = 'NotificationBannerStack';

export { NotificationBanner, NotificationBannerStack, bannerVariants };
