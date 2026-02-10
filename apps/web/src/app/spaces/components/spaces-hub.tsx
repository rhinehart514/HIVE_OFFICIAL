'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { useSpacesHQ, type Space } from '../hooks/useSpacesHQ';
import { SpaceCreationModal, SpaceClaimModal, SpaceJoinModal } from '@/components/spaces';

interface SpacesHubProps {
  isOnboarding?: boolean;
}

/* ── Space Row ─────────────────────────────────────────── */

function SpaceRow({ space }: { space: Space }) {
  const hasUnread = (space.unreadCount ?? 0) > 0;

  return (
    <Link
      href={`/s/${encodeURIComponent(space.handle ?? space.id)}`}
      className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.03]"
    >
      {/* Unread dot */}
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasUnread ? 'bg-[#FFD700]' : 'bg-transparent'}`}
        aria-hidden
      />

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.06]">
        {space.avatarUrl ? (
          <img src={space.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-white/50">
            {space.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + preview */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] font-medium ${hasUnread ? 'text-white' : 'text-white/50'}`}>
          {space.name}
        </p>
        <p className="truncate text-[13px] text-white/50">
          {space.memberCount} member{space.memberCount !== 1 ? 's' : ''}
          {space.category ? ` \u00b7 ${space.category}` : ''}
        </p>
      </div>

      {/* Arrow */}
      <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
    </Link>
  );
}

/* ── Main Component ────────────────────────────────────── */

export function SpacesHub({ isOnboarding: _isOnboarding = false }: SpacesHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState<string | null>(null);
  const [claimDefaultQuery, setClaimDefaultQuery] = React.useState('');

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

  const { loading, error, organizations, refresh } = useSpacesHQ();

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="mx-auto max-w-[640px] px-0 md:px-4">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-5 md:px-0">
          <h1 className="text-xl font-medium tracking-tight text-white">Spaces</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="rounded-full text-white/50 hover:bg-white/[0.06] hover:text-white"
          >
            <Plus size={16} className="mr-1.5" />
            New
          </Button>
        </header>

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <p className="mb-4 text-sm text-white/50">{error}</p>
            <Button
              onClick={refresh}
              variant="ghost"
              className="text-white/50 hover:bg-white/[0.06] hover:text-white"
            >
              <RefreshCw size={14} className="mr-2" />
              Try again
            </Button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-0">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3">
                <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                <div className="h-10 w-10 rounded-lg bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-white/[0.06]" />
                  <div className="h-3 w-24 rounded bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Space list */}
        {!loading && !error && (
          <>
            {organizations.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <p className="mb-4 text-sm text-white/50">
                  No spaces yet. Join a community or create your own.
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                  >
                    Create space
                  </Button>
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
                  >
                    Browse spaces
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                {organizations.map((space) => (
                  <SpaceRow key={space.id} space={space} />
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-6">
              <Link
                href="/discover"
                className="group flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
              >
                Browse all spaces
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <SpaceCreationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          refresh();
        }}
      />

      <SpaceClaimModal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
          setClaimDefaultQuery('');
          refresh();
        }}
        defaultQuery={claimDefaultQuery}
      />

      <SpaceJoinModal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          refresh();
        }}
        code={joinCode}
      />
    </div>
  );
}

SpacesHub.displayName = 'SpacesHub';
