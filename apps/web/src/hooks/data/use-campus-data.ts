'use client';

/**
 * Campus Data Hook — Data Fetching for Campus Navigation
 *
 * Builds on useShellData to provide data formatted for:
 * - CampusDock (spaces as orbs, tools as orbs)
 * - CommandBar (user, notifications)
 * - CampusDrawer (mobile)
 *
 * @see /docs/VERTICAL_SLICE_SPACES.md for space data patterns
 */

import React from 'react';
import { useAuth } from '@hive/auth-logic';
import type { DockSpaceItem, DockToolItem, DockWarmthLevel } from '@hive/ui';
import { useShellData, type ShellNotification } from './use-shell-data';
import { apiClient } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

export interface CampusUser {
  avatarUrl?: string;
  name?: string;
  handle?: string;
  isBuilder: boolean;
}

export interface CampusDataResult {
  // User
  user: CampusUser;

  // Dock spaces (formatted for orbs)
  dockSpaces: DockSpaceItem[];

  // Dock tools (formatted for orbs)
  dockTools: DockToolItem[];

  // Notifications
  notifications: ShellNotification[];
  notificationCount: number;

  // Loading
  isLoading: boolean;

  // Space order (for drag reorder)
  spaceOrder: string[];
  setSpaceOrder: (order: string[]) => void;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY_SPACE_ORDER = 'hive-dock-space-order';

// ============================================
// HELPERS
// ============================================

/**
 * Calculate warmth level from online count
 */
function getWarmthFromOnlineCount(count: number): DockWarmthLevel {
  if (count >= 10) return 'high';
  if (count >= 5) return 'medium';
  if (count >= 1) return 'low';
  return 'none';
}

/**
 * Transform shell space sections into flat dock items
 */
function transformSpacesToDockItems(
  sections: Array<{ spaces: Array<{ id: string; label: string; href: string; status?: string; meta?: string }> }>
): DockSpaceItem[] {
  const items: DockSpaceItem[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    for (const space of section.spaces) {
      if (seen.has(space.id)) continue;
      seen.add(space.id);

      // Parse online count from meta if available (e.g., "17 online")
      let onlineCount = 0;
      if (space.meta) {
        const match = space.meta.match(/(\d+)\s*online/i);
        if (match) {
          onlineCount = parseInt(match[1], 10);
        }
      }

      items.push({
        id: space.id,
        name: space.label,
        slug: space.href.replace('/spaces/', '').replace('/spaces/s/', ''),
        avatar: undefined, // Will be loaded separately if needed
        onlineCount,
        unreadCount: 0, // Per-space unread requires Firestore query per space — global unread available via useRealtimeNotifications
        warmth: getWarmthFromOnlineCount(onlineCount),
      });
    }
  }

  return items;
}

// ============================================
// HOOK
// ============================================

interface UseCampusDataOptions {
  skipFetch?: boolean;
}

export function useCampusData(options: UseCampusDataOptions = {}): CampusDataResult {
  const { skipFetch = false } = options;
  const auth = useAuth();

  // Get base shell data
  const shellData = useShellData({ skipFetch });

  // Local state for space order
  const [spaceOrder, setSpaceOrderState] = React.useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SPACE_ORDER);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Local state for tools
  const [tools, setTools] = React.useState<DockToolItem[]>([]);
  const [toolsLoading, setToolsLoading] = React.useState(false);

  // Persist space order
  const setSpaceOrder = React.useCallback((order: string[]) => {
    setSpaceOrderState(order);
    try {
      localStorage.setItem(STORAGE_KEY_SPACE_ORDER, JSON.stringify(order));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Transform spaces to dock items
  const dockSpaces = React.useMemo(() => {
    const items = transformSpacesToDockItems(shellData.mySpaces);

    // Sort by user's custom order
    if (spaceOrder.length > 0) {
      const orderMap = new Map(spaceOrder.map((id, index) => [id, index]));
      items.sort((a, b) => {
        const aIndex = orderMap.get(a.id) ?? Infinity;
        const bIndex = orderMap.get(b.id) ?? Infinity;
        return aIndex - bIndex;
      });
    }

    return items;
  }, [shellData.mySpaces, spaceOrder]);

  // Fetch user's tools
  React.useEffect(() => {
    if (skipFetch || !auth.user || !shellData.user.isBuilder) {
      setTools([]);
      return;
    }

    let cancelled = false;

    async function fetchTools() {
      setToolsLoading(true);
      try {
        const response = await apiClient.get('/api/tools?mine=true&status=published&limit=10');

        if (cancelled) return;

        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }

        const data = await response.json() as {
          tools?: Array<{
            id: string;
            name: string;
            icon?: string;
            status: string;
            deploymentCount?: number;
          }>;
        };

        if (data.tools) {
          setTools(
            data.tools.map((tool) => ({
              id: tool.id,
              name: tool.name,
              icon: tool.icon,
              activeUsers: 0, // TODO: Real-time active users
              isDeployed: (tool.deploymentCount ?? 0) > 0,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setTools([]);
        }
      } finally {
        if (!cancelled) {
          setToolsLoading(false);
        }
      }
    }

    fetchTools();

    return () => {
      cancelled = true;
    };
  }, [skipFetch, auth.user, shellData.user.isBuilder]);

  // Initialize space order if empty
  React.useEffect(() => {
    if (spaceOrder.length === 0 && dockSpaces.length > 0) {
      setSpaceOrder(dockSpaces.map((s) => s.id));
    }
  }, [spaceOrder.length, dockSpaces, setSpaceOrder]);

  return {
    user: shellData.user,
    dockSpaces,
    dockTools: tools,
    notifications: shellData.notifications,
    notificationCount: shellData.notificationCount,
    isLoading: shellData.isLoading || toolsLoading,
    spaceOrder,
    setSpaceOrder,
  };
}

export default useCampusData;
