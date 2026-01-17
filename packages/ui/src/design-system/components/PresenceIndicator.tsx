'use client';

/**
 * PresenceIndicator Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P1 Blocker - Shows user online/offline status.
 * Two variants: dot (compact), badge (with text).
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

export type PresenceStatus = 'online' | 'away' | 'offline' | 'dnd' | 'invisible';

export interface PresenceIndicatorProps {
  /** Current status */
  status: PresenceStatus;
  /** Variant type */
  variant?: 'dot' | 'badge';
  /** Size */
  size?: 'xs' | 'sm' | 'default' | 'lg';
  /** Show pulse animation for online */
  pulse?: boolean;
  /** Custom label (for badge variant) */
  label?: string;
  /** Last seen time (for badge variant when offline) */
  lastSeen?: string;
  /** Additional className */
  className?: string;
}

const statusConfig: Record<
  PresenceStatus,
  { color: string; label: string; showPulse: boolean }
> = {
  online: {
    color: 'bg-[var(--color-accent-gold)]',
    label: 'Online',
    showPulse: true,
  },
  away: {
    color: 'bg-[var(--color-accent-gold)]/50',
    label: 'Away',
    showPulse: false,
  },
  offline: {
    color: 'bg-[var(--color-text-muted)]',
    label: 'Offline',
    showPulse: false,
  },
  dnd: {
    color: 'bg-[var(--color-status-error)]',
    label: 'Do not disturb',
    showPulse: false,
  },
  invisible: {
    color: 'bg-transparent border border-[var(--color-text-muted)]',
    label: 'Invisible',
    showPulse: false,
  },
};

const dotSizes = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  default: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const pulseSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  default: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * PresenceIndicator - Dot variant (default)
 */
const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  variant = 'dot',
  size = 'default',
  pulse = true,
  label,
  lastSeen,
  className,
}) => {
  const config = statusConfig[status];
  const shouldPulse = pulse && config.showPulse;

  // Dot variant
  if (variant === 'dot') {
    return (
      <span
        className={cn('relative inline-flex', className)}
        role="status"
        aria-label={config.label}
      >
        <span
          className={cn(
            'rounded-full',
            dotSizes[size],
            config.color,
            'transition-colors duration-[var(--duration-default)]'
          )}
        />
        {shouldPulse && (
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              pulseSizes[size],
              'bg-[var(--color-accent-gold)]/40',
              'animate-ping',
              '-translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2'
            )}
            style={{ animationDuration: '2s' }}
          />
        )}
      </span>
    );
  }

  // Badge variant
  const displayLabel = label || (status === 'offline' && lastSeen ? lastSeen : config.label);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        className
      )}
      role="status"
      aria-label={config.label}
    >
      <span
        className={cn(
          'rounded-full',
          dotSizes[size === 'lg' ? 'default' : 'sm'],
          config.color
        )}
      />
      <Text
        size={size === 'lg' ? 'sm' : 'xs'}
        tone={status === 'online' ? undefined : 'muted'}
        className={status === 'online' ? 'text-[var(--color-accent-gold)]' : undefined}
      >
        {displayLabel}
      </Text>
    </span>
  );
};

PresenceIndicator.displayName = 'PresenceIndicator';

/**
 * PresenceIndicatorGroup - Shows multiple presence states
 */
export interface PresenceIndicatorGroupProps {
  /** List of statuses to count */
  statuses: PresenceStatus[];
  /** Show only online count */
  onlineOnly?: boolean;
  /** Additional className */
  className?: string;
}

const PresenceIndicatorGroup: React.FC<PresenceIndicatorGroupProps> = ({
  statuses,
  onlineOnly = true,
  className,
}) => {
  const onlineCount = statuses.filter((s) => s === 'online').length;
  const awayCount = statuses.filter((s) => s === 'away').length;
  const totalActive = onlineCount + awayCount;

  if (onlineOnly) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
          'bg-[var(--color-accent-gold)]/10',
          className
        )}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--color-accent-gold)]" />
        <Text size="xs" className="text-[var(--color-accent-gold)]">
          {onlineCount} online
        </Text>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2 py-0.5 rounded-full',
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
        className
      )}
    >
      {onlineCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent-gold)]" />
          <Text size="xs" className="text-[var(--color-accent-gold)]">
            {onlineCount}
          </Text>
        </span>
      )}
      {awayCount > 0 && (
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent-gold)]/50" />
          <Text size="xs" tone="muted">
            {awayCount}
          </Text>
        </span>
      )}
      <Text size="xs" tone="muted">
        {totalActive} active
      </Text>
    </span>
  );
};

PresenceIndicatorGroup.displayName = 'PresenceIndicatorGroup';

/**
 * PresenceIndicatorInline - For member lists
 */
export interface PresenceIndicatorInlineProps {
  status: PresenceStatus;
  name: string;
  className?: string;
}

const PresenceIndicatorInline: React.FC<PresenceIndicatorInlineProps> = ({
  status,
  name,
  className,
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-label={`${name} is ${config.label}`}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full flex-shrink-0',
          config.color
        )}
      />
      <Text
        size="sm"
        className={cn(
          'truncate',
          status === 'offline' && 'text-[var(--color-text-muted)]'
        )}
      >
        {name}
      </Text>
    </span>
  );
};

PresenceIndicatorInline.displayName = 'PresenceIndicatorInline';

export { PresenceIndicator, PresenceIndicatorGroup, PresenceIndicatorInline };
