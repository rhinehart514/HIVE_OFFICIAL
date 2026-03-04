'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SpaceAvatar } from './SpaceAvatar';

interface ActivityItem {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceHandle?: string;
  spaceAvatarUrl?: string;
  type: 'message' | 'event' | 'post';
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
  return 'sent a message';
}

export function SpacesActivitySection() {
  const { data: items = [] } = useQuery({
    queryKey: ['feed-spaces-activity'],
    queryFn: fetchSpacesActivity,
    staleTime: 60_000,
  });

  if (items.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">
            Your Spaces
          </span>
        </div>
        <p className="text-sm text-white/25 py-2">
          No recent activity in your spaces. Join some below to get started.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-sans uppercase tracking-[0.14em] text-white/30">
          Your Spaces
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
          >
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
                  {item.type === 'event' && (
                    <>
                      :{' '}
                      <span className="text-white/60">{item.preview.split(' - ')[0]}</span>
                    </>
                  )}
                </p>
                <span className="text-[10px] text-white/20 tabular-nums">
                  {relativeTime(item.timestamp)}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
