'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { useSpacesHQ, type Space } from '../hooks/useSpacesHQ';
import { SpaceCreationModal, SpaceClaimModal, SpaceJoinModal } from '@/components/spaces';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SpacesHubProps {
  isOnboarding?: boolean;
}

interface BrowseSpace {
  id: string;
  name: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  iconURL?: string;
  category?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  upcomingEventCount?: number;
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'student_org', label: 'Orgs' },
  { key: 'greek_life', label: 'Greek Life' },
  { key: 'campus_living', label: 'Housing' },
  { key: 'university_org', label: 'University' },
  { key: 'hive_exclusive', label: 'HIVE' },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

// ─────────────────────────────────────────────────────────────────────────────
// Your Space Pill (horizontal strip)
// ─────────────────────────────────────────────────────────────────────────────

function YourSpacePill({ space }: { space: Space }) {
  const hasUnread = (space.unreadCount ?? 0) > 0;
  const href = `/s/${encodeURIComponent(space.handle ?? space.id)}`;
  const initial = space.name.charAt(0).toUpperCase();

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px]"
    >
      <div className="relative">
        <div className={cn(
          'h-14 w-14 rounded-2xl overflow-hidden flex items-center justify-center',
          'bg-white/[0.06] border transition-colors',
          hasUnread ? 'border-[#FFD700]/40' : 'border-white/[0.06]'
        )}>
          {space.avatarUrl ? (
            <img src={space.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[18px] font-medium text-white/60">{initial}</span>
          )}
        </div>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#FFD700] border-2 border-black" />
        )}
      </div>
      <span className="text-[11px] text-white/50 text-center leading-tight line-clamp-2 w-full">
        {space.name}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discover Space Card (grid)
// ─────────────────────────────────────────────────────────────────────────────

function DiscoverSpaceCard({ space }: { space: BrowseSpace }) {
  const href = `/s/${encodeURIComponent(space.handle ?? space.id)}`;
  const avatarUrl = space.avatarUrl || space.iconURL;
  const initial = space.name.charAt(0).toUpperCase();

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-3 p-4 rounded-2xl',
        'bg-[#0D0D14] border border-white/[0.06]',
        'hover:border-white/[0.1] transition-all duration-150',
        'active:scale-[0.98]'
      )}
    >
      {/* Avatar */}
      <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.06]">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[20px] font-medium text-white/50">{initial}</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="text-[14px] font-medium text-white leading-snug line-clamp-1">
            {space.name}
          </p>
          {space.isJoined && (
            <span className="flex-shrink-0 text-[10px] font-mono uppercase tracking-[0.1em] text-[#FFD700]/70 mt-0.5">
              Joined
            </span>
          )}
        </div>
        <p className="text-[12px] text-white/35 line-clamp-2 leading-relaxed">
          {space.description || `${space.memberCount} member${space.memberCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30 font-mono">
          {space.memberCount > 0 ? `${space.memberCount.toLocaleString()} members` : 'New space'}
        </span>
        {space.upcomingEventCount && space.upcomingEventCount > 0 ? (
          <span className="text-[11px] text-[#FFD700]/60">
            {space.upcomingEventCount} event{space.upcomingEventCount !== 1 ? 's' : ''}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────

function PillSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 w-[72px]">
      <div className="h-14 w-14 rounded-2xl bg-white/[0.06] animate-pulse" />
      <div className="h-2.5 w-12 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#0D0D14] border border-white/[0.06]">
      <div className="h-12 w-12 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-20 rounded bg-white/[0.04] animate-pulse" />
      </div>
      <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function SpacesHub({ isOnboarding: _isOnboarding = false }: SpacesHubProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState<string | null>(null);
  const [claimDefaultQuery, setClaimDefaultQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>('all');
  const [discoverSpaces, setDiscoverSpaces] = React.useState<BrowseSpace[]>([]);
  const [discoverLoading, setDiscoverLoading] = React.useState(true);

  // Auth redirect
  React.useEffect(() => {
    if (!authLoading && !user) router.replace('/enter?redirect=/spaces');
  }, [authLoading, user, router]);

  // URL param modals
  React.useEffect(() => {
    const create = searchParams.get('create');
    const claim = searchParams.get('claim');
    const join = searchParams.get('join');
    if (create === 'true') {
      setShowCreateModal(true);
      router.replace('/spaces', { scroll: false });
    } else if (claim === 'true') {
      const handle = searchParams.get('handle');
      if (handle) setClaimDefaultQuery(handle);
      setShowClaimModal(true);
      router.replace('/spaces', { scroll: false });
    } else if (join) {
      setJoinCode(join);
      setShowJoinModal(true);
      router.replace('/spaces', { scroll: false });
    }
  }, [searchParams, router]);

  // Fetch discover spaces
  React.useEffect(() => {
    async function fetchDiscover() {
      setDiscoverLoading(true);
      try {
        const params = new URLSearchParams({
          sort: 'recommended',
          limit: '48',
          ...(activeCategory !== 'all' ? { category: activeCategory } : {}),
        });
        const res = await secureApiFetch(`/api/spaces/browse-v2?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setDiscoverSpaces((data.spaces || data.data || []) as BrowseSpace[]);
      } catch {
        // fail silently
      } finally {
        setDiscoverLoading(false);
      }
    }
    if (user) fetchDiscover();
  }, [user, activeCategory]);

  const { loading: yourLoading, organizations, refresh } = useSpacesHQ();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-[18px] font-medium text-white">Spaces</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] text-[13px] text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">

        {/* ── Your Spaces ── */}
        {(yourLoading || organizations.length > 0) && (
          <section className="pt-5 pb-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/30 mb-4">
              Your spaces
            </p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {yourLoading
                ? Array.from({ length: 4 }).map((_, i) => <PillSkeleton key={i} />)
                : organizations.map((space) => (
                    <YourSpacePill key={space.id} space={space} />
                  ))}
            </div>
          </section>
        )}

        {/* ── Discover ── */}
        <section className="pt-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/30 mb-4">
            Discover
          </p>

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex-shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all',
                  activeCategory === cat.key
                    ? 'bg-white text-black'
                    : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/60'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          {discoverLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : discoverSpaces.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px] text-white/30">No spaces in this category yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {discoverSpaces.map((space) => (
                <DiscoverSpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Modals */}
      <SpaceCreationModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); refresh(); }} />
      <SpaceClaimModal isOpen={showClaimModal} onClose={() => { setShowClaimModal(false); setClaimDefaultQuery(''); refresh(); }} defaultQuery={claimDefaultQuery} />
      <SpaceJoinModal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); refresh(); }} code={joinCode} />
    </div>
  );
}

SpacesHub.displayName = 'SpacesHub';
