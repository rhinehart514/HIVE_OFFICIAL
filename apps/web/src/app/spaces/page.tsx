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
  type IdentityType,
  type IdentityClaim,
  type YourSpace,
} from '@/components/spaces';
import { Text, Skeleton } from '@hive/ui/design-system/primitives';

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
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Identity cards skeleton */}
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Your spaces skeleton */}
      <div>
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0"
            >
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
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
    (spaceId: string) => {
      router.push(`/spaces/${spaceId}`);
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

      // Navigate to the space
      router.push(`/spaces/${spaceId}`);
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
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
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
                    transition={{ delay: 0.3 }}
                    className="mt-8 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center"
                  >
                    <Text weight="medium" className="text-white mb-2">
                      Ready to join the community?
                    </Text>
                    <Text size="sm" className="text-white/50 mb-4">
                      Sign in with your .edu email to join spaces and connect with your campus.
                    </Text>
                    <button
                      onClick={() => router.push('/enter?redirect=/spaces')}
                      className="px-6 py-2.5 rounded-lg bg-white text-[#0A0A09] font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      Get Started
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
    </div>
  );
}
