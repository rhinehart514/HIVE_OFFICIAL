"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@hive/auth-logic";
import { secureApiFetch } from "@/lib/secure-auth-utils";
import {
  useSpaceStructure,
  type SpaceTab,
  type SpaceWidget,
  type SpacePermissions,
  type AddTabInput,
  type UpdateTabInput,
  type AddWidgetInput,
  type UpdateWidgetInput,
} from "@/hooks/use-space-structure";

/**
 * Space Context Provider
 *
 * Provides unified space state for Space Detail pages. Combines:
 * - Space basic info (name, description, memberCount)
 * - Membership state (isMember, isLeader, role)
 * - Structure data (tabs, widgets, permissions)
 * - Leader actions for structure management
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

// ============================================================
// Types
// ============================================================

export type MemberRole = "owner" | "admin" | "moderator" | "member";

export interface SpaceDetailDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  slug?: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineCount?: number;
  isVerified: boolean;
  isActive: boolean;
  visibility: "public" | "private";
  settings?: {
    allowRSS: boolean;
    requireApproval: boolean;
  };
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt?: string;
}

export interface SpaceMembership {
  isMember: boolean;
  isLeader: boolean;
  role?: MemberRole;
  status?: "active" | "pending" | "invited" | "banned";
  joinedAt?: string;
}

export interface LeaderActions {
  // Tab operations
  addTab: (input: AddTabInput) => Promise<string | null>;
  updateTab: (tabId: string, updates: UpdateTabInput) => Promise<boolean>;
  removeTab: (tabId: string) => Promise<boolean>;
  reorderTabs: (orderedIds: string[]) => Promise<boolean>;

  // Widget operations
  addWidget: (input: AddWidgetInput) => Promise<string | null>;
  updateWidget: (widgetId: string, updates: UpdateWidgetInput) => Promise<boolean>;
  removeWidget: (widgetId: string) => Promise<boolean>;
  attachWidgetToTab: (widgetId: string, tabId: string) => Promise<boolean>;
  detachWidgetFromTab: (widgetId: string, tabId: string) => Promise<boolean>;

  // Space settings
  updateSpaceSettings: (settings: Partial<SpaceDetailDTO["settings"]>) => Promise<boolean>;
}

export interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
  maxAttendees?: number;
  userRSVP: string | null;
  organizer?: {
    id: string;
    fullName: string;
    handle?: string;
    photoURL?: string;
  };
}

export interface SpaceContextValue {
  // Space data
  space: SpaceDetailDTO | null;
  spaceId: string | null;

  // Membership
  membership: SpaceMembership;

  // Events
  events: SpaceEvent[];
  isEventsLoading: boolean;

  // Structure
  tabs: SpaceTab[];
  widgets: SpaceWidget[];
  permissions: SpacePermissions | null;
  visibleTabs: SpaceTab[];
  enabledWidgets: SpaceWidget[];
  defaultTab: SpaceTab | null;

  // Active tab state
  activeTabId: string | null;
  setActiveTabId: (tabId: string) => void;
  activeTab: SpaceTab | null;
  activeTabWidgets: SpaceWidget[];

  // Loading states
  isLoading: boolean;
  isStructureLoading: boolean;
  isMutating: boolean;
  error: string | null;

  // Actions
  joinSpace: () => Promise<boolean>;
  leaveSpace: () => Promise<boolean>;
  refresh: () => Promise<void>;

  // Leader actions (null if not leader)
  leaderActions: LeaderActions | null;

  // Helper to get widgets for a tab
  getWidgetsForTab: (tabId: string) => SpaceWidget[];
}

// ============================================================
// Context
// ============================================================

const SpaceCtx = createContext<SpaceContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface SpaceContextProviderProps {
  spaceId: string;
  children: ReactNode;
  initialTab?: string;
}

export function SpaceContextProvider({
  spaceId,
  children,
  initialTab,
}: SpaceContextProviderProps) {
  const { isAuthenticated } = useAuth();

  // Space basic data
  const [space, setSpace] = useState<SpaceDetailDTO | null>(null);
  const [membership, setMembership] = useState<SpaceMembership>({
    isMember: false,
    isLeader: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Events state
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);

  // P1 FIX: Prevent double-click race condition on join/leave
  const [isJoiningOrLeaving, setIsJoiningOrLeaving] = useState(false);

  // Active tab state
  const [activeTabId, setActiveTabId] = useState<string | null>(initialTab ?? null);

  // Structure hook
  const {
    structure,
    tabs,
    widgets,
    permissions,
    visibleTabs,
    enabledWidgets,
    defaultTab,
    isLoading: isStructureLoading,
    isMutating,
    error: structureError,
    canEdit,
    addTab,
    updateTab,
    removeTab,
    reorderTabs,
    addWidget,
    updateWidget,
    removeWidget,
    attachWidgetToTab,
    detachWidgetFromTab,
    getWidgetsForTab,
    reload: reloadStructure,
  } = useSpaceStructure(spaceId);

  /**
   * Fetch space basic data
   */
  const fetchSpace = useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}`);
      if (!res.ok) {
        throw new Error(`${res.status}`);
      }

      const response = await res.json();
      const data = response.data || response;

      // Map to SpaceDetailDTO
      const spaceData: SpaceDetailDTO = {
        id: data.id || spaceId,
        name: data.name,
        description: data.description || "",
        category: data.category || "club",
        slug: data.slug,
        iconUrl: data.iconUrl || data.icon,
        bannerUrl: data.bannerUrl || data.banner,
        memberCount: data.memberCount || 0,
        onlineCount: data.onlineCount,
        isVerified: data.isVerified || false,
        isActive: data.isActive !== false,
        visibility: data.visibility || "public",
        settings: data.settings,
        creator: data.creator,
        createdAt: data.createdAt,
      };
      setSpace(spaceData);

      // Extract membership info
      const membershipInfo = data.membership || {};
      const role = (membershipInfo.role || data.membershipRole || "").toLowerCase();
      const status = (membershipInfo.status || data.membershipStatus || "").toLowerCase();
      const isMember = Boolean(
        data.isMember ||
        membershipInfo.isActive ||
        ["active", "joined"].includes(status)
      );
      const isLeader = Boolean(
        ["owner", "leader", "admin", "moderator"].includes(role) ||
        membershipInfo.isLeader
      );

      setMembership({
        isMember,
        isLeader,
        role: role as MemberRole || undefined,
        status: status as SpaceMembership["status"] || undefined,
        joinedAt: membershipInfo.joinedAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load space");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  /**
   * Fetch space events
   */
  const fetchEvents = useCallback(async () => {
    if (!spaceId) return;

    setIsEventsLoading(true);

    try {
      const res = await secureApiFetch(`/api/spaces/${spaceId}/events?limit=10&upcoming=true`);
      if (!res.ok) {
        // Don't fail the whole context for events
        setEvents([]);
        return;
      }

      const response = await res.json();
      const data = response.data || response;
      const eventsList = data.events || [];

      // Map to SpaceEvent type
      const mappedEvents: SpaceEvent[] = eventsList.map((e: Record<string, unknown>) => ({
        id: e.id as string,
        title: e.title as string,
        description: e.description as string | undefined,
        type: e.type as string,
        startDate: e.startDate instanceof Date
          ? (e.startDate as Date).toISOString()
          : String(e.startDate),
        endDate: e.endDate instanceof Date
          ? (e.endDate as Date).toISOString()
          : String(e.endDate),
        location: e.location as string | undefined,
        virtualLink: e.virtualLink as string | undefined,
        currentAttendees: (e.currentAttendees as number) || 0,
        maxAttendees: e.maxAttendees as number | undefined,
        userRSVP: (e.userRSVP as string) || null,
        organizer: e.organizer as SpaceEvent["organizer"],
      }));

      setEvents(mappedEvents);
    } catch {
      // Silently fail - events are not critical
      setEvents([]);
    } finally {
      setIsEventsLoading(false);
    }
  }, [spaceId]);

  /**
   * Join space with optimistic update
   * P1 FIX: Added guard to prevent double-click race condition
   */
  const joinSpace = useCallback(async (): Promise<boolean> => {
    if (!space || isJoiningOrLeaving) return false;

    // P1 FIX: Prevent double-click
    setIsJoiningOrLeaving(true);

    // Optimistic update
    const previousMemberCount = space.memberCount;
    setMembership((prev) => ({ ...prev, isMember: true, role: "member" as MemberRole }));
    setSpace((prev) => prev ? { ...prev, memberCount: previousMemberCount + 1 } : prev);

    try {
      const res = await secureApiFetch("/api/spaces/join-v2", {
        method: "POST",
        body: JSON.stringify({ spaceId }),
      });

      if (res.ok) {
        // Refresh to get accurate data
        await fetchSpace();
        return true;
      }

      // Revert on failure
      setMembership((prev) => ({ ...prev, isMember: false, role: undefined }));
      setSpace((prev) => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    } catch {
      // Revert on error
      setMembership((prev) => ({ ...prev, isMember: false, role: undefined }));
      setSpace((prev) => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    } finally {
      setIsJoiningOrLeaving(false);
    }
  }, [space, spaceId, fetchSpace, isJoiningOrLeaving]);

  /**
   * Leave space with optimistic update
   * P1 FIX: Added guard to prevent double-click race condition
   */
  const leaveSpace = useCallback(async (): Promise<boolean> => {
    if (!space || isJoiningOrLeaving) return false;

    // Owners can't leave without transfer
    if (membership.role === "owner") {
      setError("Owners must transfer ownership before leaving");
      return false;
    }

    // P1 FIX: Prevent double-click
    setIsJoiningOrLeaving(true);

    // Optimistic update
    const previousMemberCount = space.memberCount;
    const previousMembership = { ...membership };
    setMembership({ isMember: false, isLeader: false });
    setSpace((prev) =>
      prev ? { ...prev, memberCount: Math.max(0, previousMemberCount - 1) } : prev
    );

    try {
      const res = await secureApiFetch("/api/spaces/leave", {
        method: "POST",
        body: JSON.stringify({ spaceId }),
      });

      if (res.ok) {
        return true;
      }

      // Revert on failure
      setMembership(previousMembership);
      setSpace((prev) => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    } catch {
      // Revert on error
      setMembership(previousMembership);
      setSpace((prev) => prev ? { ...prev, memberCount: previousMemberCount } : prev);
      return false;
    } finally {
      setIsJoiningOrLeaving(false);
    }
  }, [space, spaceId, membership, isJoiningOrLeaving]);

  /**
   * Update space settings (leader only)
   */
  const updateSpaceSettings = useCallback(
    async (settings: Partial<SpaceDetailDTO["settings"]>): Promise<boolean> => {
      if (!membership.isLeader || !space) return false;

      try {
        const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
          method: "PATCH",
          body: JSON.stringify({ settings }),
        });

        if (res.ok) {
          await fetchSpace();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [membership.isLeader, space, spaceId, fetchSpace]
  );

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([fetchSpace(), reloadStructure(), fetchEvents()]);
  }, [fetchSpace, reloadStructure, fetchEvents]);

  // Active tab derived state
  const activeTab = useMemo(() => {
    if (!activeTabId) return defaultTab;
    return tabs.find((t) => t.id === activeTabId) ?? defaultTab;
  }, [activeTabId, tabs, defaultTab]);

  const activeTabWidgets = useMemo(() => {
    if (!activeTab) return [];
    return getWidgetsForTab(activeTab.id);
  }, [activeTab, getWidgetsForTab]);

  // Set default tab when structure loads
  useEffect(() => {
    if (!activeTabId && defaultTab) {
      setActiveTabId(defaultTab.id);
    }
  }, [activeTabId, defaultTab]);

  // Load space data on mount
  useEffect(() => {
    void fetchSpace();
  }, [fetchSpace]);

  // Load events on mount (separate call to not block main load)
  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // Leader actions (only if user is leader)
  const leaderActions: LeaderActions | null = useMemo(() => {
    if (!membership.isLeader || !canEdit) return null;

    return {
      addTab,
      updateTab,
      removeTab,
      reorderTabs,
      addWidget,
      updateWidget,
      removeWidget,
      attachWidgetToTab,
      detachWidgetFromTab,
      updateSpaceSettings,
    };
  }, [
    membership.isLeader,
    canEdit,
    addTab,
    updateTab,
    removeTab,
    reorderTabs,
    addWidget,
    updateWidget,
    removeWidget,
    attachWidgetToTab,
    detachWidgetFromTab,
    updateSpaceSettings,
  ]);

  // Combined error
  const combinedError = error || structureError;

  // Context value
  const value = useMemo<SpaceContextValue>(
    () => ({
      space,
      spaceId,
      membership,
      events,
      isEventsLoading,
      tabs,
      widgets,
      permissions,
      visibleTabs,
      enabledWidgets,
      defaultTab,
      activeTabId,
      setActiveTabId,
      activeTab,
      activeTabWidgets,
      isLoading,
      isStructureLoading,
      isMutating,
      error: combinedError,
      joinSpace,
      leaveSpace,
      refresh,
      leaderActions,
      getWidgetsForTab,
    }),
    [
      space,
      spaceId,
      membership,
      events,
      isEventsLoading,
      tabs,
      widgets,
      permissions,
      visibleTabs,
      enabledWidgets,
      defaultTab,
      activeTabId,
      activeTab,
      activeTabWidgets,
      isLoading,
      isStructureLoading,
      isMutating,
      combinedError,
      joinSpace,
      leaveSpace,
      refresh,
      leaderActions,
      getWidgetsForTab,
    ]
  );

  return <SpaceCtx.Provider value={value}>{children}</SpaceCtx.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useSpaceContext(): SpaceContextValue {
  const ctx = useContext(SpaceCtx);
  if (!ctx) {
    throw new Error("useSpaceContext must be used within SpaceContextProvider");
  }
  return ctx;
}

/**
 * Hook to check if we're inside SpaceContextProvider
 */
export function useOptionalSpaceContext(): SpaceContextValue | null {
  return useContext(SpaceCtx);
}
