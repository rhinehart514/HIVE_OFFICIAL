'use client';

/**
 * SpaceProvider - Context for Space Residence Page
 *
 * Provides shared state and permissions for the space residence view.
 * Composes React Query hooks and derives permission state.
 *
 * @example
 * // In page layout
 * <SpaceProvider spaceId={spaceId}>
 *   <SpaceResidence />
 * </SpaceProvider>
 *
 * // In components
 * const { space, permissions, activeBoard } = useSpaceContext();
 */

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';
import { useSpaceQuery } from '@/hooks/queries/use-space-query';
import { useSpaceBoards } from '@/hooks/queries/use-space-boards-query';
import { useSpaceMembers } from '@/hooks/queries/use-members-query';
import type { SpaceDTO, SpaceBoardDTO, SpaceMemberDTO } from '@/lib/fetchers';

// ============================================================
// Types
// ============================================================

export interface SpacePermissions {
  // Membership
  isMember: boolean;
  isLeader: boolean;
  isAdmin: boolean;
  isModerator: boolean;

  // Actions
  canSendMessages: boolean;
  canDeleteOwnMessages: boolean;
  canDeleteAnyMessage: boolean;
  canManageMembers: boolean;
  canManageBoards: boolean;
  canManageSettings: boolean;
  canCreateEvents: boolean;
  canDeployTools: boolean;
  canPinMessages: boolean;
}

export interface SpaceContextValue {
  // Core data
  spaceId: string;
  space: SpaceDTO | null;
  boards: SpaceBoardDTO[];
  members: SpaceMemberDTO[];

  // Loading states
  isLoading: boolean;
  isLoadingBoards: boolean;
  isLoadingMembers: boolean;

  // Error states
  error: Error | null;

  // Active state
  activeBoard: string;
  setActiveBoard: (boardId: string) => void;

  // Derived state
  permissions: SpacePermissions;
  onlineCount: number;
  memberCount: number;

  // Current user info
  currentUserId: string | null;
  currentUserRole: 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | null;

  // Actions
  refetch: () => void;
}

const SpaceContext = React.createContext<SpaceContextValue | null>(null);

// ============================================================
// Hook
// ============================================================

export function useSpaceContext(): SpaceContextValue {
  const context = React.useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpaceContext must be used within a SpaceProvider');
  }
  return context;
}

/**
 * Shortcut hook for just permissions
 */
export function useSpacePermissions(): SpacePermissions {
  const { permissions } = useSpaceContext();
  return permissions;
}

// ============================================================
// Provider
// ============================================================

interface SpaceProviderProps {
  spaceId: string;
  initialBoardId?: string;
  children: React.ReactNode;
}

export function SpaceProvider({ spaceId, initialBoardId, children }: SpaceProviderProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  // State for active board
  const [activeBoard, setActiveBoard] = React.useState(initialBoardId ?? 'general');

  // React Query hooks
  const {
    data: space,
    isLoading: isLoadingSpace,
    error: spaceError,
    refetch: refetchSpace,
  } = useSpaceQuery(spaceId);

  const {
    data: boardsData,
    isLoading: isLoadingBoards,
    refetch: refetchBoards,
  } = useSpaceBoards(spaceId, { enabled: Boolean(spaceId) });

  const {
    data: membersData,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = useSpaceMembers(spaceId, { limit: 100 });

  // Extract data
  const boards = boardsData?.boards ?? [];
  const members = membersData?.members ?? [];

  // Find current user's membership
  const currentMembership = space?.membership;
  const currentUserRole = currentMembership?.role as SpaceContextValue['currentUserRole'] ?? null;

  // Derive permissions
  const permissions = React.useMemo((): SpacePermissions => {
    const isMember = currentMembership?.isMember ?? false;
    const isLeader = currentMembership?.isLeader ?? false;
    const role = currentMembership?.role;
    const isAdmin = role === 'admin' || role === 'owner';
    const isModerator = role === 'moderator' || isAdmin;

    return {
      isMember,
      isLeader,
      isAdmin,
      isModerator,

      canSendMessages: isMember,
      canDeleteOwnMessages: isMember,
      canDeleteAnyMessage: isModerator,
      canManageMembers: isAdmin,
      canManageBoards: isAdmin,
      canManageSettings: isLeader,
      canCreateEvents: isLeader,
      canDeployTools: isLeader,
      canPinMessages: isModerator,
    };
  }, [currentMembership]);

  // Derived counts
  const onlineCount = space?.onlineCount ?? 0;
  const memberCount = space?.memberCount ?? members.length;

  // Combined refetch
  const refetch = React.useCallback(() => {
    refetchSpace();
    refetchBoards();
    refetchMembers();
  }, [refetchSpace, refetchBoards, refetchMembers]);

  // Update active board when boards load (ensure valid selection)
  React.useEffect(() => {
    if (boards.length > 0 && !boards.find(b => b.id === activeBoard)) {
      const defaultBoard = boards.find(b => b.isDefault) ?? boards[0];
      setActiveBoard(defaultBoard.id);
    }
  }, [boards, activeBoard]);

  const value: SpaceContextValue = {
    spaceId,
    space: space ?? null,
    boards,
    members,
    isLoading: isLoadingSpace,
    isLoadingBoards,
    isLoadingMembers,
    error: spaceError ?? null,
    activeBoard,
    setActiveBoard,
    permissions,
    onlineCount,
    memberCount,
    currentUserId,
    currentUserRole,
    refetch,
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}

export default SpaceProvider;
