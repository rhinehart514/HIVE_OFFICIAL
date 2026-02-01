'use client';

/**
 * YourSpacesList - Your joined spaces section
 *
 * Shows user's joined spaces with smart sorting:
 * 1. Spaces with unread activity first
 * 2. Recent activity (24h)
 * 3. Interaction frequency
 * 4. Alphabetical fallback
 *
 * @version 1.0.0 - Spaces Hub redesign (Jan 2026)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import {
  Text,
  Skeleton,
} from '@hive/ui/design-system/primitives';
import {
  SpaceListRow,
  SpaceListRowSkeleton,
  type SpaceListRowSpace,
} from './space-list-row';

// ============================================================
// Types
// ============================================================

export interface YourSpace extends SpaceListRowSpace {
  membership: {
    role: string;
    notifications: number;
    lastVisited: string;
    pinned: boolean;
  };
}

export interface YourSpacesListProps {
  spaces: YourSpace[];
  loading?: boolean;
  onNavigateToSpace: (spaceId: string) => void;
  onBrowseAll?: () => void;
}

// ============================================================
// Sorting Logic
// ============================================================

function sortSpaces(spaces: YourSpace[]): YourSpace[] {
  return [...spaces].sort((a, b) => {
    // 1. Unread notifications first
    const aUnread = a.membership.notifications > 0 ? 1 : 0;
    const bUnread = b.membership.notifications > 0 ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;

    // 2. Recent activity (within 24h)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const aRecent = a.lastActivityAt
      ? now - new Date(a.lastActivityAt).getTime() < dayMs
      : false;
    const bRecent = b.lastActivityAt
      ? now - new Date(b.lastActivityAt).getTime() < dayMs
      : false;
    if (aRecent !== bRecent) return bRecent ? 1 : -1;

    // 3. Last visited (interaction frequency proxy)
    const aVisited = new Date(a.membership.lastVisited).getTime();
    const bVisited = new Date(b.membership.lastVisited).getTime();
    if (aVisited !== bVisited) return bVisited - aVisited;

    // 4. Alphabetical fallback
    return a.name.localeCompare(b.name);
  });
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
        <HomeIcon className="w-6 h-6 text-white/40" />
      </div>
      <Text weight="medium" className="text-white/70 mb-2">
        Ready to explore?
      </Text>
      <Text size="sm" className="text-white/40 mb-4 max-w-xs mx-auto">
        Browse spaces below to find your communities and connect with your campus.
      </Text>
      {onBrowse && (
        <button
          onClick={onBrowse}
          className={cn(
            'px-5 py-2.5 rounded-xl',
            'text-sm font-medium',
            'bg-white text-[var(--color-bg-void,#0A0A09)]',
            'hover:bg-white/90',
            'transition-colors duration-150',
            'shadow-sm'
          )}
        >
          Browse Spaces
        </button>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function YourSpacesList({
  spaces,
  loading = false,
  onNavigateToSpace,
  onBrowseAll,
}: YourSpacesListProps) {
  const sortedSpaces = React.useMemo(() => sortSpaces(spaces), [spaces]);

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                i !== 4 && 'border-b border-white/[0.04]'
              )}
            >
              <SpaceListRowSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (spaces.length === 0) {
    return (
      <section className="mb-8">
        <Text
          weight="medium"
          className="text-label-sm uppercase tracking-wider text-white/40 mb-4"
        >
          Your Spaces
        </Text>
        <EmptyState onBrowse={onBrowseAll} />
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Text
            weight="medium"
            className="text-label-sm uppercase tracking-wider text-white/40"
          >
            Your Spaces
          </Text>
          <span className="px-1.5 py-0.5 text-label-xs font-medium text-white/30 bg-white/[0.04] rounded">
            {spaces.length}
          </span>
        </div>

        {onBrowseAll && (
          <button
            onClick={onBrowseAll}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Browse All
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl border border-white/[0.06] overflow-hidden"
      >
        {sortedSpaces.map((space, index) => (
          <motion.div
            key={space.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className={cn(
              'relative',
              index !== sortedSpaces.length - 1 && 'border-b border-white/[0.04]'
            )}
          >
            <SpaceListRow
              space={{
                ...space,
                isJoined: true,
              }}
              onClick={() => onNavigateToSpace(space.id)}
              showJoinButton={false}
              showActivityIndicator={true}
            />

            {/* Notification badge */}
            {space.membership.notifications > 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="px-1.5 py-0.5 text-label-xs font-medium bg-[var(--color-accent-gold,#FFD700)] text-black rounded-full">
                  {space.membership.notifications}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default YourSpacesList;
