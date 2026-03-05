'use client';

import Link from 'next/link';
import { useMySpaces, type MySpace } from '@/hooks/queries/use-my-spaces';

function SpaceRow({ space }: { space: MySpace }) {
  return (
    <Link
      href={`/s/${space.handle}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors duration-100"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[#111] border border-white/[0.05] flex items-center justify-center shrink-0 overflow-hidden">
        {space.iconURL ? (
          <img src={space.iconURL} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-white/50">
            {space.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + type */}
      <div className="flex-1 min-w-0">
        <span className="text-[15px] font-medium text-white truncate block">
          {space.name}
        </span>
        <span className="font-mono text-[11px] text-white/30 uppercase">
          {space.type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Unread dot */}
      {space.unreadCount > 0 && (
        <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shrink-0" />
      )}
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
          className="text-[14px] text-white/50 hover:text-white transition-colors duration-100"
        >
          Browse all
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
                <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-[15px] text-white/50 mb-4">
            You haven't joined any spaces yet.
          </p>
          <Link
            href="/discover"
            className="h-12 px-8 rounded-full bg-[#FFD700] text-black text-sm font-semibold inline-flex items-center justify-center hover:bg-[#FFD700]/90 transition-colors duration-100"
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
        </div>
      )}
    </div>
  );
}
