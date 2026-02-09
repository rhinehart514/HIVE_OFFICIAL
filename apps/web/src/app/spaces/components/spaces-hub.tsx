'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { useSpacesHQ } from '../hooks/useSpacesHQ';
import { SpaceCreationModal, SpaceClaimModal, SpaceJoinModal } from '@/components/spaces';
import { HubActive } from './hub-active';

interface SpacesHubProps {
  isOnboarding?: boolean;
}

function Header({ onCreateSpace }: { onCreateSpace: () => void }) {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <h1 className="text-xl font-medium tracking-tight text-white/90">Spaces</h1>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreateSpace}
        className="text-white/60 hover:bg-white/[0.06] hover:text-white/90"
      >
        <Plus size={18} className="mr-2" />
        New
      </Button>
    </header>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
        <span className="h-2 w-2 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-medium text-white/90">Something went wrong</h2>
        <p className="mb-6 text-sm leading-relaxed text-white/50">
          {error || 'Failed to load your spaces. Please try again.'}
        </p>
        <Button onClick={onRetry} className="bg-white/[0.08] text-white/90 hover:bg-white/[0.12]">
          <RefreshCw size={16} className="mr-2" />
          Try again
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onCreateSpace }: { onCreateSpace: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <h2 className="mb-3 text-2xl font-semibold text-white">No spaces yet</h2>
        <p className="mb-6 text-sm text-white/50">
          Claim your identity and join existing communities, or create a new space.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={onCreateSpace} className="bg-white text-black hover:bg-white/90">
            Create space
          </Button>
          <Button
            variant="ghost"
            onClick={() => (window.location.href = '/spaces/browse')}
            className="text-white/80 hover:bg-white/[0.06]"
          >
            Browse spaces
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SpacesHub({ isOnboarding: _isOnboarding = false }: SpacesHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const create = searchParams.get('create');
    const claim = searchParams.get('claim');
    const join = searchParams.get('join');

    if (create === 'true') {
      setShowCreateModal(true);
      router.replace('/spaces', { scroll: false });
    } else if (claim === 'true') {
      setShowClaimModal(true);
      router.replace('/spaces', { scroll: false });
    } else if (join) {
      setJoinCode(join);
      setShowJoinModal(true);
      router.replace('/spaces', { scroll: false });
    }
  }, [searchParams, router]);

  const {
    state,
    loading,
    error,
    identityClaims,
    organizations,
    refresh,
  } = useSpacesHQ();

  const handleMuteSpace = async (spaceId: string) => {
    try {
      await fetch(`/api/spaces/${spaceId}/mute`, { method: 'POST' });
      refresh();
    } catch {
      // no-op
    }
  };

  const handleLeaveSpace = async (spaceId: string) => {
    try {
      await fetch(`/api/spaces/${spaceId}/leave`, { method: 'POST' });
      refresh();
    } catch {
      // no-op
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black">
      <Header onCreateSpace={() => setShowCreateModal(true)} />

      {loading && <LoadingState />}
      {!loading && error && <ErrorState error={error} onRetry={refresh} />}

      {!loading && !error && state === 'empty' && (
        <EmptyState onCreateSpace={() => setShowCreateModal(true)} />
      )}

      {!loading && !error && state !== 'empty' && (
        <HubActive
          identityClaims={identityClaims}
          organizations={organizations}
          onCreateSpace={() => setShowCreateModal(true)}
          onMuteSpace={handleMuteSpace}
          onLeaveSpace={handleLeaveSpace}
        />
      )}

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
          refresh();
        }}
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
