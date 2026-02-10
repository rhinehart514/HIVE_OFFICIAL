'use client';

/**
 * SpaceListRow - Reusable list row for spaces
 *
 * Used in:
 * - Your Spaces section
 * - Discover section
 * - Search results
 *
 * Design: Linear-style list aesthetic with activity indicators
 *
 * @version 1.0.0 - Spaces Hub redesign (Jan 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  SimpleAvatar,
  Badge,
  AvatarGroup,
  SpaceHealthBadge,
  SpaceHealthEdge,
  getSpaceHealthLevel,
  type SpaceHealthLevel,
} from '@hive/ui/design-system/primitives';

// ============================================================
// Types
// ============================================================

export interface SpaceListRowSpace {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  category?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  // Activity signals
  lastActivityAt?: string | null;
  activityLevel?: 'active' | 'recent' | 'quiet';
  /** Recent message count (last 24h) for health calculation */
  recentMessageCount?: number;
  /** Online users count */
  onlineCount?: number;
  /** New members in last 7 days */
  newMembers7d?: number;
  // Social proof
  mutualCount?: number;
  mutualAvatars?: string[];
  // Events
  upcomingEventCount?: number;
  nextEventTitle?: string;
  // CampusLabs imported metadata
  orgTypeName?: string;
  email?: string;
  source?: 'ublinked' | 'user-created';
}

