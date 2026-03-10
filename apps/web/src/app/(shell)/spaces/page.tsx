'use client';

import Link from 'next/link';
import { useMySpaces, type MySpace } from '@/hooks/queries/use-my-spaces';

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function SpaceRow({ space }: { space: MySpace }) {
  return (
    <Link
      href={`/s/${space.handle}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.10] transition-colors duration-100"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-white/[0.05] flex items-center justify-center shrink-0 overflow-hidden">
        {space.iconURL ? (
          <img src={space.iconURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-white/50">
            {space.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + secondary */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-white truncate">
            {space.name}
          </span>
        </div>
        <span className="text-[12px] text-white/30">
          {space.memberCount > 0
            ? `${space.memberCount} member${space.memberCount !== 1 ? 's' : ''}`
            : space.type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Right side: timestamp + unread */}
      <div className="flex items-center gap-2 shrink-0">
        {space.updatedAt && (
          <span className="font-mono text-[11px] text-white/30 tabular-nums">
            {relativeTime(space.updatedAt)}
          </span>
        )}
        {space.unreadCount > 0 && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shrink-0" />
        )}
      </div>
    </Link>
  );
}

export default function SpacesPage() {
  const { data: spaces = [], isLoading } = useMySpaces();

  return (
    <div className="mx-auto max-w-[640px] py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-clash text-[32px] font-semibold text-white">Spaces</h1>
        <Link
          href="/discover"
          className="text-[13px] text-white/50 hover:text-white transition-colors duration-100"
        >
          Browse all spaces
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.03] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-white/[0.03] rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[15px] text-white/50 mb-4">
            No spaces yet — join a few and they show up here.
          </p>
          <Link
            href="/discover"
            className="h-12 px-8 rounded-full bg-white text-black text-sm font-semibold inline-flex items-center justify-center hover:bg-white/90 transition-colors duration-100"
          >
            Find your clubs
          </Link>
        </div>
      )}

      {/* Space list */}
      {!isLoading && spaces.length > 0 && (
        <div className="flex flex-col">
          {spaces.map((space) => (
            <SpaceRow key={space.id} space={space} />
          ))}

          {/* Browse all link */}
          <Link
            href="/discover"
            className="mt-4 py-3 text-center text-[13px] text-white/30 hover:text-white/50 transition-colors duration-100"
          >
            Browse all spaces &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
