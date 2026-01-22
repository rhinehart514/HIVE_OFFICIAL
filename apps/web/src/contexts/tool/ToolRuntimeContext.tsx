'use client';

/**
 * ToolRuntimeContext - Provides runtime context to HiveLab tools
 *
 * Composes context from:
 * - Space metadata (from SpaceMetadataContext if available)
 * - User authentication (from auth system)
 * - Temporal data (computed client-side)
 * - Capability permissions (derived from role)
 *
 * This context enables tools to:
 * - Personalize content based on user role
 * - Show/hide elements based on time of day
 * - Access space-specific data when available
 *
 * @version 1.0.0 - HiveLab Sprint 2 (Jan 2026)
 */

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';
import { useOptionalSpaceMetadata } from '@/contexts/space/SpaceMetadataContext';
import type {
  ToolRuntimeContext as ToolRuntimeContextType,
  SpaceContext,
  MemberContext,
  TemporalContext,
  CapabilityContext,
  MemberRole,
} from '@hive/core';
import { createTemporalContext, createDefaultCapabilities } from '@hive/core';

// ============================================================
// Context Definition
// ============================================================

interface ToolRuntimeContextValue {
  /** The complete runtime context */
  context: ToolRuntimeContextType | null;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Force refresh the context */
  refresh: () => void;
}

const ToolRuntimeCtx = React.createContext<ToolRuntimeContextValue>({
  context: null,
  isLoading: true,
  refresh: () => {},
});

// ============================================================
// Provider Props
// ============================================================

interface ToolRuntimeProviderProps {
  /** The deployment ID for this tool instance */
  deploymentId: string;
  /** Optional timezone override (defaults to browser timezone) */
  timezone?: string;
  /** Children to render */
  children: React.ReactNode;
}

// ============================================================
// Provider Implementation
// ============================================================

export function ToolRuntimeProvider({
  deploymentId,
  timezone,
  children,
}: ToolRuntimeProviderProps) {
  const { user } = useAuth();
  const campusId = user?.campusId;
  const spaceMetadata = useOptionalSpaceMetadata();

  const [temporalContext, setTemporalContext] = React.useState<TemporalContext>(
    createTemporalContext(timezone)
  );

  // Refresh temporal context every minute for time-based conditions
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTemporalContext(createTemporalContext(timezone));
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [timezone]);

  // Manual refresh function
  const refresh = React.useCallback(() => {
    setTemporalContext(createTemporalContext(timezone));
  }, [timezone]);

  // Build the complete context
  const context = React.useMemo<ToolRuntimeContextType | null>(() => {
    if (!user?.id || !campusId) {
      return null;
    }

    // Build space context if in a space
    let spaceContext: SpaceContext | undefined;
    if (spaceMetadata?.space) {
      spaceContext = {
        spaceId: spaceMetadata.spaceId,
        spaceName: spaceMetadata.space.name,
        memberCount: spaceMetadata.space.memberCount,
        onlineCount: spaceMetadata.space.onlineCount,
        category: spaceMetadata.space.category,
        isVerified: spaceMetadata.space.isVerified,
        brand: spaceMetadata.space.iconUrl
          ? { iconUrl: spaceMetadata.space.iconUrl }
          : undefined,
      };
    }

    // Build member context if user is a space member
    let memberContext: MemberContext | undefined;
    if (spaceMetadata?.membership?.isMember && spaceMetadata.membership.role) {
      const joinedAt = spaceMetadata.membership.joinedAt;
      const daysInSpace = joinedAt
        ? Math.floor(
            (Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

      const role = spaceMetadata.membership.role as MemberRole;
      const isLeader = ['owner', 'admin', 'moderator'].includes(role);

      memberContext = {
        userId: user.id,
        displayName: user.displayName || user.email?.split('@')[0],
        role,
        tenure: {
          daysInSpace,
          isNewMember: daysInSpace < 7,
          joinedAt,
        },
        permissions: {
          canPost: true,
          canDeployTools: isLeader,
          canModerate: ['owner', 'admin', 'moderator'].includes(role),
          canManageMembers: ['owner', 'admin'].includes(role),
          canAccessAdmin: ['owner', 'admin'].includes(role),
        },
      };
    }

    // Build capabilities based on role
    const role: MemberRole = memberContext?.role || 'guest';
    const capabilities: CapabilityContext = createDefaultCapabilities(role);

    return {
      userId: user.id,
      campusId,
      temporal: temporalContext,
      space: spaceContext,
      member: memberContext,
      deploymentId,
      capabilities,
    };
  }, [user, campusId, spaceMetadata, temporalContext, deploymentId]);

  const isLoading = !user || !campusId || spaceMetadata?.isLoading;

  const value = React.useMemo<ToolRuntimeContextValue>(
    () => ({
      context,
      isLoading: isLoading ?? false,
      refresh,
    }),
    [context, isLoading, refresh]
  );

  return (
    <ToolRuntimeCtx.Provider value={value}>
      {children}
    </ToolRuntimeCtx.Provider>
  );
}

// ============================================================
// Hooks
// ============================================================

/**
 * Use the full tool runtime context
 */
export function useToolRuntimeContext(): ToolRuntimeContextValue {
  return React.useContext(ToolRuntimeCtx);
}

/**
 * Use just the context object (convenience hook)
 */
export function useToolContext(): ToolRuntimeContextType | null {
  return React.useContext(ToolRuntimeCtx).context;
}

/**
 * Use space context specifically
 */
export function useToolSpaceContext(): SpaceContext | undefined {
  return React.useContext(ToolRuntimeCtx).context?.space;
}

/**
 * Use member context specifically
 */
export function useToolMemberContext(): MemberContext | undefined {
  return React.useContext(ToolRuntimeCtx).context?.member;
}

/**
 * Use temporal context specifically
 */
export function useToolTemporalContext(): TemporalContext | undefined {
  return React.useContext(ToolRuntimeCtx).context?.temporal;
}

/**
 * Check if the current user has a specific capability
 */
export function useToolCapability(
  capability: keyof CapabilityContext
): boolean {
  const context = React.useContext(ToolRuntimeCtx).context;
  return context?.capabilities[capability] ?? false;
}

/**
 * Check if the current user has a specific role or higher
 */
export function useHasRole(minRole: MemberRole): boolean {
  const context = React.useContext(ToolRuntimeCtx).context;
  const roleHierarchy: MemberRole[] = ['guest', 'member', 'moderator', 'admin', 'owner'];
  const currentRole = context?.member?.role ?? 'guest';
  return roleHierarchy.indexOf(currentRole) >= roleHierarchy.indexOf(minRole);
}

// ============================================================
// Exports
// ============================================================

export default ToolRuntimeProvider;
