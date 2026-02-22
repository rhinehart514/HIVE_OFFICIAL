'use client';

/**
 * ToolCard Component — LOCKED 2026-02-21
 *
 * The canonical tool card. Category icon in corner, space origin, edge warmth.
 * Cursor-spotlight glow on hover (replaces opacity-90). Recency warmth via lastUsedAt.
 *
 * LOCKED DECISIONS:
 * 1. Visual Identity: Category Icon (Heroicons, not emojis)
 * 2. Status Indicators: Badge for status (Draft, Featured), edge warmth for featured/trending
 * 3. Action Treatment: Click-through only (entire card is clickable)
 * 4. Hover: Cursor-following spotlight glow — subtle, not decorative
 * 5. NO scale on hover (LOCKED)
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Card,
  Text,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  getInitials,
  getWarmthFromActiveUsers,
} from '../primitives';

// ============================================
// CATEGORY ICONS (Heroicons)
// ============================================

type ToolCategory = 'academic' | 'productivity' | 'social' | 'housing' | 'finance' | 'health' | 'creative' | 'default';

const categoryIcons: Record<ToolCategory, React.FC<{ className?: string }>> = {
  academic: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  productivity: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  social: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  housing: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  finance: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  health: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  creative: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  ),
  default: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
};

function CategoryIcon({ category, className }: { category?: string; className?: string }) {
  const normalizedCategory = (category?.toLowerCase() as ToolCategory) || 'default';
  const Icon = categoryIcons[normalizedCategory] || categoryIcons.default;
  return <Icon className={className} />;
}

// ============================================
// RECENCY WARMTH
// ============================================

/**
 * Convert lastUsedAt timestamp to warmth level based on recency.
 * Tools used recently feel warmer.
 */
function getWarmthFromRecency(lastUsedAt?: string): 'none' | 'low' | 'medium' | 'high' {
  if (!lastUsedAt) return 'none';
  const hoursAgo = (Date.now() - new Date(lastUsedAt).getTime()) / 3_600_000;
  if (hoursAgo < 1) return 'high';
  if (hoursAgo < 24) return 'medium';
  if (hoursAgo < 168) return 'low'; // 7 days
  return 'none';
}

// ============================================
// CURSOR SPOTLIGHT HOOK
// ============================================

function useCursorSpotlight() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [hovered, setHovered] = React.useState(false);

  const onMouseMove = React.useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return { ref, pos, hovered, onMouseMove, setHovered };
}

// ============================================
// TYPES
// ============================================

export interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    useCount: number;
    status?: 'draft' | 'published' | 'featured' | 'trending';
    /** ISO timestamp of last use — drives recency warmth */
    lastUsedAt?: string;
    /** Space this tool belongs to */
    space?: {
      id: string;
      name: string;
      avatar?: string;
    };
    /** Author if no space */
    author?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  /** Card variant */
  variant?: 'default' | 'compact';
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * LOCKED: Workshop Card Layout
 * - Category icon in corner
 * - Category label uppercase above title
 * - Space logo + origin in footer
 * - Edge warmth for featured/trending OR recency
 * - Cursor-spotlight glow on hover
 */
