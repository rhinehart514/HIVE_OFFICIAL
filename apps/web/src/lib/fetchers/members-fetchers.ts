/**
 * Space Members API Fetchers
 *
 * Pure fetch functions for space membership management.
 */

import { secureApiFetch } from "@/lib/secure-auth-utils";

// ============================================================
// Types
// ============================================================

export interface SpaceMemberDTO {
  id: string;
  userId: string;
  fullName: string;
  handle?: string;
  photoURL?: string;
  role: "owner" | "admin" | "moderator" | "member" | "guest";
  status: "active" | "pending" | "suspended";
  joinedAt: string;
  presence?: {
    status: "online" | "offline" | "away";
    lastSeen?: string;
  };
}

export interface MembersResponse {
  members: SpaceMemberDTO[];
  total: number;
  hasMore: boolean;
}

export interface MemberFilters {
  role?: string;
  status?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

// ============================================================
// Fetchers
// ============================================================

/**
 * Fetch space members with filtering and pagination
 */
export async function fetchSpaceMembers(
  spaceId: string,
  filters: MemberFilters = {}
): Promise<MembersResponse> {
  const params = new URLSearchParams();
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (filters.query) params.set("query", filters.query);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const res = await secureApiFetch(
    `/api/spaces/${spaceId}/members?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch members: ${res.status}`);
  }

  const response = await res.json();
  const data = response.data || response;

  return {
    members: (data.members || []).map(normalizeMember),
    total: data.total || 0,
    hasMore: data.hasMore || false,
  };
}

/**
 * Fetch online members count
 */
export async function fetchOnlineCount(spaceId: string): Promise<number> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/online`);

  if (!res.ok) {
    return 0;
  }

  const response = await res.json();
  return response.count || response.onlineCount || 0;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  spaceId: string,
  userId: string,
  role: SpaceMemberDTO["role"]
): Promise<{ success: boolean }> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update role: ${res.status}`);
  }

  return { success: true };
}

/**
 * Remove member from space
 */
export async function removeMember(
  spaceId: string,
  userId: string
): Promise<{ success: boolean }> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/${userId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to remove member: ${res.status}`);
  }

  return { success: true };
}

// ============================================================
// Helpers
// ============================================================

function normalizeMember(raw: Record<string, unknown>): SpaceMemberDTO {
  return {
    id: (raw.id || raw.memberId) as string,
    userId: (raw.userId || raw.id) as string,
    fullName: raw.fullName as string,
    handle: raw.handle as string | undefined,
    photoURL: raw.photoURL as string | undefined,
    role: (raw.role as SpaceMemberDTO["role"]) || "member",
    status: (raw.status as SpaceMemberDTO["status"]) || "active",
    joinedAt: raw.joinedAt as string,
    presence: raw.presence as SpaceMemberDTO["presence"],
  };
}
