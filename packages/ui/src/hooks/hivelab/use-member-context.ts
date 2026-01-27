'use client';

/**
 * useMemberContext - Loads current user's membership and assembles MemberContext
 *
 * This hook fetches the user's membership from the lightweight /membership/me endpoint
 * and transforms it into the MemberContext type for HiveLab tool runtime context.
 *
 * @version 1.0.0 - HiveLab Phase 1 (Jan 2026)
 */

import * as React from 'react';
import type { MemberContext, MemberRole } from '@hive/core';

// ============================================================================
// Types
// ============================================================================

interface UseMemberContextOptions {
  /** Optional callback to use custom fetch (for testing or server components) */
  fetch?: typeof globalThis.fetch;
  /** User ID to include in the context */
  userId?: string;
}

interface UseMemberContextReturn {
  /** The assembled member context */
  memberContext: MemberContext | null;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether the user is a member (not a guest) */
  isMember: boolean;
  /** Refresh the member context */
  refresh: () => Promise<void>;
}

// ============================================================================
// API Response Type
// ============================================================================

interface MembershipMeResponse {
  isMember: boolean;
  userId?: string;
  displayName?: string | null;
  role: MemberRole;
  joinedAt: string | null;
  joinMethod?: string | null;
  daysInSpace: number;
  isNewMember: boolean;
  permissions: {
    canPost: boolean;
    canDeployTools: boolean;
    canModerate: boolean;
    canManageMembers: boolean;
    canAccessAdmin: boolean;
  };
}

interface APIResponse {
  data?: MembershipMeResponse;
  success?: boolean;
  error?: { message: string };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook to load and assemble MemberContext for HiveLab tool runtime
 *
 * @param spaceId - The ID of the space to load membership for
 * @param options - Optional configuration
 * @returns MemberContext, loading state, and error
 *
 * @example
 * ```tsx
 * function ToolDisplay({ spaceId }: { spaceId: string }) {
 *   const { memberContext, isLoading, isMember } = useMemberContext(spaceId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!isMember) return <JoinPrompt />;
 *
 *   return <ToolCanvas context={{ member: memberContext }} />;
 * }
 * ```
 */
export function useMemberContext(
  spaceId: string | undefined,
  options: UseMemberContextOptions = {}
): UseMemberContextReturn {
  const { fetch: customFetch = globalThis.fetch, userId: providedUserId } = options;

  const [memberContext, setMemberContext] = React.useState<MemberContext | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isMember, setIsMember] = React.useState(false);

  const fetchMemberContext = React.useCallback(async () => {
    if (!spaceId) {
      setMemberContext(null);
      setIsMember(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await customFetch(`/api/spaces/${spaceId}/membership/me`);

      if (!response.ok) {
        if (response.status === 403) {
          // User is not a member of a private space
          setMemberContext(null);
          setIsMember(false);
          setError('Membership required');
          return;
        }
        if (response.status === 404) {
          throw new Error('Space not found');
        }
        throw new Error(`Failed to load membership: ${response.status}`);
      }

      const json: APIResponse = await response.json();

      // Handle both wrapped and direct response formats
      const data = json.data || (json as unknown as MembershipMeResponse);

      if (!data.role) {
        throw new Error('Invalid membership response');
      }

      setIsMember(data.isMember);

      // For non-members (guests), don't set memberContext
      if (!data.isMember) {
        setMemberContext(null);
        return;
      }

      // Map API response to MemberContext
      const context: MemberContext = {
        userId: data.userId || providedUserId || '',
        displayName: data.displayName || undefined,
        role: data.role,
        tenure: {
          daysInSpace: data.daysInSpace,
          isNewMember: data.isNewMember,
          joinedAt: data.joinedAt || undefined,
        },
        permissions: data.permissions,
      };

      setMemberContext(context);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load membership';
      setError(message);
      setMemberContext(null);
      setIsMember(false);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, customFetch, providedUserId]);

  // Initial fetch
  React.useEffect(() => {
    void fetchMemberContext();
  }, [fetchMemberContext]);

  const refresh = React.useCallback(async () => {
    await fetchMemberContext();
  }, [fetchMemberContext]);

  return {
    memberContext,
    isLoading,
    error,
    isMember,
    refresh,
  };
}

export default useMemberContext;
