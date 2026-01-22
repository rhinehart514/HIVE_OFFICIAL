'use client';

/**
 * /welcome/territory - Find your space
 *
 * Territory map showing campus spaces
 *
 * Emotional arc: AUTONOMY → POTENTIAL
 * - Show THEIR campus's spaces (not generic)
 * - Ghost spaces visible with "Claim" option
 * - Quick join or claim
 *
 * Connected to real APIs:
 * - Spaces: GET /api/spaces/browse-v2
 * - Join: POST /api/spaces/join-v2
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@hive/auth-logic';
import {
  WelcomeShell,
  WelcomeHeading,
  WelcomeAction,
  TerritoryMap,
  type TerritorySpace,
} from '@/components/onboarding';
import { MOTION } from '@hive/ui/design-system/primitives';

// ============================================
// API FETCHERS
// ============================================

async function fetchCampusSpaces(): Promise<TerritorySpace[]> {
  const response = await fetch('/api/spaces/browse-v2?sort=trending&limit=30');
  if (!response.ok) throw new Error('Failed to fetch spaces');

  const data = await response.json();
  const apiSpaces = data.data?.spaces || data.spaces || [];

  return apiSpaces.map((s: {
    id: string;
    name: string;
    slug?: string;
    handle?: string;
    category?: string;
    type?: string;
    memberCount?: number;
    metrics?: { memberCount?: number; activeMembers?: number };
    claimStatus?: string;
    isJoined?: boolean;
    waitlistCount?: number;
    updatedAt?: string;
  }) => ({
    id: s.id,
    name: s.name,
    handle: s.slug || s.handle || s.id,
    category: s.category || s.type || 'General',
    memberCount: s.memberCount || s.metrics?.memberCount || 0,
    isClaimed: s.claimStatus !== 'unclaimed',
    isActive: (s.metrics?.activeMembers || 0) > 0,
    membership: s.isJoined ? 'member' : 'none',
    waitlistCount: s.waitlistCount || 0,
  }));
}

async function joinSpace(spaceId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('/api/spaces/join-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spaceId,
      joinMethod: 'manual',
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    return { success: false, error: data.error || 'Failed to join space' };
  }

  return { success: true };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TerritoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<TerritorySpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<TerritorySpace | null>(null);

  // Get campus from user context (fallback for now)
  const campusName = 'University at Buffalo';

  // Load spaces on mount
  useEffect(() => {
    const loadSpaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCampusSpaces();
        setSpaces(data);
      } catch (err) {
        console.error('Failed to load spaces:', err);
        setError('Failed to load spaces. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSpaces();
  }, []);

  const handleSelectSpace = useCallback((space: TerritorySpace) => {
    setSelectedSpace(space);
  }, []);

  const handleJoinSpace = useCallback(async (space: TerritorySpace) => {
    setJoining(space.id);
    setError(null);

    try {
      const result = await joinSpace(space.id);
      if (result.success) {
        // Update local state to reflect membership
        setSpaces(prev => prev.map(s =>
          s.id === space.id ? { ...s, membership: 'member' as const } : s
        ));
        // Navigate to claimed page
        router.push('/welcome/claimed');
      } else {
        setError(result.error || 'Failed to join space');
      }
    } catch (err) {
      console.error('Failed to join space:', err);
      setError('Failed to join space. Please try again.');
    } finally {
      setJoining(null);
    }
  }, [router]);

  const handleClaimSpace = useCallback((space: TerritorySpace) => {
    // Navigate to claim flow with this space
    router.push(`/spaces/claim?space=${space.handle}`);
  }, [router]);

  const handleSkip = () => {
    router.push('/welcome/claimed');
  };

  return (
    <WelcomeShell currentStep={2}>
      <div className="space-y-8">
        {/* Heading */}
        <WelcomeHeading
          title="Find your space"
          subtitle={`${spaces.filter((s) => s.isClaimed).length} orgs active at ${campusName}`}
        />

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <p className="text-[13px] text-red-400 text-center">{error}</p>
          </motion.div>
        )}

        {/* Territory Map */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration.base, delay: 0.2, ease: MOTION.ease.premium }}
        >
          <TerritoryMap
            spaces={spaces}
            campusName={campusName}
            loading={loading || !!joining}
            onSelectSpace={handleSelectSpace}
            onJoinSpace={handleJoinSpace}
            onClaimSpace={handleClaimSpace}
          />
        </motion.div>

        {/* Skip Option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.duration.base, delay: 0.4, ease: MOTION.ease.premium }}
        >
          <WelcomeAction variant="secondary" onClick={handleSkip} disabled={!!joining}>
            {joining ? 'Joining...' : 'Skip for now'}
          </WelcomeAction>
          <p className="text-[11px] text-white/30 text-center mt-2">
            You can always explore spaces later
          </p>
        </motion.div>
      </div>
    </WelcomeShell>
  );
}
