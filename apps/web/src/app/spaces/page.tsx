'use client';

/**
 * /spaces — Your Spaces Hub
 *
 * Archetype: Orientation
 * Pattern: Pinned + Stream
 * Shell: ON
 *
 * Structure:
 * - PINNED: User-curated favorites (cards)
 * - RECENT ACTIVITY: Spaces sorted by last message (list)
 * - ALL SPACES: Everything else (grid/list toggle)
 *
 * @version 6.0.0 - Redesigned per Spaces Vertical Slice spec (Jan 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pin, PinOff, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Button, SimpleAvatar } from '@hive/ui/design-system/primitives';

// ============================================================
// Types
// ============================================================

interface SpaceMembership {
  id: string;
  name: string;
  handle: string;
  description?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  category: 'university' | 'student' | 'residential' | 'greek';
  intent?: 'academic' | 'social' | 'professional';
  memberCount: number;
  membership: {
    role: string;
    joinedAt: string;
    lastVisited: string;
    notifications: number;
    pinned: boolean;
  };
  lastActivity?: {
    type: 'message' | 'event' | 'resource';
    preview: string;
    timestamp: string;
    authorName?: string;
  };
}

interface SpacesResponse {
  activeSpaces: SpaceMembership[];
  pinnedSpaces: SpaceMembership[];
  stats: {
    totalSpaces: number;
    adminSpaces: number;
    totalNotifications: number;
  };
}

// ============================================================
// Category Helpers
// ============================================================

function getCategoryAccentClass(category: string): string {
  const map: Record<string, string> = {
    university: 'category-accent-university',
    student: 'category-accent-student',
    residential: 'category-accent-residential',
    greek: 'category-accent-greek',
  };
  return map[category] || 'category-accent-student';
}

function getCategoryIndicatorClass(category: string): string {
  const map: Record<string, string> = {
    university: 'category-indicator-university',
    student: 'category-indicator-student',
    residential: 'category-indicator-residential',
    greek: 'category-indicator-greek',
  };
  return map[category] || 'category-indicator-student';
}

// ============================================================
// Time Formatting
// ============================================================

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================
// Components
// ============================================================

function PinnedSpaceCard({
  space,
  onUnpin,
}: {
  space: SpaceMembership;
  onUnpin: (spaceId: string) => void;
}) {
  return (
    <Link
      href={`/spaces/${space.id}`}
      className={cn(
        'group relative flex flex-col p-4',
        'rounded-lg bg-white/[0.02] hover:bg-white/[0.04]',
        'border border-white/[0.06]',
        'transition-all duration-150'
      )}
    >
      {/* Category accent */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[3px] rounded-t-lg',
          getCategoryAccentClass(space.category)
        )}
      />

      {/* Unpin button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUnpin(space.id);
        }}
        className={cn(
          'absolute top-3 right-3 p-1.5 rounded',
          'opacity-0 group-hover:opacity-100',
          'bg-white/[0.06] hover:bg-white/[0.1]',
          'transition-opacity duration-150'
        )}
        title="Unpin space"
      >
        <PinOff className="h-3.5 w-3.5 text-white/40" />
      </button>

      {/* Space name */}
      <Text weight="medium" className="text-white/90 mb-1 pr-8">
        {space.name}
      </Text>

      {/* Category + Intent */}
      <Text size="xs" className="text-white/40 capitalize mb-3">
        {space.category}{space.intent && ` · ${space.intent}`}
      </Text>

      {/* Activity indicator */}
      {space.lastActivity && (
        <div className="mt-auto pt-2 border-t border-white/[0.04]">
          <Text size="xs" className="text-white/50 truncate">
            {space.lastActivity.preview}
          </Text>
        </div>
      )}

      {/* Online indicator */}
      {space.membership.notifications > 0 && (
        <span className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-[var(--hive-gold)]" />
      )}
    </Link>
  );
}

