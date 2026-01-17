'use client';

/**
 * SpaceCard Component — LOCKED 2026-01-11
 *
 * Immersive Portal design: Apple-style hero card with territory identity
 *
 * LOCKED DECISIONS:
 * 1. Visual Identity: Full Header with territory gradient + badge
 * 2. Activity Indicators: Card warmth via primitive (gold edge glow)
 * 3. Info Density: Standard (name + desc + count + "X you know" in gold)
 * 4. Layout: Immersive Portal (floating avatar, stat columns)
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Card,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Text,
  Badge,
  AvatarGroup,
  getWarmthFromActiveUsers,
} from '../primitives';

// ============================================
// TERRITORY SYSTEM
// ============================================

export type SpaceTerritory = 'academic' | 'creative' | 'social' | 'professional' | 'wellness' | 'default';

const territoryConfig: Record<SpaceTerritory, {
  gradient: string;
  label: string;
  color: string;
  fallbackBg: string;
}> = {
  academic: {
    gradient: 'from-blue-600/80 to-blue-900/60',
    label: 'Academic',
    color: 'text-blue-300 border-blue-400/30',
    fallbackBg: 'bg-blue-600/20',
  },
  creative: {
    gradient: 'from-purple-600/80 to-purple-900/60',
    label: 'Creative',
    color: 'text-purple-300 border-purple-400/30',
    fallbackBg: 'bg-purple-600/20',
  },
  social: {
    gradient: 'from-amber-600/80 to-amber-900/60',
    label: 'Social',
    color: 'text-amber-300 border-amber-400/30',
    fallbackBg: 'bg-amber-600/20',
  },
  professional: {
    gradient: 'from-emerald-600/80 to-emerald-900/60',
    label: 'Professional',
    color: 'text-emerald-300 border-emerald-400/30',
    fallbackBg: 'bg-emerald-600/20',
  },
  wellness: {
    gradient: 'from-rose-600/80 to-rose-900/60',
    label: 'Wellness',
    color: 'text-rose-300 border-rose-400/30',
    fallbackBg: 'bg-rose-600/20',
  },
  default: {
    gradient: 'from-white/10 to-white/5',
    label: 'Community',
    color: 'text-white/70 border-white/20',
    fallbackBg: 'bg-white/10',
  },
};

// ============================================
// TYPES
// ============================================

export interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    category?: string;
    territory?: SpaceTerritory;
    memberCount: number;
    onlineCount: number;
    mutualCount?: number; // "X you know"
    members?: Array<{ id: string; avatar?: string; name?: string }>;
  };
  /** Card size variant */
  variant?: 'default' | 'compact';
  /** Featured/promoted badge */
  featured?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const SpaceCard: React.FC<SpaceCardProps> = ({
  space,
  variant = 'default',
  featured = false,
  onClick,
  className,
}) => {
  const {
    name,
    description,
    avatar,
    territory = 'default',
    memberCount,
    onlineCount,
    mutualCount = 0,
    members = [],
  } = space;

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // LOCKED: Calculate warmth from online count via primitive
  const warmthLevel = getWarmthFromActiveUsers(onlineCount);
  const territoryStyle = territoryConfig[territory];

  // Compact variant - minimal for sidebar/lists
  if (variant === 'compact') {
    return (
      <Card
        interactive={!!onClick}
        warmth={warmthLevel}
        className={cn(
          'p-3 cursor-pointer',
          'transition-all duration-[var(--duration-smooth)]',
          'hover:bg-[var(--color-bg-elevated)]',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className={territoryStyle.fallbackBg}>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Text weight="medium" className="truncate">
              {name}
            </Text>
            <div className="flex items-center gap-2">
              <Text size="xs" tone="muted">
                {onlineCount > 0 ? (
                  <span className="text-[var(--color-accent-gold)]">{onlineCount} online</span>
                ) : (
                  `${memberCount} members`
                )}
              </Text>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // LOCKED: Immersive Portal layout (default)
  return (
    <Card
      elevation="raised"
      warmth={warmthLevel}
      interactive={!!onClick}
      noPadding
      className={cn(
        'overflow-hidden cursor-pointer',
        'transition-all duration-[var(--duration-smooth)]',
        // LOCKED: NO scale on hover, use opacity-90
        'hover:opacity-90',
        className
      )}
      onClick={onClick}
    >
      {/* LOCKED: Hero gradient header */}
      <div className={cn(
        'h-28 bg-gradient-to-br relative',
        territoryStyle.gradient
      )}>
        {/* Territory badge */}
        <Badge
          variant="outline"
          size="sm"
          className={cn(
            'absolute top-4 right-4 backdrop-blur-sm',
            territoryStyle.color
          )}
        >
          {territoryStyle.label}
        </Badge>

        {/* Featured badge */}
        {featured && (
          <Badge
            variant="gold"
            size="sm"
            className="absolute top-4 left-4"
          >
            Featured
          </Badge>
        )}

        {/* LOCKED: Large floating avatar */}
        <div className="absolute -bottom-10 left-6">
          <Avatar
            size="2xl"
            className={cn(
              'w-20 h-20 rounded-2xl',
              'shadow-2xl',
              'ring-4 ring-[rgba(18,18,18,0.92)]'
            )}
          >
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className={cn('rounded-2xl text-2xl', territoryStyle.color)}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* LOCKED: Content with generous padding */}
      <div className="pt-14 pb-5 px-6">
        {/* Title */}
        <Text size="lg" weight="medium" className="mb-1">
          {name}
        </Text>

        {/* Description */}
        {description && (
          <Text size="sm" tone="muted" className="line-clamp-2 mb-4">
            {description}
          </Text>
        )}

        {/* LOCKED: Stat row with "X you know" in gold */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          {/* Members */}
          <div className="flex items-center gap-3">
            {members.length > 0 && (
              <AvatarGroup
                users={members.slice(0, 3).map((m) => ({
                  id: m.id,
                  name: m.name || 'Member',
                  avatar: m.avatar,
                }))}
                max={3}
                size="xs"
              />
            )}
            <Text size="xs" tone="muted">
              {memberCount.toLocaleString()} members
            </Text>
          </div>

          {/* "X you know" in gold */}
          {mutualCount > 0 && (
            <Text size="xs" className="text-[var(--color-accent-gold)]">
              {mutualCount} you know
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

SpaceCard.displayName = 'SpaceCard';

// ============================================
// SKELETON
// ============================================

interface SpaceCardSkeletonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const SpaceCardSkeleton: React.FC<SpaceCardSkeletonProps> = ({
  variant = 'default',
  className,
}) => {
  if (variant === 'compact') {
    return (
      <Card className={cn('p-3', className)}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card noPadding className={cn('overflow-hidden', className)}>
      {/* Header skeleton */}
      <div className="h-28 bg-white/[0.06] animate-pulse relative">
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.08] animate-pulse ring-4 ring-[rgba(18,18,18,0.92)]" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="pt-14 pb-5 px-6 space-y-3">
        <div className="h-5 w-32 rounded bg-white/[0.06] animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-5 w-5 rounded-lg bg-white/[0.06] animate-pulse ring-2 ring-[#0a0a09]"
                />
              ))}
            </div>
            <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

SpaceCardSkeleton.displayName = 'SpaceCardSkeleton';

// ============================================
// EXPORTS
// ============================================

export { SpaceCard, SpaceCardSkeleton, territoryConfig };
