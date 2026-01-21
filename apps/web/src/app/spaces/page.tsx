'use client';

/**
 * /spaces — Unified Spaces Hub
 *
 * "Your campus, organized."
 *
 * A unified page that serves as the home for campus life:
 * - Identity Cards: Residential, Major, Greek (one-time claims)
 * - Your Spaces: Joined spaces with smart sorting
 * - Discover: Browse and join new spaces by category
 *
 * @version 7.0.0 - Complete redesign per Day 1 Launch spec (Jan 2026)
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';

// Components
import {
  IdentityCards,
  IdentityClaimModal,
  YourSpacesList,
  DiscoverSection,
  NewUserLayout,
  ReturningUserLayout,
  TerritoryHeader,
  OnboardingOverlay,
  type IdentityType,
  type IdentityClaim,
  type YourSpace,
} from '@/components/spaces';
import { Text, Skeleton, NoiseOverlay } from '@hive/ui/design-system/primitives';
import { MOTION } from '@hive/tokens';

// ============================================================
// Hooks
// ============================================================

/**
 * Hook to fetch and manage identity claims
 */
function useIdentityClaims(isAuthenticated: boolean) {
  const [claims, setClaims] = React.useState<Record<IdentityType, IdentityClaim | null>>({
    residential: null,
    major: null,
    greek: null,
  });
  const [loading, setLoading] = React.useState(true);

  const fetchClaims = React.useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await secureApiFetch('/api/spaces/identity', {
        method: 'GET',
      });
      const data = await res.json();
      if (data.success !== false && data.data?.claims) {
        setClaims(data.data.claims);
      }
    } catch {
      // Silently handle - claims will show as unclaimed
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const claimIdentity = async (type: IdentityType, spaceId: string) => {
    const res = await secureApiFetch('/api/spaces/identity', {
      method: 'POST',
      body: JSON.stringify({ type, spaceId }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to claim identity');
    }
    // Refetch claims
    await fetchClaims();
    return data;
  };

  return {
    claims,
    loading,
    claimIdentity,
    refetch: fetchClaims,
  };
}

/**
 * Hook to fetch user's joined spaces
 */
function useMySpaces(isAuthenticated: boolean) {
  const [spaces, setSpaces] = React.useState<YourSpace[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSpaces = React.useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await secureApiFetch('/api/spaces/my', {
        method: 'GET',
      });
      const data = await res.json();

      // Extract spaces from response
      const activeSpaces = data.data?.activeSpaces || data.activeSpaces || [];

      // Transform to YourSpace format
      const transformedSpaces: YourSpace[] = activeSpaces.map(
        (s: {
          id: string;
          name: string;
          description?: string;
          avatarUrl?: string;
          bannerUrl?: string;
          category?: string;
          memberCount?: number;
          isVerified?: boolean;
          lastActivity?: { timestamp?: string };
          livePresence?: { onlineCount?: number };
          membership?: {
            role?: string;
            notifications?: number;
            lastVisited?: string;
            pinned?: boolean;
          };
        }) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          avatarUrl: s.avatarUrl,
          bannerUrl: s.bannerUrl,
          category: s.category,
          memberCount: s.memberCount || 0,
          isVerified: s.isVerified,
          isJoined: true,
          lastActivityAt: s.lastActivity?.timestamp,
          membership: {
            role: s.membership?.role || 'member',
            notifications: s.membership?.notifications || 0,
            lastVisited: s.membership?.lastVisited || new Date().toISOString(),
            pinned: s.membership?.pinned || false,
          },
        })
      );

      setSpaces(transformedSpaces);
    } catch {
      // Silently handle - spaces list will show as empty
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const joinedSpaceIds = React.useMemo(
    () => new Set(spaces.map((s) => s.id)),
    [spaces]
  );

  return {
    spaces,
    loading,
    joinedSpaceIds,
    refetch: fetchSpaces,
  };
}

// ============================================================
// Loading Skeleton
// ============================================================

function PageSkeleton() {
  const EASE = MOTION.ease.premium;

  return (
    <div className="space-y-10">
      {/* Header skeleton */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <div className="h-8 w-48 rounded bg-white/[0.06]" />
        <div className="h-4 w-32 rounded bg-white/[0.06]" />
      </motion.div>

      {/* Identity cards skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
      >
        <div className="h-4 w-32 mb-4 rounded bg-white/[0.06]" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-[100px] rounded-xl bg-white/[0.06]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease: EASE }}
            />
          ))}
        </div>
      </motion.div>

      {/* Your spaces skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
      >
        <div className="h-4 w-28 mb-4 rounded bg-white/[0.06]" />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + i * 0.04, ease: EASE }}
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-white/[0.06]" />
                <div className="h-3 w-20 rounded bg-white/[0.06]" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SpacesHubPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Check if user is authenticated
  const isAuthenticated = !!user && !authLoading;

  // State hooks - pass auth status to skip API calls when not authenticated
  const {
    claims,
    loading: claimsLoading,
    claimIdentity,
  } = useIdentityClaims(isAuthenticated);
  const {
    spaces: mySpaces,
    loading: spacesLoading,
    joinedSpaceIds,
    refetch: refetchSpaces,
  } = useMySpaces(isAuthenticated);

  // Modal state
  const [claimModalType, setClaimModalType] = React.useState<IdentityType | null>(null);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  // Check if user has seen onboarding
  React.useEffect(() => {
    if (!authLoading && isAuthenticated && mySpaces.length === 0) {
      const hasSeenOnboarding =
        typeof window !== 'undefined' &&
        localStorage.getItem('hive_spaces_onboarding_seen') === 'true';
      setShowOnboarding(!hasSeenOnboarding);
    }
  }, [authLoading, isAuthenticated, mySpaces.length]);

  // Loading state - only show loading for authenticated users fetching data
  const isLoading = authLoading || (isAuthenticated && (claimsLoading && spacesLoading));

  // User state detection for conditional layout
  const userState = React.useMemo(() => {
    if (!isAuthenticated) return 'unauthenticated';
    if (mySpaces.length === 0) return 'new_user';
    return 'returning_user';
  }, [isAuthenticated, mySpaces.length]);

  // Handle navigation to space
  const handleNavigateToSpace = React.useCallback(
    (spaceId: string, handle?: string) => {
      // Navigate to /s/[handle] for unified space view
      // Fall back to ID if handle not available
      const destination = handle ? `/s/${handle}` : `/s/${spaceId}`;
      router.push(destination);
    },
    [router]
  );

  // Handle browse all
  const handleBrowseAll = React.useCallback(() => {
    // Scroll to discover section or navigate
    const discoverSection = document.getElementById('discover-section');
    if (discoverSection) {
      discoverSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle identity claim
  const handleClaimIdentity = async (type: IdentityType, spaceId: string) => {
    try {
      await claimIdentity(type, spaceId);
      toast.success('Identity claimed!', `Your ${type} identity has been set.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to claim';
      toast.error('Claim failed', message);
      throw error;
    }
  };

  // Handle join space
  const handleJoinSpace = async (spaceId: string) => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(`/enter?redirect=/spaces/${spaceId}`);
      return;
    }

    try {
      const res = await secureApiFetch('/api/spaces/join-v2', {
        method: 'POST',
        body: JSON.stringify({ spaceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to join space');
      }

      toast.success('Joined!', 'You are now a member of this space.');

      // Refetch spaces to update the list
      await refetchSpaces();

      // Navigate to the space (use handle if available)
      // For now, use ID as fallback since we don't have handle in the response
      router.push(`/s/${spaceId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join';
      toast.error('Join failed', message);
      throw error;
    }
  };

  // ============================================================
  // Handlers for layouts
  // ============================================================

  const handleClaimClick = React.useCallback(
    (type: IdentityType) => {
      if (!isAuthenticated) {
        router.push(`/enter?redirect=/spaces&claim=${type}`);
        return;
      }
      setClaimModalType(type);
    },
    [isAuthenticated, router]
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen w-full relative">
      <NoiseOverlay />
      <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        {/* Header - Territory narrative with premium motion */}
        <TerritoryHeader
          totalSpaces={423}
          claimedSpaces={67}
          yourSpaceCount={mySpaces.length}
          isAuthenticated={isAuthenticated}
          className="mb-10"
        />

        {/* Loading state */}
        {isLoading ? (
          <PageSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Unauthenticated or New User: Discovery-first layout */}
            {(userState === 'unauthenticated' || userState === 'new_user') && (
              <>
                <NewUserLayout
                  claims={claims}
                  claimsLoading={claimsLoading}
                  onClaimClick={handleClaimClick}
                  onViewSpace={handleNavigateToSpace}
                  onNavigateToSpace={handleNavigateToSpace}
                  onJoinSpace={handleJoinSpace}
                  joinedSpaceIds={joinedSpaceIds}
                />

                {/* Unauthenticated: Sign up CTA */}
                {userState === 'unauthenticated' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: MOTION.ease.premium }}
                    className="mt-10 p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center"
                  >
                    <h3
                      className="text-[24px] font-semibold text-white mb-3"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Your campus is already here.
                    </h3>
                    <p className="text-[16px] text-white/40 mb-6 max-w-md mx-auto">
                      400+ spaces mapped. Claim your org, join your dorm, connect with your people.
                    </p>
                    <button
                      onClick={() => router.push('/enter?redirect=/spaces')}
                      className="px-6 py-2.5 rounded-lg bg-white text-[#0A0A09] font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      Enter with .edu
                    </button>
                  </motion.div>
                )}
              </>
            )}

            {/* Returning User: Spaces-first layout */}
            {userState === 'returning_user' && (
              <ReturningUserLayout
                mySpaces={mySpaces}
                spacesLoading={spacesLoading}
                onNavigateToSpace={handleNavigateToSpace}
                onBrowseAll={handleBrowseAll}
                claims={claims}
                claimsLoading={claimsLoading}
                onClaimClick={handleClaimClick}
                onViewSpace={handleNavigateToSpace}
                onJoinSpace={handleJoinSpace}
                joinedSpaceIds={joinedSpaceIds}
              />
            )}
          </motion.div>
        )}
      </div>

      {/* Identity Claim Modal */}
      <IdentityClaimModal
        type={claimModalType}
        isOpen={!!claimModalType}
        onClose={() => setClaimModalType(null)}
        onClaim={handleClaimIdentity}
      />

      {/* Onboarding Overlay (first-time users) */}
      <OnboardingOverlay
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onClaimIdentity={(type) => {
          setShowOnboarding(false);
          setClaimModalType(type);
        }}
        onContinue={() => {
          setShowOnboarding(false);
          // Scroll to discover section
          const discoverSection = document.getElementById('discover-section');
          if (discoverSection) {
            discoverSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}