function ActivitySpaceRow({
  space,
  onPin,
}: {
  space: SpaceMembership;
  onPin: (spaceId: string) => void;
}) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <Link
      href={`/spaces/${space.id}`}
      className={cn(
        'group flex items-center gap-4 px-4 py-3',
        'hover:bg-white/[0.02]',
        'border-b border-white/[0.04] last:border-b-0',
        'transition-colors duration-150'
      )}
    >
      {/* Category indicator */}
      <div
        className={cn(
          'category-indicator h-10',
          getCategoryIndicatorClass(space.category)
        )}
      />

      {/* Avatar */}
      <SimpleAvatar
        src={space.avatarUrl}
        fallback={space.name.substring(0, 2)}
        size="default"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text weight="medium" className="text-white/90 truncate">
            {space.name}
          </Text>
          {space.membership.notifications > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--hive-gold)] text-black rounded-full">
              {space.membership.notifications}
            </span>
          )}
        </div>
        {space.lastActivity ? (
          <Text size="sm" className="text-white/50 truncate">
            {space.lastActivity.authorName && `${space.lastActivity.authorName}: `}
            {space.lastActivity.preview}
          </Text>
        ) : (
          <Text size="sm" className="text-white/40">
            {space.memberCount} members
          </Text>
        )}
      </div>

      {/* Timestamp */}
      <Text size="xs" className="text-white/30 font-mono flex-shrink-0">
        {space.lastActivity
          ? formatRelativeTime(space.lastActivity.timestamp)
          : formatRelativeTime(space.membership.lastVisited)}
      </Text>

      {/* Actions */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={cn(
            'p-1.5 rounded',
            'opacity-0 group-hover:opacity-100',
            'hover:bg-white/[0.06]',
            'transition-opacity duration-150'
          )}
        >
          <MoreHorizontal className="h-4 w-4 text-white/40" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute right-0 top-full mt-1 z-20 py-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl min-w-[140px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPin(space.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.04]"
              >
                <Pin className="h-3.5 w-3.5" />
                Pin to top
              </button>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Pinned skeleton */}
      <div>
        <div className="h-4 w-16 bg-white/[0.06] rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-white/[0.04] rounded-lg" />
          <div className="h-28 bg-white/[0.04] rounded-lg" />
        </div>
      </div>
      {/* Activity skeleton */}
      <div>
        <div className="h-4 w-32 bg-white/[0.06] rounded mb-4" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white/[0.02] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Text className="text-white/40 mb-4">
        You haven&apos;t joined any spaces yet
      </Text>
      <Button variant="default" onClick={() => router.push('/spaces/browse')}>
        Browse Spaces
      </Button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SpacesPage() {
  const router = useRouter();
  const [data, setData] = React.useState<SpacesResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch spaces
  React.useEffect(() => {
    async function fetchSpaces() {
      try {
        const res = await fetch('/api/spaces/my', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch spaces');
        const json = await res.json();
        // API returns { success: true, data: {...} }
        if (json.success && json.data) {
          setData(json.data);
        } else if (json.activeSpaces !== undefined) {
          // Direct response (no wrapper)
          setData(json);
        } else {
          throw new Error(json.error?.message || 'Invalid response');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSpaces();
  }, []);

  // Refresh data helper
  const refreshData = async () => {
    const res = await fetch('/api/spaces/my', { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else if (json.activeSpaces !== undefined) {
        setData(json);
      }
    }
  };

  // Pin/Unpin handlers
  const handlePin = async (spaceId: string) => {
    try {
      await fetch('/api/spaces/my', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ spaceId, action: 'pin' }),
      });
      await refreshData();
    } catch (err) {
      console.error('Failed to pin space:', err);
    }
  };

  const handleUnpin = async (spaceId: string) => {
    try {
      await fetch('/api/spaces/my', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ spaceId, action: 'unpin' }),
      });
      await refreshData();
    } catch (err) {
      console.error('Failed to unpin space:', err);
    }
  };

  // Separate spaces into categories
  const pinnedSpaces = data?.pinnedSpaces || [];
  const activeSpaces = data?.activeSpaces || [];
  const unpinnedSpaces = activeSpaces.filter(
    (s) => !pinnedSpaces.some((p) => p.id === s.id)
  );

  // Sort unpinned by recent activity
  const sortedUnpinned = [...unpinnedSpaces].sort((a, b) => {
    const aTime = a.lastActivity?.timestamp || a.membership.lastVisited;
    const bTime = b.lastActivity?.timestamp || b.membership.lastVisited;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight">
              Your Spaces
            </h1>
            {data && (
              <Text size="sm" className="text-white/40">
                {data.stats.totalSpaces} space{data.stats.totalSpaces !== 1 && 's'}
              </Text>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push('/spaces/create')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create
          </Button>
        </div>

        {/* Loading */}
        {isLoading && <LoadingSkeleton />}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <Text className="text-red-400">{error}</Text>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && activeSpaces.length === 0 && <EmptyState />}

        {/* Content */}
        {!isLoading && !error && activeSpaces.length > 0 && (
          <div className="space-y-10">
            {/* PINNED */}
            {pinnedSpaces.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Pin className="h-3.5 w-3.5 text-white/30" />
                  <Text
                    weight="medium"
                    className="text-[11px] uppercase tracking-wider text-white/40"
                  >
                    Pinned
                  </Text>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {pinnedSpaces.map((space) => (
                    <PinnedSpaceCard
                      key={space.id}
                      space={space}
                      onUnpin={handleUnpin}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* RECENT ACTIVITY */}
            <section>
              <Text
                weight="medium"
                className="text-[11px] uppercase tracking-wider text-white/40 mb-4"
              >
                Recent Activity
              </Text>
              <div className="rounded-lg border border-white/[0.06] overflow-hidden">
                {sortedUnpinned.map((space) => (
                  <ActivitySpaceRow
                    key={space.id}
                    space={space}
                    onPin={handlePin}
                  />
                ))}
              </div>
            </section>

            {/* Browse more */}
            <div className="text-center pt-4">
              <Link
                href="/spaces/browse"
                className="text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Browse more spaces →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
