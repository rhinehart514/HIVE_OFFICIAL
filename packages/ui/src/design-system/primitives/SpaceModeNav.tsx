'use client';

/**
 * SpaceModeNav Primitive - LOCKED 2026-01-14
 *
 * LOCKED: Space mode switching with glass pill tabs and unread badges
 * Matches Tabs glass treatment, uses gold dot for unread.
 *
 * Recipe:
 *   container: No track, clean flex
 *   items: Glass pill for active (from Tabs)
 *   unread: Gold dot badge (from BottomNav)
 *   responsive: Horizontal scroll on mobile, full on desktop
 *   icons: Optional, shown on mobile/compact
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// LOCKED: Glass pill surface for active tab
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
const spaceModeNavContainerVariants = cva(
  [
    'flex items-center',
    'overflow-x-auto',
    // Hide scrollbar
    'scrollbar-none',
    '[&::-webkit-scrollbar]:hidden',
    '[-ms-overflow-style:none]',
    '[scrollbar-width:none]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'gap-0.5',
        default: 'gap-1',
        lg: 'gap-1',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Item variants
const spaceModeNavItemVariants = cva(
  [
    'relative',
    'shrink-0',
    'rounded-full',
    'font-medium',
    'whitespace-nowrap',
    'transition-colors duration-150',
    // Text colors
    'text-white/50 hover:text-white/70',
    // Focus (WHITE, never gold)
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A09]',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'px-3 py-1 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
      },
      active: {
        true: 'text-white',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      active: false,
    },
  }
);

// Unread badge variants
const unreadBadgeVariants = cva(
  [
    'absolute',
    'rounded-full',
    'bg-[#D4AF37]', // HIVE Gold
    'ring-2 ring-[#0A0A09]',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'w-1.5 h-1.5 top-0.5 right-0.5',
        default: 'w-2 h-2 top-1 right-1',
        lg: 'w-2.5 h-2.5 top-1.5 right-1.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Mode icons (commonly used for spaces)
export const SpaceModeIcons = {
  hub: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L8.707 1.5Z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.807-7 6c0 1.468.617 2.83 1.678 3.894Z" />
    </svg>
  ),
  events: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z" />
      <path d="M2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V4z" />
    </svg>
  ),
  // Apps icon (grid of 4 squares - represents deployed tools/apps)
  apps: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
    </svg>
  ),
  // Legacy 'tools' alias (kept for backwards compatibility)
  tools: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
    </svg>
  ),
  members: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
    </svg>
  ),
  // Resources icon (folder with document)
  resources: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3H14a2 2 0 0 1 2 2v1.5H.5v-2.63z" />
      <path d="M.5 7.5V13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7.5H.5z" />
    </svg>
  ),
};

// Types
export interface SpaceModeItem {
  /** Unique mode identifier */
  value: string;
  /** Display label */
  label: string;
  /** Route href */
  href: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Show unread badge */
  hasUnread?: boolean;
  /** Only show for leaders */
  leaderOnly?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export interface SpaceModeNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Mode items */
  items: SpaceModeItem[];
  /** Current active mode (detected from pathname if not provided) */
  activeValue?: string;
  /** Base path for the space (e.g., /spaces/abc123) */
  basePath: string;
  /** Current pathname (from usePathname) */
  pathname?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show icons (always shown on compact, optional on larger) */
  showIcons?: boolean;
  /** Whether user is a leader (to show leader-only items) */
  isLeader?: boolean;
  /** Layout ID for framer motion */
  layoutId?: string;
}

// Default space modes
export const defaultSpaceModes: Omit<SpaceModeItem, 'href'>[] = [
  { value: 'hub', label: 'Hub', icon: SpaceModeIcons.hub },
  { value: 'chat', label: 'Chat', icon: SpaceModeIcons.chat },
  { value: 'events', label: 'Events', icon: SpaceModeIcons.events },
  { value: 'resources', label: 'Resources', icon: SpaceModeIcons.resources },
  { value: 'apps', label: 'Apps', icon: SpaceModeIcons.apps },
  { value: 'members', label: 'Members', icon: SpaceModeIcons.members },
  { value: 'settings', label: 'Settings', icon: SpaceModeIcons.settings, leaderOnly: true },
];

