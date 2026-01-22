'use client';

/**
 * TerritoryMap - Visual space discovery for onboarding
 *
 * Shows campus spaces as a visual territory map:
 * - Claimed spaces (active orgs)
 * - Ghost spaces (unclaimed, with waitlist count)
 * - Search/filter functionality
 * - Quick join or claim actions
 */

import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MOTION, GlassSurface, Input, Badge } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export interface TerritorySpace {
  id: string;
  name: string;
  handle: string;
  description?: string;
  category: string;
  memberCount: number;
  /** Whether this is a claimed/active space */
  isClaimed: boolean;
  /** For unclaimed spaces: how many are waiting */
  waitlistCount?: number;
  /** Recent activity indicator */
  isActive?: boolean;
  /** User's relationship to this space */
  membership?: 'member' | 'pending' | 'none';
}

export interface TerritoryMapProps {
  /** Spaces to display */
  spaces: TerritorySpace[];
  /** Campus name for display */
  campusName: string;
  /** Loading state */
  loading?: boolean;
  /** Called when user selects a space */
  onSelectSpace?: (space: TerritorySpace) => void;
  /** Called when user claims an unclaimed space */
  onClaimSpace?: (space: TerritorySpace) => void;
  /** Called when user joins a claimed space */
  onJoinSpace?: (space: TerritorySpace) => void;
  className?: string;
}

// ============================================
// TERRITORY MAP
// ============================================

export function TerritoryMap({
  spaces,
  campusName,
  loading = false,
  onSelectSpace,
  onClaimSpace,
  onJoinSpace,
  className,
}: TerritoryMapProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  const filteredSpaces = useMemo(() => {
    let filtered = spaces;

    // Apply type filter
    if (filter === 'claimed') {
      filtered = filtered.filter((s) => s.isClaimed);
    } else if (filter === 'unclaimed') {
      filtered = filtered.filter((s) => !s.isClaimed);
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.handle.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [spaces, filter, search]);

  const claimedCount = spaces.filter((s) => s.isClaimed).length;
  const unclaimedCount = spaces.filter((s) => !s.isClaimed).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Stats */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
      >
        <p className="text-[14px] text-white/50">
          {claimedCount} orgs mapped at {campusName}
        </p>
        {unclaimedCount > 0 && (
          <p className="text-[12px] text-[var(--life-gold)]">
            {unclaimedCount} waiting to be claimed
          </p>
        )}
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.duration.base, delay: 0.1, ease: MOTION.ease.premium }}
      >
        <Input
          type="search"
          placeholder="Search spaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        <div className="flex items-center gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterPill>
          <FilterPill active={filter === 'claimed'} onClick={() => setFilter('claimed')}>
            Active ({claimedCount})
          </FilterPill>
          <FilterPill active={filter === 'unclaimed'} onClick={() => setFilter('unclaimed')}>
            Unclaimed ({unclaimedCount})
          </FilterPill>
        </div>
      </motion.div>

      {/* Space Grid */}
      <motion.div
        className="space-y-3 max-h-[300px] overflow-y-auto pr-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
      >
        {loading ? (
          <SpaceGridSkeleton />
        ) : filteredSpaces.length === 0 ? (
          <EmptyState search={search} filter={filter} />
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSpaces.map((space, i) => (
              <TerritorySpaceCard
                key={space.id}
                space={space}
                index={i}
                onSelect={onSelectSpace}
                onClaim={onClaimSpace}
                onJoin={onJoinSpace}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// TERRITORY SPACE CARD
// ============================================

interface TerritorySpaceCardProps {
  space: TerritorySpace;
  index: number;
  onSelect?: (space: TerritorySpace) => void;
  onClaim?: (space: TerritorySpace) => void;
  onJoin?: (space: TerritorySpace) => void;
}

function TerritorySpaceCard({
  space,
  index,
  onSelect,
  onClaim,
  onJoin,
}: TerritorySpaceCardProps) {
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (space.isClaimed) {
      onJoin?.(space);
    } else {
      onClaim?.(space);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: MOTION.ease.premium }}
    >
      <button
        type="button"
        onClick={() => onSelect?.(space)}
        className="w-full text-left"
      >
        <GlassSurface
          intensity="subtle"
          interactive
          className={cn(
            'p-4 rounded-xl',
            !space.isClaimed && 'border border-[var(--life-gold)]/20'
          )}
        >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-medium text-white truncate">
                {space.name}
              </h3>
              {space.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--life-gold)] animate-pulse" />
              )}
            </div>
            <p className="text-[12px] text-white/40 truncate">
              @{space.handle} · {space.category}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            {space.isClaimed ? (
              <span className="text-[11px] text-white/30">
                {space.memberCount} members
              </span>
            ) : (
              <Badge variant="outline" className="text-[10px] text-[var(--life-gold)] border-[var(--life-gold)]/30">
                {space.waitlistCount || 0} waiting
              </Badge>
            )}

            {/* Action Button */}
            <motion.button
              type="button"
              onClick={handleAction}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                space.isClaimed
                  ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  : 'bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold-hover)]'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {space.isClaimed ? 'Join' : 'Claim'}
            </motion.button>
          </div>
        </div>
        </GlassSurface>
      </button>
    </motion.div>
  );
}

// ============================================
// FILTER PILL
// ============================================

interface FilterPillProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ children, active, onClick }: FilterPillProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors',
        active
          ? 'bg-white/10 text-white'
          : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70'
      )}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  search: string;
  filter: string;
}

function EmptyState({ search, filter }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <p className="text-[14px] text-white/40">
        {search
          ? `No spaces matching "${search}"`
          : filter !== 'all'
            ? 'No spaces in this category'
            : 'No spaces found'}
      </p>
      <p className="text-[12px] text-white/20 mt-1">
        Try a different search or filter
      </p>
    </div>
  );
}

// ============================================
// SKELETON
// ============================================

function SpaceGridSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl bg-white/[0.02] animate-pulse"
        />
      ))}
    </div>
  );
}
