'use client';

/**
 * usePermissions - Client-side permission checking hook
 *
 * Provides permission checking for UI components in spaces.
 * Handles _own vs _any distinction for content permissions.
 */

import * as React from 'react';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

interface PermissionState {
  role: UserRole | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}

interface UsePermissionsReturn {
  /**
   * User's role in the space
   */
  role: UserRole | null;

  /**
   * Whether permissions are still loading
   */
  isLoading: boolean;

  /**
   * Check if user has a specific permission
   */
  can: (permission: string) => boolean;

  /**
   * Check if user can edit a post (considers ownership)
   */
  canEditPost: (authorId: string) => boolean;

  /**
   * Check if user can delete a post (considers ownership)
   */
  canDeletePost: (authorId: string) => boolean;

  /**
   * Check if user can edit an event (considers ownership)
   */
  canEditEvent: (creatorId: string) => boolean;

  /**
   * Check if user can delete an event (considers ownership)
   */
  canDeleteEvent: (creatorId: string) => boolean;

  /**
   * Check if user can edit a message (considers ownership)
   */
  canEditMessage: (authorId: string) => boolean;

  /**
   * Check if user can delete a message (considers ownership)
   */
  canDeleteMessage: (authorId: string) => boolean;

  /**
   * Check if user is at least a moderator
   */
  isModerator: boolean;

  /**
   * Check if user is a leader (admin or owner)
   */
  isLeader: boolean;

  /**
   * Refresh permissions from API
   */
  refresh: () => Promise<void>;
}

/**
 * Base role permissions - matches server-side ROLE_PERMISSIONS
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    'posts:create', 'posts:edit_own', 'posts:edit_any', 'posts:delete_own', 'posts:delete_any', 'posts:pin',
    'events:create', 'events:edit_own', 'events:edit_any', 'events:delete_own', 'events:delete_any', 'events:manage',
    'messages:edit_own', 'messages:edit_any', 'messages:delete_own', 'messages:delete_any',
    'members:view', 'members:invite', 'members:remove', 'members:promote',
    'tools:view', 'tools:install', 'tools:configure', 'tools:remove',
    'space:settings', 'space:delete', 'space:transfer',
    'data:export', 'analytics:view', 'moderation:access'
  ],
  admin: [
    'posts:create', 'posts:edit_own', 'posts:edit_any', 'posts:delete_own', 'posts:delete_any', 'posts:pin',
    'events:create', 'events:edit_own', 'events:edit_any', 'events:delete_own', 'events:delete_any', 'events:manage',
    'messages:edit_own', 'messages:edit_any', 'messages:delete_own', 'messages:delete_any',
    'members:view', 'members:invite', 'members:remove', 'members:promote',
    'tools:view', 'tools:install', 'tools:configure', 'tools:remove',
    'space:settings',
    'data:export', 'analytics:view', 'moderation:access'
  ],
  moderator: [
    'posts:create', 'posts:edit_own', 'posts:edit_any', 'posts:delete_own', 'posts:delete_any', 'posts:pin',
    'events:create', 'events:edit_own', 'events:edit_any', 'events:delete_own', 'events:delete_any',
    'messages:edit_own', 'messages:edit_any', 'messages:delete_own', 'messages:delete_any',
    'members:view', 'members:invite',
    'tools:view',
    'moderation:access'
  ],
  member: [
    'posts:create', 'posts:edit_own', 'posts:delete_own',
    'events:create', 'events:edit_own', 'events:delete_own',
    'messages:edit_own', 'messages:delete_own',
    'members:view',
    'tools:view'
  ],
  guest: [
    'members:view'
  ]
};

/**
 * Hook to check permissions for a user in a space
 */
export function usePermissions(
  spaceId: string | undefined,
  currentUserId: string | undefined
): UsePermissionsReturn {
  const [state, setState] = React.useState<PermissionState>({
    role: null,
    permissions: [],
    isLoading: true,
    error: null,
  });

  const fetchPermissions = React.useCallback(async () => {
    if (!spaceId) {
      setState({ role: null, permissions: [], isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/spaces/${spaceId}/membership`);

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          // Not a member or space not found - use guest permissions
          setState({
            role: 'guest',
            permissions: ROLE_PERMISSIONS.guest,
            isLoading: false,
            error: null,
          });
          return;
        }
        throw new Error('Failed to fetch membership');
      }

      const data = await response.json();
      const role = (data.role || 'member') as UserRole;
      const permissions = ROLE_PERMISSIONS[role] || [];

      setState({
        role,
        permissions,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        role: null,
        permissions: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [spaceId]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const can = React.useCallback((permission: string): boolean => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const canWithOwnership = React.useCallback((
    basePermission: string,
    resourceOwnerId: string
  ): boolean => {
    // Check if user can act on any resource
    if (state.permissions.includes(`${basePermission}_any`)) {
      return true;
    }

    // Check if user can act on own resource
    if (state.permissions.includes(`${basePermission}_own`)) {
      return currentUserId === resourceOwnerId;
    }

    return false;
  }, [state.permissions, currentUserId]);

  const canEditPost = React.useCallback((authorId: string): boolean => {
    return canWithOwnership('posts:edit', authorId);
  }, [canWithOwnership]);

  const canDeletePost = React.useCallback((authorId: string): boolean => {
    return canWithOwnership('posts:delete', authorId);
  }, [canWithOwnership]);

  const canEditEvent = React.useCallback((creatorId: string): boolean => {
    return canWithOwnership('events:edit', creatorId);
  }, [canWithOwnership]);

  const canDeleteEvent = React.useCallback((creatorId: string): boolean => {
    return canWithOwnership('events:delete', creatorId);
  }, [canWithOwnership]);

  const canEditMessage = React.useCallback((authorId: string): boolean => {
    return canWithOwnership('messages:edit', authorId);
  }, [canWithOwnership]);

  const canDeleteMessage = React.useCallback((authorId: string): boolean => {
    return canWithOwnership('messages:delete', authorId);
  }, [canWithOwnership]);

  const isModerator = React.useMemo(() => {
    return state.role === 'moderator' || state.role === 'admin' || state.role === 'owner';
  }, [state.role]);

  const isLeader = React.useMemo(() => {
    return state.role === 'admin' || state.role === 'owner';
  }, [state.role]);

  return {
    role: state.role,
    isLoading: state.isLoading,
    can,
    canEditPost,
    canDeletePost,
    canEditEvent,
    canDeleteEvent,
    canEditMessage,
    canDeleteMessage,
    isModerator,
    isLeader,
    refresh: fetchPermissions,
  };
}

export default usePermissions;
