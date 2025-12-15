'use client';

/**
 * useSpaceWithTools - Unified hook for Space page data
 *
 * Combines space metadata, membership, chat, and deployed tools
 * into a single hook for the space page to consume.
 *
 * This reduces prop drilling and provides a single source of truth
 * for all space-related state.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@hive/auth-logic';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';
import { useChatMessages, type ChatOptions } from './use-chat-messages';

// ============================================================
// Types
// ============================================================

/** Deployed tool metadata for space tools */
export interface DeployedTool {
  /** Deployment/placement ID */
  deploymentId: string;
  /** Tool ID */
  toolId: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Element type for rendering */
  elementType: string;
  /** Tool category */
  category?: string;
  /** Whether active */
  isActive: boolean;
}

export interface SpaceData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  isPublic?: boolean;
  memberCount?: number;
  coverImageUrl?: string;
  avatarUrl?: string;
  createdAt?: string;
  ownerId?: string;
}

export interface SpaceMembership {
  isMember: boolean;
  isLeader: boolean;
  role?: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  joinedAt?: string;
}

export interface SpaceToolsState {
  tools: DeployedTool[];
  isLoading: boolean;
  error: string | null;
}

export interface UseSpaceWithToolsOptions {
  spaceId: string;
  /** Enable real-time chat updates */
  enableChat?: boolean;
  /** Enable auto-loading of deployed tools */
  enableTools?: boolean;
  /** Initial board ID for chat */
  initialBoardId?: string;
  /** Polling interval for chat (default: 1000ms) */
  pollingIntervalMs?: number;
}

export interface UseSpaceWithToolsReturn {
  // Space data
  space: SpaceData | null;
  membership: SpaceMembership;

  // Tools
  tools: DeployedTool[];
  toolsLoading: boolean;
  toolsError: string | null;
  refreshTools: () => Promise<void>;

  // Chat (from useChatMessages)
  chat: ReturnType<typeof useChatMessages>;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  joinSpace: () => Promise<boolean>;
  leaveSpace: () => Promise<boolean>;
  refresh: () => Promise<void>;

