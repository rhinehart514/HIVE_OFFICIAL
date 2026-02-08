'use client';

/**
 * SpacesHub - Main Spaces experience with narrative architecture
 *
 * Uses the new hub components:
 * - HubShell: Full-screen container with noise and ambient glow
 * - HubEmpty/HubOnboarding/HubActive: State-specific views
 * - IdentityConstellation: The 3 identity cards
 * - OrganizationsGrid: Space cards with warmth
 *
 * States:
 * - empty: No spaces, no identity claims
 * - onboarding: < 3 identity claims (first 7 days emphasized)
 * - active: 3 claims, established spaces
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import {
  motion,
  MOTION,
  Button,
} from '@hive/ui/design-system/primitives';
import { useSpacesHQ } from '../hooks/useSpacesHQ';
import { SpaceCreationModal, SpaceClaimModal, SpaceJoinModal } from '@/components/spaces';

// New components
import { HubShell } from './hub-shell';
import { HubEmpty } from './hub-empty';
import { HubOnboarding } from './hub-onboarding';
import { HubActive } from './hub-active';
import { StateTransition } from './motion/hub-transitions';

// ============================================================
// Header Component
// ============================================================

interface HeaderProps {
  onCreateSpace: () => void;
}

function Header({ onCreateSpace }: HeaderProps) {
  return (
    <header className="px-6 py-5 flex items-center justify-between shrink-0">
      <motion.h1
        className="text-xl font-medium text-white/90 tracking-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: MOTION.duration.base,
          ease: MOTION.ease.premium,
        }}
      >
        Spaces
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: MOTION.duration.base,
          delay: 0.1,
          ease: MOTION.ease.premium,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateSpace}
          className="text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
        >
          <Plus size={18} className="mr-2" />
          New
        </Button>
      </motion.div>
    </header>
  );
}

// ============================================================
// Loading State
// ============================================================

function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-white/20"
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Error State
// ============================================================

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.duration.base, ease: MOTION.ease.premium }}
    >
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h2 className="text-lg font-medium text-white/90 tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-white/40 leading-relaxed mb-6">
          {error || 'Failed to load your spaces. Please try again.'}
        </p>
        <Button
          onClick={onRetry}
          className="bg-white/[0.08] hover:bg-white/[0.12] text-white/90"
        >
          <RefreshCw size={16} className="mr-2" />
          Try again
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

interface SpacesHubProps {
  /** Whether user is in the 7-day onboarding period */
  isOnboarding?: boolean;
}

export function SpacesHub({ isOnboarding: _isOnboarding = false }: SpacesHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState<string | null>(null);

  // Handle query params: ?create=true, ?claim=true, ?join=[code]
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

  // Fetch data using existing hook
  const {
    state,
    loading,
    error,
    identityClaims,
    identityProgress,
    organizations,
    refresh,
  } = useSpacesHQ();

  const handleCreateSpace = () => {
    setShowCreateModal(true);
  };

  const handleMuteSpace = async (spaceId: string) => {
    try {
      await fetch(`/api/spaces/${spaceId}/mute`, { method: 'POST' });
      refresh();
    } catch {
      // Error is handled via toast in SpaceOrbit
    }
  };

  const handleLeaveSpace = async (spaceId: string) => {
    try {
      await fetch(`/api/spaces/${spaceId}/leave`, { method: 'POST' });
      refresh();
    } catch {
      // Error is handled via toast in SpaceOrbit
    }
  };

  // Loading state
  if (loading) {
    return (
      <HubShell state="empty" identityProgress={0}>
        <Header onCreateSpace={handleCreateSpace} />
        <LoadingState />
      </HubShell>
    );
  }

  // Error state
  if (error) {
    return (
      <HubShell state="empty" identityProgress={0}>
        <Header onCreateSpace={handleCreateSpace} />
        <ErrorState error={error} onRetry={refresh} />
      </HubShell>
    );
  }

  // Render state-specific view
  const renderContent = () => {
    switch (state) {
      case 'empty':
        return <HubEmpty onCreateSpace={handleCreateSpace} />;

      case 'onboarding':
        return (
          <HubOnboarding
            identityClaims={identityClaims}
            identityProgress={identityProgress}
            organizations={organizations}
            onCreateSpace={handleCreateSpace}
            onMuteSpace={handleMuteSpace}
            onLeaveSpace={handleLeaveSpace}
          />
        );

      case 'active':
        return (
          <HubActive
            identityClaims={identityClaims}
            organizations={organizations}
            onCreateSpace={handleCreateSpace}
            onMuteSpace={handleMuteSpace}
            onLeaveSpace={handleLeaveSpace}
          />
        );

      default:
        return null;
    }
  };

  return (
    <HubShell state={state} identityProgress={identityProgress}>
      <Header onCreateSpace={handleCreateSpace} />

      <StateTransition state={state}>
        {renderContent()}
      </StateTransition>

      <SpaceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <SpaceClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
      />

      <SpaceJoinModal
        isOpen={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
          setJoinCode(null);
        }}
        code={joinCode}
      />
    </HubShell>
  );
}

SpacesHub.displayName = 'SpacesHub';