export interface SpaceListRowProps {
  space: SpaceListRowSpace;
  onClick?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  showJoinButton?: boolean;
  showActivityIndicator?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

// ============================================================
// Activity Indicator (Legacy - now uses SpaceHealthBadge)
// ============================================================

function ActivityIndicator({
  level,
}: {
  level: 'active' | 'recent' | 'quiet';
}) {
  // Map legacy activity levels to health levels
  const healthLevel: SpaceHealthLevel = level === 'active' ? 'active' : level === 'recent' ? 'moderate' : 'quiet';

  return (
    <SpaceHealthBadge
      level={healthLevel}
      variant="dot"
      dotSize="sm"
      animated={level === 'active'}
    />
  );
}

// ============================================================
// Join Button
// ============================================================

function JoinButton({
  isJoined,
  onJoin,
  onLeave,
}: {
  isJoined?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      if (isJoined && onLeave) {
        await onLeave();
      } else if (!isJoined && onJoin) {
        await onJoin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isJoined) {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
          'text-xs font-medium',
          'bg-white/[0.06] text-white/50',
          'hover:bg-white/[0.06] hover:text-white',
          'transition-all duration-150',
          'disabled:opacity-50'
        )}
      >
        <CheckIcon className="w-3.5 h-3.5" />
        <span>Joined</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'px-3 py-1.5 rounded-lg',
        'text-xs font-medium',
        'bg-white text-[var(--color-bg-void,#0A0A09)]',
        'hover:bg-white',
        'transition-all duration-150',
        'disabled:opacity-50'
      )}
    >
      {isLoading ? 'Joining...' : 'Join'}
    </button>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SpaceListRow({
  space,
  onClick,
  onJoin,
  onLeave,
  showJoinButton = true,
  showActivityIndicator = true,
  variant = 'default',
  className,
}: SpaceListRowProps) {
  // Compute health level from space metrics
  const healthLevel = React.useMemo((): SpaceHealthLevel => {
    return getSpaceHealthLevel({
      lastActivityAt: space.lastActivityAt,
      onlineCount: space.onlineCount,
      recentMessageCount: space.recentMessageCount,
      memberCount: space.memberCount,
      newMembers7d: space.newMembers7d,
    });
  }, [space.lastActivityAt, space.onlineCount, space.recentMessageCount, space.memberCount, space.newMembers7d]);

  // Map health level to legacy activity level for backward compat
  const activityLevel = React.useMemo(() => {
    if (space.activityLevel) return space.activityLevel;
    switch (healthLevel) {
      case 'active': return 'active';
      case 'moderate': return 'recent';
      default: return 'quiet';
    }
  }, [space.activityLevel, healthLevel]);

  const content = (
    <div
      className={cn(
        'group relative flex items-center gap-4',
        variant === 'compact' ? 'px-3 py-2.5' : 'px-4 py-3',
        'hover:bg-white/[0.06]',
        'transition-colors duration-150',
        'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Health edge indicator */}
      {showActivityIndicator && healthLevel !== 'quiet' && healthLevel !== 'dormant' && (
        <SpaceHealthEdge
          level={healthLevel}
          size="md"
          className="absolute left-0 top-1/2 -translate-y-1/2"
        />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <SimpleAvatar
          src={space.avatarUrl || space.bannerUrl}
          fallback={space.name.substring(0, 2)}
          size={variant === 'compact' ? 'sm' : 'default'}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text
            weight="medium"
            size={variant === 'compact' ? 'sm' : 'default'}
            className="text-white truncate"
          >
            {space.name}
          </Text>
          {space.isVerified && (
            <Badge variant="outline" size="sm" className="text-label-xs">
              Verified
            </Badge>
          )}
        </div>

        {/* Secondary info */}
        <div className="flex items-center gap-2 mt-0.5">
          <Text size="xs" className="text-white/50">
            {space.memberCount.toLocaleString()} {space.memberCount === 1 ? 'member' : 'members'}
          </Text>

          {/* Org type (for imported spaces) */}
          {space.orgTypeName && space.source === 'ublinked' && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/[0.06]" />
              <Text size="xs" className="text-white/50 truncate max-w-[100px]">
                {space.orgTypeName}
              </Text>
            </>
          )}

          {/* Mutual friends */}
          {space.mutualCount != null && space.mutualCount > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/[0.06]" />
              <div className="flex items-center gap-1.5">
                {space.mutualAvatars && space.mutualAvatars.length > 0 && (
                  <AvatarGroup
                    users={space.mutualAvatars.slice(0, 3).map((url, i) => ({
                      src: url,
                      name: `Friend ${i + 1}`,
                    }))}
                    size="xs"
                    max={3}
                  />
                )}
                <Text size="xs" className="text-emerald-400">
                  {space.mutualCount} friend{space.mutualCount !== 1 ? 's' : ''} here
                </Text>
              </div>
            </>
          )}

          {/* Upcoming events */}
          {space.upcomingEventCount != null && space.upcomingEventCount > 0 && !(space.mutualCount && space.mutualCount > 0) && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/[0.06]" />
              <Text size="xs" className="text-white/50">
                {space.upcomingEventCount} event{space.upcomingEventCount !== 1 ? 's' : ''} soon
              </Text>
            </>
          )}
        </div>
      </div>

      {/* Right side - Activity + Join */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Activity indicator */}
        {showActivityIndicator && variant !== 'compact' && (
          <ActivityIndicator level={activityLevel} />
        )}

        {/* Join button */}
        {showJoinButton && (
          <JoinButton
            isJoined={space.isJoined}
            onJoin={onJoin}
            onLeave={onLeave}
          />
        )}
      </div>
    </div>
  );

  // Wrap in Link if onClick not provided
  if (!onClick) {
    return (
      <Link href={`/spaces/${space.id}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================
// Skeleton
// ============================================================

export function SpaceListRowSkeleton({
  variant = 'default',
}: {
  variant?: 'default' | 'compact';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4',
        variant === 'compact' ? 'px-3 py-2.5' : 'px-4 py-3'
      )}
    >
      {/* Avatar skeleton */}
      <div
        className={cn(
          'rounded-lg bg-white/[0.06]',
          variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
        )}
      />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="h-3 w-20 bg-white/[0.06] rounded" />
      </div>

      {/* Button skeleton */}
      <div className="w-14 h-7 bg-white/[0.06] rounded-md" />
    </div>
  );
}

export default SpaceListRow;