  // Tool insertion helper (for chat)
  insertToolInChat: (tool: DeployedTool) => Promise<boolean>;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useSpaceWithTools(options: UseSpaceWithToolsOptions): UseSpaceWithToolsReturn {
  const {
    spaceId,
    enableChat = true,
    enableTools = true,
    initialBoardId,
    pollingIntervalMs = 1000, // Default to 1s polling (faster than 3s)
  } = options;

  const { user } = useAuth();

  // Core state
  const [space, setSpace] = useState<SpaceData | null>(null);
  const [membership, setMembership] = useState<SpaceMembership>({
    isMember: false,
    isLeader: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tools state
  const [toolsState, setToolsState] = useState<SpaceToolsState>({
    tools: [],
    isLoading: true,
    error: null,
  });

  // Chat hook (conditional)
  const chatOptions: ChatOptions = useMemo(() => ({
    spaceId,
    initialBoardId,
    enableRealtime: enableChat,
    pollingIntervalMs,
  }), [spaceId, initialBoardId, enableChat, pollingIntervalMs]);

  const chat = useChatMessages(chatOptions);

  // ============================================================
  // Fetch Space Data
  // ============================================================

  const fetchSpace = useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Space not found');
        }
        if (res.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error(`Failed to load space: ${res.status}`);
      }

      const response = await res.json();
      const data = response.data || response;

      setSpace({
        id: data.id || spaceId,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        isPublic: data.isPublic,
        memberCount: data.memberCount,
        coverImageUrl: data.coverImageUrl,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt,
        ownerId: data.ownerId,
      });

      // Parse membership from response
      const role = data.membership?.role || data.membershipRole;
      const status = data.membership?.status || data.membershipStatus;
      const isMemberCheck = Boolean(
        data.isMember ||
        data.membership?.isActive ||
        ['active', 'joined'].includes((status || '').toLowerCase())
      );
      const isLeaderCheck = Boolean(
        ['owner', 'leader', 'admin', 'moderator'].includes((role || '').toLowerCase()) ||
        data.membership?.isLeader
      );

      setMembership({
        isMember: isMemberCheck,
        isLeader: isLeaderCheck,
        role: role?.toLowerCase() as SpaceMembership['role'],
        joinedAt: data.membership?.joinedAt,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load space';
      setError(message);
      logger.error('Failed to fetch space', { component: 'useSpaceWithTools', spaceId }, e instanceof Error ? e : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  // ============================================================
  // Fetch Deployed Tools
  // ============================================================

  const fetchTools = useCallback(async () => {
    if (!spaceId || !enableTools) return;

    setToolsState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/tools?status=active`);
      if (!res.ok) {
        if (res.status === 403) {
          // Not a member, no tools access
          setToolsState({ tools: [], isLoading: false, error: null });
          return;
        }
        throw new Error('Failed to load tools');
      }

      const response = await res.json();
      const data = response.data || response;
      const tools: DeployedTool[] = (data.tools || []).map((t: Record<string, unknown>) => ({
        deploymentId: t.deploymentId as string || t.id as string,
        toolId: t.toolId as string,
        name: t.name as string,
        description: t.description as string | undefined,
        elementType: t.elementType as string || t.type as string || 'custom',
        category: t.category as string | undefined,
        isActive: t.isActive !== false && t.status !== 'inactive',
      }));

      setToolsState({ tools, isLoading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load tools';
      setToolsState(prev => ({ ...prev, isLoading: false, error: message }));
      logger.error('Failed to fetch tools', { component: 'useSpaceWithTools', spaceId }, e instanceof Error ? e : undefined);
    }
  }, [spaceId, enableTools]);

  // ============================================================
  // Join/Leave Space
  // ============================================================

  const joinSpace = useCallback(async (): Promise<boolean> => {
    if (!spaceId || !user) return false;

    // Optimistic update
    const prevMembership = { ...membership };
    const prevMemberCount = space?.memberCount ?? 0;

    setMembership({ isMember: true, isLeader: false, role: 'member' });
    setSpace(prev => prev ? { ...prev, memberCount: prevMemberCount + 1 } : prev);

    try {
      const res = await secureApiFetch('/api/spaces/join-v2', {
        method: 'POST',
        body: JSON.stringify({ spaceId, joinMethod: 'manual' }),
      });

      if (res.ok) {
        // Reload to get accurate data
        await fetchSpace();
        await fetchTools();
        return true;
      }

      // Revert on failure
      setMembership(prevMembership);
      setSpace(prev => prev ? { ...prev, memberCount: prevMemberCount } : prev);
      return false;
    } catch {
      // Revert on error
      setMembership(prevMembership);
      setSpace(prev => prev ? { ...prev, memberCount: prevMemberCount } : prev);
      return false;
    }
  }, [spaceId, user, membership, space?.memberCount, fetchSpace, fetchTools]);

  const leaveSpace = useCallback(async (): Promise<boolean> => {
    if (!spaceId || !user) return false;

    // Optimistic update
    const prevMembership = { ...membership };
    const prevMemberCount = space?.memberCount ?? 0;

    setMembership({ isMember: false, isLeader: false });
    setSpace(prev => prev ? { ...prev, memberCount: Math.max(0, prevMemberCount - 1) } : prev);

    try {
      const res = await secureApiFetch('/api/spaces/leave', {
        method: 'POST',
        body: JSON.stringify({ spaceId }),
      });

      if (res.ok) {
        return true;
      }

      // Revert on failure
      setMembership(prevMembership);
      setSpace(prev => prev ? { ...prev, memberCount: prevMemberCount } : prev);
      return false;
    } catch {
      // Revert on error
      setMembership(prevMembership);
      setSpace(prev => prev ? { ...prev, memberCount: prevMemberCount } : prev);
      return false;
    }
  }, [spaceId, user, membership, space?.memberCount]);

  // ============================================================
  // Insert Tool in Chat
  // ============================================================

  const insertToolInChat = useCallback(async (tool: DeployedTool): Promise<boolean> => {
    if (!chat.activeBoardId) {
      logger.warn('Cannot insert tool: no active board', { component: 'useSpaceWithTools' });
      return false;
    }

    // TODO: Implement proper component insertion via API when sendMessage supports componentData
    // For now, send a simple message with tool name
    try {
      await chat.sendMessage(`[Tool: ${tool.name}]`);
      logger.info('Tool reference inserted in chat', { component: 'useSpaceWithTools', toolId: tool.toolId });
      return true;
    } catch (error) {
      logger.error('Failed to insert tool in chat', { component: 'useSpaceWithTools' }, error instanceof Error ? error : undefined);
      return false;
    }
  }, [chat]);

  // ============================================================
  // Refresh All
  // ============================================================

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchSpace(),
      fetchTools(),
      chat.refresh(),
    ]);
  }, [fetchSpace, fetchTools, chat]);

  // ============================================================
  // Effects
  // ============================================================

  // Initial load
  useEffect(() => {
    fetchSpace();
    if (enableTools) {
      fetchTools();
    }
  }, [fetchSpace, fetchTools, enableTools]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Space data
    space,
    membership,

    // Tools
    tools: toolsState.tools,
    toolsLoading: toolsState.isLoading,
    toolsError: toolsState.error,
    refreshTools: fetchTools,

    // Chat
    chat,

    // Loading states
    isLoading,
    error,

    // Actions
    joinSpace,
    leaveSpace,
    refresh,
    insertToolInChat,
  };
}

export default useSpaceWithTools;
