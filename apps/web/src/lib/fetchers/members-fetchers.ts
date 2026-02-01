/**
 * Space Members API Fetchers
 *
 * Pure fetch functions for space membership management.
 * Optimized to avoid N+1 queries via batch fetching.
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
  nextCursor?: string | null;
}

export interface MemberFilters {
  role?: string;
  status?: string;
  query?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface BatchMemberFilters {
  memberIds: string[];
  spaceId: string;
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
 * Update member role
 */
export async function updateMemberRole(
  spaceId: string,
  memberId: string,
  role: SpaceMemberDTO["role"]
): Promise<{ success: boolean }> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/${memberId}`, {
    method: "PATCH",
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
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members?userId=${userId}`, {
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

// ============================================================
// Batch Operations (N+1 Prevention)
// ============================================================

/**
 * Batch invite multiple members to a space
 * Avoids N+1 by sending all invites in one request
 */
export async function batchInviteMembers(
  spaceId: string,
  members: Array<{ userId: string; role: "member" | "moderator" | "admin" }>
): Promise<{
  success: boolean;
  results: Array<{ success: boolean; userId: string; error?: string }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/batch`, {
    method: "POST",
    body: JSON.stringify({ action: "invite", members }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to batch invite: ${res.status}`);
  }

  const response = await res.json();
  return response.data || response;
}

/**
 * Batch update roles for multiple members
 * Avoids N+1 by sending all updates in one request
 */
export async function batchUpdateRoles(
  spaceId: string,
  updates: Array<{ userId: string; role: "member" | "moderator" | "admin" }>
): Promise<{
  success: boolean;
  results: Array<{ success: boolean; userId: string; error?: string }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/batch`, {
    method: "POST",
    body: JSON.stringify({ action: "updateRoles", updates }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to batch update roles: ${res.status}`);
  }

  const response = await res.json();
  return response.data || response;
}

/**
 * Batch remove multiple members from a space
 * Avoids N+1 by sending all removals in one request
 */
export async function batchRemoveMembers(
  spaceId: string,
  userIds: string[],
  reason?: string
): Promise<{
  success: boolean;
  results: Array<{ success: boolean; userId: string; error?: string }>;
  summary: { total: number; successful: number; failed: number };
}> {
  const res = await secureApiFetch(`/api/spaces/${spaceId}/members/batch`, {
    method: "POST",
    body: JSON.stringify({ action: "remove", userIds, reason }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to batch remove: ${res.status}`);
  }

  const response = await res.json();
  return response.data || response;
}
