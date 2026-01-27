'use client';

/**
 * ToolRuntimeProvider - Provides runtime context for HiveLab tools
 *
 * Composes space context, member context, and temporal context into a
 * complete ToolRuntimeContext for tools deployed in spaces.
 *
 * This provider is designed for use in the packages/ui library and can be
 * wrapped by app-specific providers that add authentication.
 *
 * @version 1.0.0 - HiveLab Phase 1 (Jan 2026)
 */

import * as React from 'react';
import type {
  ToolRuntimeContext,
  TemporalContext,
  CapabilityContext,
  MemberRole,
} from '@hive/core';
import { createTemporalContext, createDefaultCapabilities } from '@hive/core';
import { useSpaceContext } from '../../hooks/hivelab/use-space-context';
import { useMemberContext } from '../../hooks/hivelab/use-member-context';

// ============================================================================
// Context Definition
// ============================================================================

interface ToolRuntimeContextValue {
  /** The complete runtime context */
  context: ToolRuntimeContext | null;
  /** Whether the context is still loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Force refresh the context */
  refresh: () => Promise<void>;
}

const ToolRuntimeCtx = React.createContext<ToolRuntimeContextValue>({
  context: null,
  isLoading: true,
  error: null,
  refresh: async () => {},
});

// ============================================================================
// Provider Props
// ============================================================================

export interface ToolRuntimeProviderProps {
  /** Space ID to load context for */
  spaceId: string;
  /** Deployment ID for this tool instance */
  deploymentId: string;
  /** Current user's ID */
  userId: string;
  /** Current user's campus ID */
  campusId: string;
  /** Optional timezone override (defaults to browser timezone) */
  timezone?: string;
  /** Children to render */
  children: React.ReactNode;
}

// ============================================================================
// Provider Implementation
// ============================================================================

/**
 * Provider that assembles complete ToolRuntimeContext from space and member data
 *
 * @example
 * ```tsx
 * <ToolRuntimeProvider
 *   spaceId={spaceId}
 *   deploymentId={deploymentId}
 *   userId={user.id}
 *   campusId={user.campusId}
 * >
 *   <ToolCanvas elements={elements} state={state} />
 * </ToolRuntimeProvider>
 * ```
 */
export function ToolRuntimeProvider({
  spaceId,
  deploymentId,
  userId,
  campusId,
  timezone,
  children,
}: ToolRuntimeProviderProps) {
  // Load space context
  const {
    spaceContext,
    isLoading: spaceLoading,
    error: spaceError,
    refresh: refreshSpace,
  } = useSpaceContext(spaceId);

  // Load member context
  const {
    memberContext,
    isLoading: memberLoading,
    error: memberError,
    refresh: refreshMember,
  } = useMemberContext(spaceId, { userId });

  // Temporal context with auto-refresh
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

  // Build the complete context
  const context = React.useMemo<ToolRuntimeContext | null>(() => {
    // Wait for both space and member to finish loading
    if (spaceLoading || memberLoading) {
      return null;
    }

    // If there's an error, we can still return a partial context
    // Tools should handle missing optional fields gracefully

    // Build capabilities based on role
    const role: MemberRole = memberContext?.role || 'guest';
    const capabilities: CapabilityContext = createDefaultCapabilities(role);

    return {
      userId,
      campusId,
      temporal: temporalContext,
      space: spaceContext || undefined,
      member: memberContext || undefined,
      deploymentId,
      capabilities,
    };
  }, [
    userId,
    campusId,
    spaceContext,
    memberContext,
    temporalContext,
    deploymentId,
    spaceLoading,
    memberLoading,
  ]);

  // Combined loading state
  const isLoading = spaceLoading || memberLoading;

  // Combined error (first error wins)
  const error = spaceError || memberError;

  // Refresh function
  const refresh = React.useCallback(async () => {
    setTemporalContext(createTemporalContext(timezone));
    await Promise.all([refreshSpace(), refreshMember()]);
  }, [timezone, refreshSpace, refreshMember]);

  const value = React.useMemo<ToolRuntimeContextValue>(
    () => ({
      context,
      isLoading,
      error,
      refresh,
    }),
    [context, isLoading, error, refresh]
  );

  return (
    <ToolRuntimeCtx.Provider value={value}>
      {children}
    </ToolRuntimeCtx.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Use the full tool runtime context value including loading and error states
 */
export function useToolRuntimeContext(): ToolRuntimeContextValue {
  return React.useContext(ToolRuntimeCtx);
}

/**
 * Use just the context object (convenience hook)
 */
export function useToolContext(): ToolRuntimeContext | null {
  return React.useContext(ToolRuntimeCtx).context;
}

/**
 * Use space context specifically
 */
export function useToolSpaceContext() {
  return React.useContext(ToolRuntimeCtx).context?.space;
}

/**
 * Use member context specifically
 */
export function useToolMemberContext() {
  return React.useContext(ToolRuntimeCtx).context?.member;
}

/**
 * Use temporal context specifically
 */
export function useToolTemporalContext() {
  return React.useContext(ToolRuntimeCtx).context?.temporal;
}

/**
 * Use capabilities context specifically
 */
export function useToolCapabilities() {
  return React.useContext(ToolRuntimeCtx).context?.capabilities;
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

/**
 * Check if the current user is a space leader (owner, admin, or moderator)
 */
export function useIsSpaceLeader(): boolean {
  const context = React.useContext(ToolRuntimeCtx).context;
  const role = context?.member?.role;
  return role === 'owner' || role === 'admin' || role === 'moderator';
}

// ============================================================================
// Exports
// ============================================================================

export default ToolRuntimeProvider;
