'use client';

/**
 * TopBar Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P1 Blocker - Space header bar for Spaces and HiveLab.
 * Three variants: minimal, breadcrumbs, collapsible.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Text,
  Heading,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  getInitials,
} from '../primitives';

export interface TopBarProps {
  /** Page/space title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Avatar/icon */
  avatar?: {
    src?: string;
    fallback?: string;
  };
  /** Breadcrumb items */
  breadcrumbs?: Array<{ label: string; href?: string; onClick?: () => void }>;
  /** Badge text (e.g., "12 online") */
  badge?: string;
  /** Badge variant */
  badgeVariant?: 'neutral' | 'gold' | 'success';
  /** Left action button */
  leftAction?: React.ReactNode;
  /** Right action buttons */
  actions?: React.ReactNode;
  /** Variant type */
  variant?: 'minimal' | 'breadcrumbs' | 'collapsible';
  /** Whether header is collapsed (for collapsible variant) */
  collapsed?: boolean;
  /** Sticky positioning */
  sticky?: boolean;
  /** Border bottom */
  bordered?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Breadcrumb component
 */
const Breadcrumb: React.FC<{
  items: Array<{ label: string; href?: string; onClick?: () => void }>;
}> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && (
          <span className="text-[var(--color-text-muted)]" aria-hidden>
            /
          </span>
        )}
        {item.onClick || item.href ? (
          <button
            type="button"
            className={cn(
              'text-sm transition-colors duration-[var(--duration-snap)]',
              i === items.length - 1
                ? 'text-[var(--color-text-primary)] font-medium'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            )}
            onClick={item.onClick}
          >
            {item.label}
          </button>
        ) : (
          <Text
            size="sm"
            tone={i === items.length - 1 ? undefined : 'muted'}
            weight={i === items.length - 1 ? 'medium' : undefined}
          >
            {item.label}
          </Text>
        )}
      </React.Fragment>
    ))}
  </nav>
);

/**
 * TopBar - Main component
 */
const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  avatar,
  breadcrumbs,
  badge,
  badgeVariant = 'neutral',
  leftAction,
  actions,
  variant = 'minimal',
  collapsed = false,
  sticky = true,
  bordered = true,
  className,
}) => {
  // Minimal variant
  if (variant === 'minimal') {
    return (
      <header
        className={cn(
          'flex items-center justify-between gap-4',
          'px-4 py-3',
          'bg-[var(--color-bg-page)]/95 backdrop-blur-md',
          bordered && 'border-b border-[var(--color-border)]',
          sticky && 'sticky top-0 z-40',
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {leftAction}
          {avatar && (
            <Avatar size="sm">
              {avatar.src && <AvatarImage src={avatar.src} alt={title} />}
              <AvatarFallback>{avatar.fallback || getInitials(title)}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Heading level={2} className="truncate text-lg">
                {title}
              </Heading>
              {badge && (
                <Badge variant={badgeVariant} size="sm">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <Text size="xs" tone="muted" className="truncate">
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    );
  }

  // Breadcrumbs variant
  if (variant === 'breadcrumbs') {
    return (
      <header
        className={cn(
          'flex flex-col gap-1',
          'px-4 py-3',
          'bg-[var(--color-bg-page)]/95 backdrop-blur-md',
          bordered && 'border-b border-[var(--color-border)]',
          sticky && 'sticky top-0 z-40',
          className
        )}
      >
        {/* Breadcrumbs row */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2">
            {leftAction}
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {avatar && (
              <Avatar size="default">
                {avatar.src && <AvatarImage src={avatar.src} alt={title} />}
                <AvatarFallback>{avatar.fallback || getInitials(title)}</AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Heading level={1} className="truncate">
                  {title}
                </Heading>
                {badge && (
                  <Badge variant={badgeVariant} size="sm">
                    {badge}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <Text size="sm" tone="muted" className="truncate">
                  {subtitle}
                </Text>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>
    );
  }

  // Collapsible variant
  return (
    <header
      className={cn(
        'transition-all duration-300 ease-in-out',
        'bg-[var(--color-bg-page)]/95 backdrop-blur-md',
        bordered && 'border-b border-[var(--color-border)]',
        sticky && 'sticky top-0 z-40',
        collapsed ? 'py-2 px-4' : 'py-4 px-4',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {leftAction}
          {avatar && (
            <Avatar size={collapsed ? 'sm' : 'default'}>
              {avatar.src && <AvatarImage src={avatar.src} alt={title} />}
              <AvatarFallback>{avatar.fallback || getInitials(title)}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Heading
                level={collapsed ? 2 : 1}
                className={cn('truncate', collapsed && 'text-lg')}
              >
                {title}
              </Heading>
              {badge && !collapsed && (
                <Badge variant={badgeVariant} size="sm">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && !collapsed && (
              <Text size="sm" tone="muted" className="truncate">
                {subtitle}
              </Text>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};

TopBar.displayName = 'TopBar';

/**
 * TopBarSkeleton - Loading placeholder
 */
const TopBarSkeleton: React.FC<{
  variant?: 'minimal' | 'breadcrumbs';
  className?: string;
}> = ({ variant = 'minimal', className }) => (
  <div
    className={cn(
      'flex items-center justify-between gap-4 px-4 py-3',
      'border-b border-[var(--color-border)]',
      className
    )}
  >
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-xl bg-[var(--color-bg-elevated)] animate-pulse" />
      <div className="space-y-2">
        <div className="h-5 w-32 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
        {variant === 'breadcrumbs' && (
          <div className="h-3 w-24 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
        )}
      </div>
    </div>
    <div className="flex gap-2">
      <div className="h-8 w-8 rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />
      <div className="h-8 w-8 rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />
    </div>
  </div>
);

TopBarSkeleton.displayName = 'TopBarSkeleton';

export { TopBar, TopBarSkeleton, Breadcrumb };
