/**
 * Space API Fetchers for React Query
 *
 * Pure fetch functions that can be used with React Query.
 * These handle the HTTP layer and return parsed data.
 */

import { secureApiFetch } from "@/lib/secure-auth-utils";

// ============================================================
// Types
// ============================================================

export interface SpaceDTO {
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
  membership?: {
    isMember: boolean;
    isLeader: boolean;
    role?: string;
    status?: string;
    joinedAt?: string;
  };
}

export interface SpaceStructureDTO {
  tabs: Array<{
    id: string;
    name: string;
    type: string;
    order: number;
    isDefault?: boolean;
    isVisible?: boolean;
    widgetIds?: string[];
  }>;
  widgets: Array<{
    id: string;
    type: string;
    name?: string;
    config: Record<string, unknown>;
    isEnabled?: boolean;
    tabIds?: string[];
  }>;
  permissions?: {
    canEdit: boolean;
    canManageMembers: boolean;
    canManageContent: boolean;
  };
}

export interface SpaceEventDTO {
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

export interface PinnedMessageDTO {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  pinnedAt: string;
  pinnedBy: string;
}

// ============================================================
// Fetchers
// ============================================================

/**
 * Fetch a single space by ID
 */
export async function fetchSpace(spaceId: string): Promise<SpaceDTO> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Space not found");
    }
    throw new Error(`Failed to fetch space: ${res.status}`);
  }

  const response = await res.json();
  const data = response.data || response;

  return {
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
    membership: data.membership,
  };
}

/**
 * Fetch space structure (tabs, widgets, permissions)
 */
export async function fetchSpaceStructure(spaceId: string): Promise<SpaceStructureDTO> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/structure`);

  if (!res.ok) {
    if (res.status === 404) {
      return { tabs: [], widgets: [], permissions: undefined };
    }
    throw new Error(`Failed to fetch space structure: ${res.status}`);
  }

  const response = await res.json();
  const data = response.data || response;

  return {
    tabs: data.tabs || [],
    widgets: data.widgets || [],
    permissions: data.permissions,
  };
}

/**
 * Fetch space events
 */
export async function fetchSpaceEvents(
  spaceId: string,
  options?: { limit?: number; upcoming?: boolean }
): Promise<SpaceEventDTO[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.upcoming) params.set("upcoming", "true");

  const res = await secureApiFetch(
    `/api/spaces/${spaceId}/events?${params.toString()}`
  );

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  const data = response.data || response;
  const eventsList = data.events || [];

  return eventsList.map((e: Record<string, unknown>) => ({
    id: e.id as string,
    title: e.title as string,
    description: e.description as string | undefined,
    type: e.type as string,
    startDate:
      e.startDate instanceof Date
        ? (e.startDate as Date).toISOString()
        : String(e.startDate),
    endDate:
      e.endDate instanceof Date
        ? (e.endDate as Date).toISOString()
        : String(e.endDate),
    location: e.location as string | undefined,
    virtualLink: e.virtualLink as string | undefined,
    currentAttendees: (e.currentAttendees as number) || 0,
    maxAttendees: e.maxAttendees as number | undefined,
    userRSVP: (e.userRSVP as string) || null,
    organizer: e.organizer as SpaceEventDTO["organizer"],
  }));
}

/**
 * Fetch pinned messages for a board
 */
export async function fetchPinnedMessages(
  spaceId: string,
  boardId: string
): Promise<PinnedMessageDTO[]> {
  const res = await secureApiFetch(
    `/api/spaces/${spaceId}/chat/pinned?boardId=${boardId}`
  );

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  return response.data?.pinnedMessages || response.pinnedMessages || [];
}

/**
 * Join a space
 */
export async function joinSpace(spaceId: string): Promise<{ success: boolean }> {
  const res = await secureApiFetch("/api/spaces/join-v2", {
    method: "POST",
    body: JSON.stringify({ spaceId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to join space: ${res.status}`);
  }

  return { success: true };
}

/**
 * Leave a space
 */
export async function leaveSpace(spaceId: string): Promise<{ success: boolean }> {
  const res = await secureApiFetch("/api/spaces/leave", {
    method: "POST",
    body: JSON.stringify({ spaceId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to leave space: ${res.status}`);
  }

  return { success: true };
}
