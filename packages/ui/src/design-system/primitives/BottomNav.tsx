'use client';

/**
 * BottomNav Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Mobile app-level navigation with 48px touch targets
 * Matches glass treatment from Tabs, uses gold dot for unread.
 *
 * Recipe:
 *   container: Frosted glass bar, fixed bottom
 *   items: 48px minimum touch targets (WCAG)
 *   active: Glass pill with white text
 *   badge: Gold dot for unread (matches PresenceDot)
 *   safe area: Proper insets for notched devices
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass surface for container
const glassContainerSurface = {
  background: 'linear-gradient(180deg, rgba(20,19,18,0.95) 0%, rgba(10,10,9,0.98) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255,255,255,0.06)',
};

// LOCKED: Glass pill surface for active item
const glassPillSurface = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// LOCKED: Spring animation config
const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// Container variants
const bottomNavContainerVariants = cva(
  [
    'fixed bottom-0 left-0 right-0 z-50',
    'flex items-center justify-around',
    'px-2',
    // Safe area insets for notched devices
    'pb-[env(safe-area-inset-bottom,0px)]',
  ].join(' '),
  {
    variants: {
      size: {
        default: 'h-16 min-h-[64px]',
        compact: 'h-14 min-h-[56px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Item variants - 48px minimum touch target
const bottomNavItemVariants = cva(
  [
    // LOCKED: 48px minimum touch target (WCAG 2.1)
    'min-w-[48px] min-h-[48px]',
    'flex flex-col items-center justify-center',
    'gap-0.5',
    'px-3 py-1.5',
    'rounded-xl',
    'transition-colors duration-150',
    // Text color
    'text-white/50',
    'hover:text-white/70',
    // Focus (WHITE, never gold)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Touch action
    'touch-action-manipulation',
    '-webkit-tap-highlight-color: transparent',
  ].join(' '),
  {
    variants: {
      active: {
        true: 'text-white',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

// Badge variants - gold dot for unread
const bottomNavBadgeVariants = cva(
  [
    'absolute',
    'rounded-full',
    'bg-[#D4AF37]', // HIVE Gold
    'ring-2 ring-[#0A0A09]',
  ].join(' '),
  {
    variants: {
      size: {
        dot: 'w-2 h-2 top-0.5 right-0.5',
        count: 'min-w-[18px] h-[18px] -top-1 -right-1 text-[10px] font-bold text-[#0A0A09] flex items-center justify-center px-1',
      },
    },
    defaultVariants: {
      size: 'dot',
    },
  }
);

// Types
export interface BottomNavItem {
  /** Unique identifier */
  value: string;
  /** Icon component (should be 20-24px) */
  icon: React.ReactNode;
  /** Label text */
  label: string;
  /** Show unread badge */
  hasUnread?: boolean;
  /** Unread count (shows count if > 0, otherwise dot) */
  unreadCount?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Custom href for navigation */
  href?: string;
}

export interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Navigation items (max 5 recommended) */
  items: BottomNavItem[];
  /** Currently active item value */
  value?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Size variant */
  size?: 'default' | 'compact';
  /** Show labels */
  showLabels?: boolean;
  /** Custom render for item (for Next.js Link integration) */
  renderItem?: (item: BottomNavItem, props: BottomNavItemRenderProps) => React.ReactNode;
  /** Layout ID for framer motion */
  layoutId?: string;
}

export interface BottomNavItemRenderProps {
  className: string;
  style?: React.CSSProperties;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

// Single item component
const BottomNavItemComponent = React.forwardRef<
  HTMLButtonElement,
  {
    item: BottomNavItem;
    isActive: boolean;
    showLabels: boolean;
    onClick: () => void;
  }
>(({ item, isActive, showLabels, onClick }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(bottomNavItemVariants({ active: isActive }))}
      style={isActive ? glassPillSurface : undefined}
      onClick={onClick}
      disabled={item.disabled}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="relative">
        {item.icon}
        {/* Unread badge */}
        {(item.hasUnread || (item.unreadCount && item.unreadCount > 0)) && (
          <span
            className={cn(
              bottomNavBadgeVariants({
                size: item.unreadCount && item.unreadCount > 0 ? 'count' : 'dot',
              })
            )}
          >
            {item.unreadCount && item.unreadCount > 0
              ? item.unreadCount > 99
                ? '99+'
                : item.unreadCount
              : null}
          </span>
        )}
      </span>
      {showLabels && (
        <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">
          {item.label}
        </span>
      )}
    </button>
  );
});

BottomNavItemComponent.displayName = 'BottomNavItem';

// Main component
const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  (
    {
      className,
      items,
      value,
      onValueChange,
      size = 'default',
      showLabels = true,
      renderItem,
      layoutId = 'bottom-nav-indicator',
      style,
      ...props
    },
    ref
  ) => {
    const activeIndex = items.findIndex((item) => item.value === value);

    return (
      <nav
        ref={ref}
        className={cn(bottomNavContainerVariants({ size }), className)}
        style={{ ...glassContainerSurface, ...style }}
        role="navigation"
        aria-label="Main navigation"
        {...props}
      >
        {items.map((item, index) => {
          const isActive = item.value === value;

          const handleClick = () => {
            if (!item.disabled) {
              onValueChange?.(item.value);
            }
          };

          // Custom render support (for Next.js Link)
          if (renderItem) {
            const itemChildren = (
              <>
                <span className="relative">
                  {item.icon}
                  {(item.hasUnread || (item.unreadCount && item.unreadCount > 0)) && (
                    <span
                      className={cn(
                        bottomNavBadgeVariants({
                          size: item.unreadCount && item.unreadCount > 0 ? 'count' : 'dot',
                        })
                      )}
                    >
                      {item.unreadCount && item.unreadCount > 0
                        ? item.unreadCount > 99
                          ? '99+'
                          : item.unreadCount
                        : null}
                    </span>
                  )}
                </span>
                {showLabels && (
                  <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">
                    {item.label}
                  </span>
                )}
              </>
            );

            return (
              <React.Fragment key={item.value}>
                {renderItem(item, {
                  className: cn(bottomNavItemVariants({ active: isActive })),
                  style: isActive ? glassPillSurface : undefined,
                  isActive,
                  onClick: handleClick,
                  children: itemChildren,
                })}
              </React.Fragment>
            );
          }

          // Default button render
          return (
            <BottomNavItemComponent
              key={item.value}
              item={item}
              isActive={isActive}
              showLabels={showLabels}
              onClick={handleClick}
            />
          );
        })}
      </nav>
    );
  }
);

BottomNav.displayName = 'BottomNav';

// Spacer component to prevent content from being hidden behind fixed nav
const BottomNavSpacer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: 'default' | 'compact' }
>(({ className, size = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      size === 'default' ? 'h-16' : 'h-14',
      // Add safe area inset
      'pb-[env(safe-area-inset-bottom,0px)]',
      className
    )}
    aria-hidden="true"
    {...props}
  />
));

BottomNavSpacer.displayName = 'BottomNavSpacer';

export {
  BottomNav,
  BottomNavSpacer,
  // Export variants
  bottomNavContainerVariants,
  bottomNavItemVariants,
  bottomNavBadgeVariants,
  // Export style helpers
  glassContainerSurface,
  glassPillSurface as bottomNavGlassPillSurface,
};
