'use client';

/**
 * InterestsBrowse
 * Browse student organizations and university resources
 * Search-first with instant filtering
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  motion,
  MOTION,
  RevealSection,
} from '@hive/ui/design-system/primitives';
import { SpaceBrowseCard } from './SpaceBrowseCard';

interface InterestsBrowseProps {
  searchQuery?: string;
}

interface SpaceDTO {
  id: string;
  name: string;
  slug?: string;
  handle?: string;
  description?: string;
  avatarUrl?: string;
  memberCount?: number;
  isMember?: boolean;
  isVerified?: boolean;
  category?: string;
  upcomingEventCount?: number;
  nextEvent?: { title: string; startAt: string };
}

interface BrowseResponse {
  category: string;
  spaces: SpaceDTO[];
  copy: {
    hero: string;
    fragment: string;
  };
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export function InterestsBrowse({ searchQuery }: InterestsBrowseProps) {
  const [data, setData] = React.useState<BrowseResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ category: 'interests' });
        if (searchQuery) params.set('q', searchQuery);

        const res = await fetch(`/api/spaces/browse?${params}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch interests browse data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery]);

  const loadMore = async () => {
    if (!data?.hasMore || !data?.nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        category: 'interests',
        cursor: data.nextCursor,
      });
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/spaces/browse?${params}`);
      const json = await res.json();

      setData((prev) => ({
        ...json,
        spaces: [...(prev?.spaces || []), ...json.spaces],
      }));
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <InterestsBrowseSkeleton />;
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40">Failed to load spaces</p>
      </div>
    );
  }

  const hasNoResults = data.spaces.length === 0;

  return (
    <div className="space-y-8">
      {/* Count */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/30">
          {data.totalCount} {data.totalCount === 1 ? 'space' : 'spaces'}
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>

      {/* Grid */}
      {data.spaces.length > 0 && (
        <RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.spaces.map((space, index) => (
              <SpaceBrowseCard
                key={space.id}
                space={space}
                index={index}
              />
            ))}
          </div>

          {/* Load More */}
          {data.hasMore && (
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className={cn(
                  'px-6 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200',
                  'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80',
                  loadingMore && 'opacity-50 cursor-not-allowed'
                )}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </motion.div>
          )}
        </RevealSection>
      )}

      {/* No Results */}
      {hasNoResults && (
        <div className="text-center py-16">
          <p className="text-white/40">
            {searchQuery
              ? `No spaces found matching "${searchQuery}"`
              : 'No interest spaces available yet'}
          </p>
        </div>
      )}
    </div>
  );
}

function InterestsBrowseSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-4 w-24 rounded bg-white/[0.02] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-36 rounded-2xl bg-white/[0.02] animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