// Helper to create mode items from defaults
export const createSpaceModes = (basePath: string): SpaceModeItem[] =>
  defaultSpaceModes.map((mode) => ({
    ...mode,
    href: mode.value === 'hub' ? basePath : `${basePath}/${mode.value}`,
  }));

// Detect active mode from pathname
const detectActiveMode = (pathname: string, basePath: string, items: SpaceModeItem[]): string => {
  // Exact match first (for hub)
  if (pathname === basePath) {
    return 'hub';
  }

  // Check other modes
  for (const item of items) {
    if (item.value !== 'hub' && pathname.startsWith(item.href)) {
      return item.value;
    }
  }

  return 'hub';
};

// Main component
const SpaceModeNav = React.forwardRef<HTMLElement, SpaceModeNavProps>(
  (
    {
      className,
      items,
      activeValue,
      basePath,
      pathname = '',
      size = 'default',
      showIcons = false,
      isLeader = false,
      layoutId = 'space-mode-indicator',
      ...props
    },
    ref
  ) => {
    // Filter items based on leader status
    const visibleItems = items.filter((item) => !item.leaderOnly || isLeader);

    // Detect active mode
    const currentValue = activeValue || detectActiveMode(pathname, basePath, items);

    return (
      <nav
        ref={ref}
        className={cn(spaceModeNavContainerVariants({ size }), className)}
        role="navigation"
        aria-label="Space modes"
        {...props}
      >
        {visibleItems.map((item) => {
          const isActive = item.value === currentValue;

          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(spaceModeNavItemVariants({ size, active: isActive }))}
              style={isActive ? glassPillSurface : undefined}
            >
              {/* Icon */}
              {showIcons && item.icon && (
                <span className="mr-1.5">{item.icon}</span>
              )}

              {/* Label */}
              <span>{item.label}</span>

              {/* Unread badge */}
              {item.hasUnread && (
                <span className={cn(unreadBadgeVariants({ size }))} />
              )}
            </Link>
          );
        })}
      </nav>
    );
  }
);

SpaceModeNav.displayName = 'SpaceModeNav';

// Wrapper with animated background indicator
const AnimatedSpaceModeNav: React.FC<SpaceModeNavProps> = ({
  items,
  activeValue,
  basePath,
  pathname = '',
  size = 'default',
  showIcons = false,
  isLeader = false,
  layoutId = 'space-mode-indicator',
  className,
  ...props
}) => {
  // Filter items based on leader status
  const visibleItems = items.filter((item) => !item.leaderOnly || isLeader);

  // Detect active mode
  const currentValue = activeValue || detectActiveMode(pathname, basePath, items);
  const activeIndex = visibleItems.findIndex((item) => item.value === currentValue);

  return (
    <nav
      className={cn('relative', spaceModeNavContainerVariants({ size }), className)}
      role="navigation"
      aria-label="Space modes"
      {...props}
    >
      {/* Animated background indicator */}
      {activeIndex >= 0 && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-y-0 rounded-full -z-10"
          style={glassPillSurface}
          transition={springConfig}
        />
      )}

      {visibleItems.map((item, index) => {
        const isActive = item.value === currentValue;

        return (
          <Link
            key={item.value}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              spaceModeNavItemVariants({ size, active: isActive }),
              'z-10'
            )}
            style={isActive ? glassPillSurface : undefined}
          >
            {/* Icon */}
            {showIcons && item.icon && (
              <span className="mr-1.5">{item.icon}</span>
            )}

            {/* Label */}
            <span>{item.label}</span>

            {/* Unread badge */}
            {item.hasUnread && (
              <span className={cn(unreadBadgeVariants({ size }))} />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export {
  SpaceModeNav,
  AnimatedSpaceModeNav,
  // Export variants
  spaceModeNavContainerVariants,
  spaceModeNavItemVariants,
  unreadBadgeVariants,
  // Export helpers
  detectActiveMode,
  // Export style helpers
  glassPillSurface as spaceModeGlassPillSurface,
  springConfig as spaceModeSpringConfig,
};
