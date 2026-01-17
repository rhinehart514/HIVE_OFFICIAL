'use client';

/**
 * ReactionBadge Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * P0 Blocker - Shows emoji + count on chat messages.
 * Two variants: compact (inline), expanded (shows users).
 */

import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';
import { Text } from '../primitives';

export interface ReactionBadgeProps {
  /** Emoji to display */
  emoji: string;
  /** Reaction count */
  count: number;
  /** Users who reacted (for tooltip) */
  users?: string[];
  /** Whether the current user has reacted */
  hasReacted?: boolean;
  /** Click handler to toggle reaction */
  onClick?: () => void;
  /** Variant type */
  variant?: 'compact' | 'expanded';
  /** Additional className */
  className?: string;
}

/**
 * ReactionBadge - Shows emoji + count
 */
const ReactionBadge: React.FC<ReactionBadgeProps> = ({
  emoji,
  count,
  users = [],
  hasReacted = false,
  onClick,
  variant = 'compact',
  className,
}) => {
  const badge = (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
        'transition-all duration-[var(--duration-snap)]',
        'border',
        hasReacted
          ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)]'
          : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        className
      )}
      onClick={onClick}
      aria-label={`${emoji} reaction, ${count} ${count === 1 ? 'person' : 'people'}${hasReacted ? ', you reacted' : ''}`}
    >
      <span className="text-base leading-none">{emoji}</span>
      <Text
        size="xs"
        weight="medium"
        className={hasReacted ? 'text-[var(--color-accent-gold)]' : undefined}
      >
        {count}
      </Text>
    </button>
  );

  // Compact variant with tooltip showing users
  if (variant === 'compact' && users.length > 0) {
    return (
      <Tooltip.Provider delayDuration={300}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className={cn(
                'z-50 px-3 py-2 rounded-lg',
                'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                'shadow-lg',
                'animate-in fade-in-0 zoom-in-95'
              )}
              sideOffset={5}
            >
              <Text size="xs" weight="medium" className="mb-1">
                {emoji} {count}
              </Text>
              <div className="space-y-0.5">
                {users.slice(0, 5).map((user, i) => (
                  <Text key={i} size="xs" tone="muted">
                    {user}
                  </Text>
                ))}
                {users.length > 5 && (
                  <Text size="xs" tone="muted">
                    +{users.length - 5} more
                  </Text>
                )}
              </div>
              <Tooltip.Arrow className="fill-[var(--color-bg-elevated)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  return badge;
};

ReactionBadge.displayName = 'ReactionBadge';

/**
 * ReactionBadgeExpanded - Shows emoji with user avatars
 */
export interface ReactionBadgeExpandedProps extends Omit<ReactionBadgeProps, 'variant'> {
  /** Maximum users to show inline */
  maxUsers?: number;
}

const ReactionBadgeExpanded: React.FC<ReactionBadgeExpandedProps> = ({
  emoji,
  count,
  users = [],
  hasReacted = false,
  onClick,
  maxUsers = 3,
  className,
}) => {
  const displayUsers = users.slice(0, maxUsers);
  const remainingCount = count - displayUsers.length;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'transition-all duration-[var(--duration-snap)]',
        'border',
        hasReacted
          ? 'bg-[var(--color-accent-gold)]/10 border-[var(--color-accent-gold)]/30'
          : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        className
      )}
      onClick={onClick}
      aria-label={`${emoji} reaction, ${count} ${count === 1 ? 'person' : 'people'}`}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <div className="flex items-center gap-1">
        {displayUsers.map((user, i) => (
          <Text key={i} size="xs" tone="secondary" className="truncate max-w-[60px]">
            {user}
          </Text>
        ))}
        {remainingCount > 0 && (
          <Text size="xs" tone="muted">
            +{remainingCount}
          </Text>
        )}
      </div>
    </button>
  );
};

ReactionBadgeExpanded.displayName = 'ReactionBadgeExpanded';

/**
 * ReactionBadgeGroup - Group of reaction badges
 */
export interface ReactionBadgeGroupProps {
  reactions: Array<{
    emoji: string;
    count: number;
    users?: string[];
    hasReacted?: boolean;
  }>;
  onToggle?: (emoji: string) => void;
  variant?: 'compact' | 'expanded';
  className?: string;
}

const ReactionBadgeGroup: React.FC<ReactionBadgeGroupProps> = ({
  reactions,
  onToggle,
  variant = 'compact',
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {reactions.map((reaction) => (
        <ReactionBadge
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          users={reaction.users}
          hasReacted={reaction.hasReacted}
          onClick={onToggle ? () => onToggle(reaction.emoji) : undefined}
          variant={variant}
        />
      ))}
    </div>
  );
};

ReactionBadgeGroup.displayName = 'ReactionBadgeGroup';

export { ReactionBadge, ReactionBadgeExpanded, ReactionBadgeGroup };
