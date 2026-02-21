'use client';

/**
 * GhostSpaceCard Component
 *
 * Card variant for unclaimed/pre-seeded spaces (ghost spaces).
 * Designed to create "utility-based FOMO" - shows what could be claimed.
 *
 * Design Notes:
 * - Hollow dot (○) instead of filled (●) to indicate unclaimed
 * - Muted appearance compared to active SpaceCard
 * - "X interested" count shows demand (utility signal, not FOMO)
 * - Inline [claim] CTA for immediate action
 * - No warmth glow (no activity = no warmth)
 *
 * CRITICAL: This is NOT manipulative FOMO - it's showing a utility gap.
 * The message is "this org exists, no one has claimed it yet" not "you're missing out".
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Card,
  Avatar,
  AvatarFallback,
  Text,
  Badge,
  Button,
} from '../primitives';

// Import territory config from SpaceCard
import { type SpaceTerritory, territoryConfig } from './SpaceCard';

// ============================================
// TYPES
// ============================================

export interface GhostSpaceCardProps {
  space: {
    id: string;
    /** Handle without @ prefix (e.g., "ub-finance") */
    handle: string;
    name: string;
    description?: string;
    territory?: SpaceTerritory;
    /** Number of students who have searched/shown interest */
    interestedCount?: number;
  };
  /** Card size variant */
  variant?: 'default' | 'compact' | 'dense';
  /** Click handler for claim action */
  onClaim?: () => void;
  /** Click handler for card (show preview) */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const GhostSpaceCard: React.FC<GhostSpaceCardProps> = ({
  space,
  variant = 'default',
  onClaim,
  onClick,
  className,
}) => {
  const {
    handle,
    name,
    description,
    territory = 'default',
    interestedCount = 0,
  } = space;

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const territoryStyle = territoryConfig[territory];

  // Dense variant - ultra compact for grid layout (Phase 2 design)
  if (variant === 'dense') {
    return (
      <Card
        interactive={!!onClick}
        warmth="none" // No warmth for ghost spaces
        className={cn(
          'p-3 cursor-pointer',
          'transition-all duration-[var(--duration-smooth)]',
          'hover:bg-[var(--color-bg-elevated)]',
          'border-dashed border-white/[0.06]', // Dashed border = unclaimed
          className
        )}
        onClick={onClick}
      >
        <div className="space-y-2">
          {/* Handle + Name */}
          <div>
            <Text size="sm" weight="medium" className="font-sans text-muted-foreground">
              @{handle}
            </Text>
            <Text size="sm" className="truncate">
              {name}
            </Text>
          </div>

          {/* Status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Hollow dot = unclaimed */}
              <span className="w-2 h-2 rounded-full border border-muted-foreground/50" />
              <Text size="xs" tone="muted">
                unclaimed
              </Text>
            </div>
            {interestedCount > 0 && (
              <Text size="xs" tone="muted">
                {interestedCount} interested
              </Text>
            )}
          </div>

          {/* Claim CTA */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1"
            onClick={(e) => {
              e.stopPropagation();
              onClaim?.();
            }}
          >
            claim
          </Button>
        </div>
      </Card>
    );
  }

  // Compact variant - minimal for sidebar/lists
  if (variant === 'compact') {
    return (
      <Card
        interactive={!!onClick}
        warmth="none"
        className={cn(
          'p-3 cursor-pointer',
          'transition-all duration-[var(--duration-smooth)]',
          'hover:bg-[var(--color-bg-elevated)]',
          'border-dashed border-white/[0.06]',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with hollow ring */}
          <Avatar size="sm" className="opacity-60">
            <AvatarFallback className={cn(territoryStyle.fallbackBg, 'opacity-50')}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Text size="sm" weight="medium" className="truncate">
                {name}
              </Text>
              {/* Hollow dot indicator */}
              <span className="w-1.5 h-1.5 rounded-full border border-muted-foreground/50 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <Text size="xs" tone="muted">
                unclaimed
              </Text>
              {interestedCount > 0 && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <Text size="xs" tone="muted">
                    {interestedCount} interested
                  </Text>
                </>
              )}
            </div>
          </div>

          {/* Claim button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClaim?.();
            }}
          >
            claim
          </Button>
        </div>
      </Card>
    );
  }

  // Default variant - full card with territory header
  return (
    <Card
      elevation="resting"
      warmth="none"
      interactive={!!onClick}
      noPadding
      className={cn(
        'overflow-hidden cursor-pointer',
        'transition-all duration-[var(--duration-smooth)]',
        'hover:opacity-90',
        'border-dashed border-white/[0.06]',
        className
      )}
      onClick={onClick}
    >
      {/* Muted hero gradient header */}
      <div className={cn(
        'h-20 bg-gradient-to-br relative opacity-50',
        territoryStyle.gradient
      )}>
        {/* Unclaimed badge */}
        <Badge
          variant="outline"
          size="sm"
          className="absolute top-3 right-3 backdrop-blur-sm border-white/20 text-white/60"
        >
          Unclaimed
        </Badge>

        {/* Avatar placeholder */}
        <div className="absolute -bottom-8 left-5">
          <Avatar
            size="lg"
            className={cn(
              'w-16 h-16 rounded-xl',
              'shadow-xl opacity-60',
              'ring-4 ring-[rgba(18,18,18,0.92)]'
            )}
          >
            <AvatarFallback className={cn('rounded-xl text-xl opacity-50', territoryStyle.color)}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-4 px-5">
        {/* Handle */}
        <Text size="xs" className="font-sans text-muted-foreground mb-0.5">
          @{handle}
        </Text>

        {/* Title */}
        <Text size="default" weight="medium" className="mb-1">
          {name}
        </Text>

        {/* Description */}
        {description && (
          <Text size="sm" tone="muted" className="line-clamp-2 mb-3">
            {description}
          </Text>
        )}

        {/* Status row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            {/* Hollow dot */}
            <span className="w-2 h-2 rounded-full border border-muted-foreground/50" />
            <Text size="xs" tone="muted">
              No leader yet
            </Text>
          </div>

          {interestedCount > 0 && (
            <Text size="xs" tone="muted">
              {interestedCount} interested
            </Text>
          )}
        </div>

        {/* Claim CTA */}
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-4"
          onClick={(e) => {
            e.stopPropagation();
            onClaim?.();
          }}
        >
          Claim this space
        </Button>
      </div>
    </Card>
  );
};

GhostSpaceCard.displayName = 'GhostSpaceCard';

// ============================================
// SKELETON
// ============================================

interface GhostSpaceCardSkeletonProps {
  variant?: 'default' | 'compact' | 'dense';
  className?: string;
}

const GhostSpaceCardSkeleton: React.FC<GhostSpaceCardSkeletonProps> = ({
  variant = 'default',
  className,
}) => {
  if (variant === 'dense' || variant === 'compact') {
    return (
      <Card className={cn('p-3 border-dashed border-white/[0.06]', className)}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/[0.04] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-white/[0.04] animate-pulse" />
            <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
          </div>
          <div className="h-7 w-14 rounded-full bg-white/[0.04] animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card noPadding className={cn('overflow-hidden border-dashed border-white/[0.06]', className)}>
      <div className="h-20 bg-white/[0.04] animate-pulse relative">
        <div className="absolute -bottom-8 left-5">
          <div className="w-16 h-16 rounded-xl bg-white/[0.06] animate-pulse ring-4 ring-[rgba(18,18,18,0.92)]" />
        </div>
      </div>
      <div className="pt-12 pb-4 px-5 space-y-3">
        <div className="h-3 w-20 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-5 w-28 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-4 w-full rounded bg-white/[0.04] animate-pulse" />
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="h-3 w-20 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
        </div>
        <div className="h-8 w-full rounded-full bg-white/[0.04] animate-pulse mt-4" />
      </div>
    </Card>
  );
};

GhostSpaceCardSkeleton.displayName = 'GhostSpaceCardSkeleton';

// ============================================
// EXPORTS
// ============================================

export { GhostSpaceCard, GhostSpaceCardSkeleton };
