'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Users, ArrowRight } from 'lucide-react';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { emitValueMoment } from '@/lib/pwa-triggers';
import { Mono } from '@hive/ui/design-system/primitives';
import type { FeedSpace } from './types';
import { SpaceAvatar } from './SpaceAvatar';

const PAGE_SIZE = 10;

async function fetchDiscoverSpaces({
  pageParam,
}: {
  pageParam: string | undefined;
}): Promise<{ spaces: FeedSpace[]; nextCursor?: string }> {
  const params = new URLSearchParams({
    category: 'all',
    sort: 'trending',
    limit: String(PAGE_SIZE),
    showAll: 'true',
  });
  if (pageParam) params.set('cursor', pageParam);

  const res = await fetch(`/api/spaces/browse-v2?${params}`, { credentials: 'include' });
  if (!res.ok) return { spaces: [] };

  const data = await res.json();
  const raw = data?.data?.spaces ?? data?.spaces ?? [];
  const spaces: FeedSpace[] = raw
    .filter((s: Record<string, unknown>) => !s.isJoined)
    .map((s: Record<string, unknown>) => ({
      id: s.id as string,
      handle: (s.handle || s.slug) as string | undefined,
      name: s.name as string,
      description: s.description as string | undefined,
      avatarUrl: (s.iconURL || s.bannerImage) as string | undefined,
      memberCount: (s.memberCount as number) || 0,
      isVerified: s.isVerified as boolean | undefined,
      isJoined: false,
      category: s.category as string | undefined,
      mutualCount: s.mutualCount as number | undefined,
      upcomingEventCount: s.upcomingEventCount as number | undefined,
      nextEventTitle: s.nextEventTitle as string | undefined,
    }));

  return {
    spaces,
    nextCursor: data?.data?.nextCursor ?? undefined,
  };
}

export function DiscoverSection() {
  const queryClient = useQueryClient();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['feed-discover-spaces'],
    queryFn: fetchDiscoverSpaces,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60_000,
  });

  const joinMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      setJoiningId(spaceId);
      const res = await secureApiFetch('/api/spaces/join-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      });
      if (!res.ok) throw new Error('Join failed');
    },
    onSuccess: (_data, spaceId) => {
      setJoinedIds((prev) => new Set(prev).add(spaceId));
      setJoiningId(null);
      emitValueMoment({ type: 'space-join', spaceId });
    },
    onError: () => setJoiningId(null),
  });

  const handleJoin = useCallback(
    (e: React.MouseEvent, spaceId: string) => {
      e.preventDefault();
      e.stopPropagation();
      joinMutation.mutate(spaceId);
    },
    [joinMutation],
  );

  const allSpaces = data?.pages.flatMap((p) => p.spaces) ?? [];
  const visibleSpaces = allSpaces.filter((s) => !joinedIds.has(s.id));

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mono size="label" className="text-white/50">
            Find your people
          </Mono>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-white/[0.04] rounded" />
                  <div className="h-2.5 w-16 bg-white/[0.03] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (visibleSpaces.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mono size="label" className="text-white/50">
            Find your people
          </Mono>
        </div>
        <p className="text-sm text-white/30 py-2">
          You&apos;ve explored all available spaces. Nice.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <Mono size="label" className="text-white/50">
          Discover
        </Mono>
        <Link
          href="/discover"
          className="text-[11px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-1"
        >
          Browse all <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visibleSpaces.map((space) => (
          <div key={space.id}>
            <Link
              href={`/s/${space.handle || space.id}`}
              className="group flex items-start gap-3 rounded-xl border border-white/[0.05] bg-card px-3.5 py-3 hover:border-white/[0.12] transition-colors duration-100"
            >
              <SpaceAvatar name={space.name} url={space.avatarUrl} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-white/70 group-hover:text-white transition-colors truncate">
                    {space.name}
                  </span>
                  {space.isVerified && (
                    <span className="text-[11px] text-[#FFD700]/50">&#10003;</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/30">
                  {space.mutualCount && space.mutualCount > 0 ? (
                    <span className="text-[#FFD700]/50">
                      {space.mutualCount} friend{space.mutualCount !== 1 ? 's' : ''} joined
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {space.memberCount}
                    </span>
                  )}
                  {space.nextEventTitle && (
                    <span className="truncate max-w-[120px]">
                      Next: {space.nextEventTitle}
                    </span>
                  )}
                  {!space.nextEventTitle && space.upcomingEventCount && space.upcomingEventCount > 0 && (
                    <span>
                      {space.upcomingEventCount} event
                      {space.upcomingEventCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleJoin(e, space.id)}
                disabled={joiningId === space.id}
                className="shrink-0 mt-1 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.08] border border-white/[0.10] text-white/50 hover:bg-white/[0.14] hover:text-white/70 transition-colors disabled:opacity-50"
              >
                {joiningId === space.id ? '...' : 'Join'}
              </button>
            </Link>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full mt-3 py-2.5 rounded-xl border border-white/[0.06] text-[12px] text-white/30 hover:text-white/50 hover:border-white/[0.10] transition-colors disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load more spaces'}
        </button>
      )}
    </section>
  );
}