const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  variant = 'default',
  onClick,
  className,
}) => {
  const {
    name,
    description,
    category,
    useCount,
    status,
    lastUsedAt,
    space,
    author,
  } = tool;

  const spotlight = useCursorSpotlight();

  // LOCKED: Edge warmth — featured/trending takes priority, then recency
  const isFeaturedOrTrending = status === 'featured' || status === 'trending';
  const warmthLevel = isFeaturedOrTrending ? 'high' : getWarmthFromRecency(lastUsedAt);

  // Get origin info (space or author)
  const originName = space?.name || author?.name || 'Unknown';
  const originAvatar = space?.avatar || author?.avatar;
  const originInitials = getInitials(originName);

  const spotlightOverlay = spotlight.hovered ? (
    <div
      className="pointer-events-none absolute inset-0 z-0 rounded-[var(--radius-xl)] transition-opacity duration-300"
      style={{
        background: `radial-gradient(300px circle at ${spotlight.pos.x}px ${spotlight.pos.y}px, rgba(255,255,255,0.03), transparent 60%)`,
      }}
    />
  ) : null;

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card
        ref={spotlight.ref}
        elevation="resting"
        interactive
        warmth={warmthLevel}
        className={cn(
          'p-3 cursor-pointer relative',
          'transition-all duration-[var(--duration-smooth)]',
          className
        )}
        onClick={onClick}
        onMouseMove={spotlight.onMouseMove}
        onMouseEnter={() => spotlight.setHovered(true)}
        onMouseLeave={() => spotlight.setHovered(false)}
      >
        {spotlightOverlay}
        <div className="relative z-10 flex items-center gap-3">
          {/* LOCKED: Category icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.06] flex-shrink-0">
            <CategoryIcon category={category} className="w-5 h-5 text-white/60" />
          </div>

          <div className="flex-1 min-w-0">
            <Text weight="medium" className="truncate">
              {name}
            </Text>
            <Text size="xs" tone="muted" className="truncate">
              {useCount.toLocaleString()} uses
            </Text>
          </div>

          {/* Status badge */}
          {status === 'featured' && (
            <Badge variant="gold" size="sm">Featured</Badge>
          )}
          {status === 'trending' && (
            <Badge variant="gold" size="sm">Trending</Badge>
          )}
          {status === 'draft' && (
            <Badge variant="default" size="sm">Draft</Badge>
          )}
        </div>
      </Card>
    );
  }

  // LOCKED: Workshop Card Layout (default)
  return (
    <Card
      ref={spotlight.ref}
      elevation="raised"
      interactive
      warmth={warmthLevel}
      noPadding
      className={cn(
        'overflow-hidden cursor-pointer relative',
        'transition-all duration-[var(--duration-smooth)]',
        className
      )}
      onClick={onClick}
      onMouseMove={spotlight.onMouseMove}
      onMouseEnter={() => spotlight.setHovered(true)}
      onMouseLeave={() => spotlight.setHovered(false)}
    >
      {spotlightOverlay}
      <div className="relative z-10 p-5">
        {/* LOCKED: Header - category label + title + category icon */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            {/* LOCKED: Category label uppercase */}
            {category && (
              <Text size="xs" tone="muted" className="uppercase tracking-wider mb-1">
                {category}
              </Text>
            )}
            {/* Title */}
            <Text size="lg" weight="semibold" className="text-xl truncate">
              {name}
            </Text>
          </div>

          {/* LOCKED: Category icon in corner */}
          <Card
            elevation="resting"
            noPadding
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
          >
            <CategoryIcon category={category} className="w-6 h-6 text-white/60" />
          </Card>
        </div>

        {/* LOCKED: Description */}
        {description && (
          <Text size="sm" tone="secondary" className="mb-4 line-clamp-2">
            {description}
          </Text>
        )}

        {/* Status badges */}
        {(status === 'featured' || status === 'trending' || status === 'draft') && (
          <div className="mb-4">
            {status === 'featured' && (
              <Badge variant="gold" size="sm">Featured</Badge>
            )}
            {status === 'trending' && (
              <Badge variant="gold" size="sm">Trending</Badge>
            )}
            {status === 'draft' && (
              <Badge variant="default" size="sm">Draft</Badge>
            )}
          </div>
        )}

        {/* LOCKED: Footer - space/author origin + uses */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          {/* LOCKED: Space logo + origin */}
          <div className="flex items-center gap-2">
            <Avatar size="xs">
              {originAvatar && <AvatarImage src={originAvatar} alt={originName} />}
              <AvatarFallback>{originInitials}</AvatarFallback>
            </Avatar>
            <Text size="sm" tone="muted" className="truncate max-w-[120px]">
              {originName}
            </Text>
          </div>

          {/* LOCKED: Uses count */}
          <Text size="sm" tone="muted">
            {useCount.toLocaleString()} uses
          </Text>
        </div>
      </div>
    </Card>
  );
};

ToolCard.displayName = 'ToolCard';

// ============================================
// SKELETON
// ============================================

interface ToolCardSkeletonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

const ToolCardSkeleton: React.FC<ToolCardSkeletonProps> = ({
  variant = 'default',
  className,
}) => {
  if (variant === 'compact') {
    return (
      <Card elevation="resting" className={cn('p-3', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card elevation="raised" noPadding className={cn('overflow-hidden', className)}>
      <div className="p-5">
        {/* Header skeleton */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-40 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full rounded bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white/[0.06] animate-pulse" />
            <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
        </div>
      </div>
    </Card>
  );
};

ToolCardSkeleton.displayName = 'ToolCardSkeleton';

// ============================================
// EXPORTS
// ============================================

export { ToolCard, ToolCardSkeleton, CategoryIcon, getWarmthFromRecency };
