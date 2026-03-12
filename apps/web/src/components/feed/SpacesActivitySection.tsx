'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Mono } from '@hive/ui/design-system/primitives';
import { SpaceAvatar } from './SpaceAvatar';

interface ActivityItem {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceHandle?: string;
  spaceAvatarUrl?: string;
  type: 'message' | 'event' | 'post' | 'app';
  preview: string;
  authorName?: string;
  timestamp: string;
}

async function fetchSpacesActivity(): Promise<ActivityItem[]> {
  const res = await fetch('/api/spaces/activity/recent?limit=6', { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.data?.items ?? [];
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function typeLabel(type: string): string {
  if (type === 'event') return 'posted a new event';
  if (type === 'post') return 'shared a post';
  if (type === 'app') return 'added a new app';
  return 'sent a message';
}

function spacesSubLabel(items: ActivityItem[]): string {
  if (items.length === 0) return '';
  // Count unique spaces
  const spaceNames = [...new Set(items.map((i) => i.spaceName))];
  // Find the most active space (most items)
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.spaceName, (counts.get(item.spaceName) ?? 0) + 1);
  }
  const topSpace = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topSpace && topSpace[1] >= 2) return `${topSpace[0]} is buzzing`;
  if (spaceNames.length === 1) return `New activity in ${spaceNames[0]}`;
  return `${spaceNames.length} spaces had activity this week`;
}

export function SpacesActivitySection() {
  const { data: items = [] } = useQuery({
    queryKey: ['feed-spaces-activity'],
    queryFn: fetchSpacesActivity,
    staleTime: 60_000,
  });

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Mono size="label" className="text-white/50">
          Your Spaces
        </Mono>
      </div>
      <p className="text-white/50 text-[14px] mb-3">
        {spacesSubLabel(items)}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id}>
            <Link
              href={`/s/${item.spaceHandle ?? item.spaceId}`}
              className="group flex items-start gap-3 rounded-lg px-3 py-2.5 -mx-1 hover:bg-white/[0.03] transition-colors"
            >
              <SpaceAvatar
                name={item.spaceName}
                url={item.spaceAvatarUrl}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/50 group-hover:text-white/70 transition-colors leading-snug">
                  <span className="text-white/70 font-medium">{item.spaceName}</span>{' '}
                  {typeLabel(item.type)}
                  {(item.type === 'event' || item.type === 'app') && (
                    <>
                      :{' '}
                      <span className="text-white/50">{item.type === 'event' ? item.preview.split(' - ')[0] : item.preview}</span>
                    </>
                  )}
                </p>
                <span className="text-[11px] text-white/30 tabular-nums">
                  {relativeTime(item.timestamp)}
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
