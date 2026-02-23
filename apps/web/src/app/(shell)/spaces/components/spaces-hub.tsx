'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { useMySpaces, type MySpace } from '@/hooks/queries/use-my-spaces';
import { SpaceCreationModal, SpaceClaimModal, SpaceJoinModal } from '@/components/spaces';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { cn } from '@/lib/utils';
import { SpacesFirstEntry } from './spaces-first-entry';

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

function YourSpacePill({ space }: { space: MySpace }) {
  const hasUnread = space.unreadCount > 0;
  const href = `/s/${encodeURIComponent(space.handle ?? space.id)}`;
  const initial = space.name.charAt(0).toUpperCase();

  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px]">
      <div className="relative">
        <div className={cn(
          'h-12 w-12 rounded-xl overflow-hidden flex items-center justify-center',
          'bg-white/[0.06] border transition-colors',
          hasUnread ? 'border-[#FFD700]/40' : 'border-white/[0.06]'
        )}>
          {space.iconURL ? (
            <img src={space.iconURL} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[16px] font-medium text-white/50">{initial}</span>
          )}
        </div>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#FFD700] border-2 border-black" />
        )}
      </div>
      <span className="text-[11px] text-white/40 text-center leading-tight line-clamp-2 w-full">
        {space.name}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discover Space Card — compact grid card
// ─────────────────────────────────────────────────────────────────────────────

function DiscoverSpaceCard({ space }: { space: BrowseSpace }) {
  const href = `/s/${encodeURIComponent(space.handle ?? space.id)}`;
  const avatarUrl = space.avatarUrl || space.iconURL;
  const initial = space.name.charAt(0).toUpperCase();

  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-3 p-3.5 rounded-xl',
        'bg-[#0a0a0a] border border-white/[0.06]',
        'hover:border-white/[0.12] hover:bg-white/[0.02] transition-all duration-150',
        'active:scale-[0.99]'
      )}
    >
      {/* Avatar row */}
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.06]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[16px] font-medium text-white/40">{initial}</span>
          )}
        </div>
        {space.isJoined && (
          <span className="text-[10px] text-[#FFD700]/60 mt-0.5">Joined</span>
        )}
      </div>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-white leading-snug line-clamp-1 mb-1">
          {space.name}
        </p>
        <p className="text-[12px] text-white/30 line-clamp-2 leading-relaxed">
          {space.description || '\u00a0'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {space.memberCount > 0 ? (
          <span className="text-[11px] text-white/25">
            {space.memberCount.toLocaleString()} {space.memberCount === 1 ? 'member' : 'members'}
          </span>
        ) : (
          <span className="text-[11px] text-white/15">New</span>
        )}
        {space.upcomingEventCount && space.upcomingEventCount > 0 ? (
          <span className="text-[11px] text-[#FFD700]/50">
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
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px]">
      <div className="h-12 w-12 rounded-xl bg-white/[0.06] animate-pulse" />
      <div className="h-2.5 w-10 rounded bg-white/[0.04] animate-pulse" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-[#0a0a0a] border border-white/[0.06]">
      <div className="h-10 w-10 rounded-lg bg-white/[0.06] animate-pulse" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-24 rounded bg-white/[0.06] animate-pulse" />
        <div className="h-3 w-32 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-20 rounded bg-white/[0.04] animate-pulse" />
      </div>
      <div className="h-2.5 w-16 rounded bg-white/[0.04] animate-pulse" />
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
  const [firstEntryDone, setFirstEntryDone] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('spaces-first-entry-done') === 'true';
    }
    return false;
  });

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
          showAll: 'true',
          ...(activeCategory !== 'all' ? { category: activeCategory } : {}),
        });
        const res = await secureApiFetch(`/api/spaces/browse-v2?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const spaces = data?.data?.spaces ?? data?.spaces ?? [];
        setDiscoverSpaces(Array.isArray(spaces) ? spaces : []);
      } catch {
        // fail silently
      } finally {
        setDiscoverLoading(false);
      }
    }
    if (user) fetchDiscover();
  }, [user, activeCategory]);

  const { data: mySpaces = [], isLoading: spacesLoading, refetch: refreshSpaces } = useMySpaces();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/[0.06] border-t-[#FFD700] animate-spin" />
      </div>
    );
  }

  // First-entry: no spaces joined yet — show smart match reveal
  if (!spacesLoading && mySpaces.length === 0 && !firstEntryDone) {
    return (
      <SpacesFirstEntry
        onComplete={() => {
          setFirstEntryDone(true);
          sessionStorage.setItem('spaces-first-entry-done', 'true');
          refreshSpaces();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-10">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
        <div className="px-6">
          {/* Title row */}
          <div className="flex items-center justify-between py-4">
            <h1 className="text-[17px] font-semibold text-white">Spaces</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {/* Tab filters — no pill backgrounds */}
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'flex-shrink-0 pb-3 text-[13px] font-medium transition-colors border-b-[1.5px]',
                  activeCategory === cat.key
                    ? 'text-white border-[#FFD700]'
                    : 'text-white/35 border-transparent hover:text-white/60'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6">

        {/* ── Your Spaces ── */}
        {(spacesLoading || mySpaces.length > 0) && (
          <section className="pt-5 pb-4 border-b border-white/[0.04]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/25 mb-4">
              Your spaces
            </p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {spacesLoading
                ? Array.from({ length: 5 }).map((_, i) => <PillSkeleton key={i} />)
                : mySpaces.map((space) => (
                    <YourSpacePill key={space.id} space={space} />
                  ))}
            </div>
          </section>
        )}

        {/* ── Discover Grid ── */}
        <section className="pt-5">
          {discoverLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : discoverSpaces.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[14px] text-white/25">No spaces in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {discoverSpaces.map((space) => (
                <DiscoverSpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Modals */}
      <SpaceCreationModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); refreshSpaces(); }} />
      <SpaceClaimModal isOpen={showClaimModal} onClose={() => { setShowClaimModal(false); setClaimDefaultQuery(''); refreshSpaces(); }} defaultQuery={claimDefaultQuery} />
      <SpaceJoinModal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); refreshSpaces(); }} code={joinCode} />
    </div>
  );
}

SpacesHub.displayName = 'SpacesHub';
