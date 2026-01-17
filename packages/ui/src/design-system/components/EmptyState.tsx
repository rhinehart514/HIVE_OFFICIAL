'use client';

/**
 * EmptyState Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Placeholder shown when a list or container has no data.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEFAULT (Centered vertical stack):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │                            ┌───────────┐                                │
 * │                            │   ICON    │   64x64 container, muted icon  │
 * │                            │    📦     │   (or custom illustration)     │
 * │                            └───────────┘                                │
 * │                                                                         │
 * │                        No items found                                   │
 * │                    Title: text-lg, font-medium                          │
 * │                                                                         │
 * │              There's nothing here yet. Start by                         │
 * │              creating your first item.                                  │
 * │                    Description: text-sm, text-muted                     │
 * │                                                                         │
 * │                      ┌─────────────────┐                                │
 * │                      │  Create First   │   Optional CTA button          │
 * │                      └─────────────────┘   variant="cta" (gold)         │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * COMPACT (Horizontal layout, less padding):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  📦  No items found                    [Create First]                   │
 * │      There's nothing here yet.                                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * INLINE (Minimal, for small containers):
 * ┌───────────────────────────────────┐
 * │  📦  No items yet                 │   Single line, small icon
 * └───────────────────────────────────┘
 *
 * SIZE VARIANTS:
 * - sm: Icon 40px, title text-base, description text-xs, padding 6
 * - default: Icon 64px, title text-lg, description text-sm, padding 12
 * - lg: Icon 96px, title text-xl, description text-base, padding 16
 *
 * ICON CONTAINER:
 * - Rounded-2xl
 * - Background: var(--color-bg-elevated)
 * - Border: 1px var(--color-border)
 * - Icon color: var(--color-text-muted)
 *
 * COLORS:
 * - Title: text-primary (white)
 * - Description: text-muted (gray)
 * - Icon: text-muted
 * - CTA: Gold button (variant="cta")
 *
 * ANIMATION:
 * - Fade-in on mount: animate-in fade-in-0 duration-300
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';
import { Button } from '../primitives/Button';

const emptyStateVariants = cva(
  'flex animate-in fade-in-0 duration-300',
  {
    variants: {
      variant: {
        default: 'flex-col items-center justify-center text-center',
        compact: 'flex-row items-start gap-4',
        inline: 'flex-row items-center gap-2',
      },
      size: {
        sm: 'p-6',
        default: 'p-12',
        lg: 'p-16',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const iconSizes = {
  sm: 'w-10 h-10',
  default: 'w-16 h-16',
  lg: 'w-24 h-24',
};

const iconContainerSizes = {
  sm: 'p-2',
  default: 'p-4',
  lg: 'p-6',
};

export interface EmptyStateProps
  extends VariantProps<typeof emptyStateVariants> {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Icon element or component */
  icon?: React.ReactNode;
  /** Custom illustration instead of icon container */
  illustration?: React.ReactNode;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'cta' | 'default' | 'secondary' | 'ghost';
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional className */
  className?: string;
  /** Children for custom content */
  children?: React.ReactNode;
}

/**
 * EmptyState - Placeholder for empty data states
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  size = 'default',
  title = 'No items found',
  description,
  icon,
  illustration,
  action,
  secondaryAction,
  className,
  children,
}) => {
  const sizeKey = size || 'default';

  // Default icon if none provided
  const defaultIcon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn(iconSizes[sizeKey], 'text-[var(--color-text-muted)]')}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );

  // Render icon container (unless using illustration)
  const renderIcon = () => {
    if (illustration) return illustration;
    if (variant === 'inline') {
      return icon || (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-4 h-4 text-[var(--color-text-muted)]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      );
    }
    return (
      <div
        className={cn(
          'rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
          'flex items-center justify-center',
          iconContainerSizes[sizeKey]
        )}
      >
        {icon || defaultIcon}
      </div>
    );
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={cn(emptyStateVariants({ variant, size: 'sm' }), className)}>
        {renderIcon()}
        <Text size="sm" tone="muted">
          {title}
        </Text>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn(emptyStateVariants({ variant, size: 'sm' }), className)}>
        {renderIcon()}
        <div className="flex-1 min-w-0">
          <Text size="default" weight="medium">
            {title}
          </Text>
          {description && (
            <Text size="sm" tone="muted" className="mt-1">
              {description}
            </Text>
          )}
          {children}
        </div>
        {action && (
          <Button
            variant={action.variant || 'cta'}
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  // Default centered variant
  return (
    <div className={cn(emptyStateVariants({ variant, size }), className)}>
      {/* Icon or Illustration */}
      <div className={cn(sizeKey === 'sm' ? 'mb-3' : sizeKey === 'lg' ? 'mb-6' : 'mb-4')}>
        {renderIcon()}
      </div>

      {/* Title */}
      <Text
        size={sizeKey === 'sm' ? 'default' : 'lg'}
        weight="medium"
        className="mb-2"
      >
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          size={sizeKey === 'sm' ? 'xs' : sizeKey === 'lg' ? 'default' : 'sm'}
          tone="muted"
          className="max-w-sm"
        >
          {description}
        </Text>
      )}

      {/* Custom children */}
      {children}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button
              variant={action.variant || 'cta'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

/**
 * EmptyStatePresets - Common empty state configurations
 */
export const EmptyStatePresets = {
  noMessages: {
    title: 'No messages yet',
    description: 'Start the conversation by sending a message',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  noMembers: {
    title: 'No members yet',
    description: 'Invite people to join this space',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  noEvents: {
    title: 'No upcoming events',
    description: 'Create an event to bring your community together',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  noTools: {
    title: 'No tools yet',
    description: 'Create your first tool in HiveLab',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  noSearchResults: {
    title: 'No results found',
    description: 'Try adjusting your search terms',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  noSpaces: {
    title: 'No spaces yet',
    description: 'Join a space or create your own to get started',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-[var(--color-text-muted)]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
};

export { EmptyState };
