/**
 * Profile API Fetchers
 *
 * Pure fetch functions for user profiles.
 */

import { secureApiFetch } from "@/lib/secure-auth-utils";

// ============================================================
// Types
// ============================================================

export interface ProfileDTO {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  handle?: string;
  photoURL?: string;
  bio?: string;
  campusId: string;
  schoolYear?: number;
  major?: string;
  interests: string[];
  userType: "explorer" | "leader";
  isOnboarded: boolean;
  createdAt: string;
  lastSeen?: string;
  presence?: {
    status: "online" | "offline" | "away";
    lastSeen?: string;
  };
  privacy?: {
    profileVisibility: "public" | "campus" | "connections" | "private";
    showPresence: boolean;
    showSpaces: boolean;
    ghostMode: boolean;
  };
  stats?: {
    spacesCount: number;
    connectionsCount: number;
    toolsCount: number;
  };
}

export interface ProfileUpdateDTO {
  fullName?: string;
  bio?: string;
  major?: string;
  schoolYear?: number;
  interests?: string[];
  photoURL?: string;
}

export interface ConnectionDTO {
  id: string;
  userId: string;
  fullName: string;
  handle?: string;
  photoURL?: string;
  mutualSpaces: number;
  connectionStrength: number;
}

// ============================================================
// Fetchers
// ============================================================

/**
 * Fetch current user's profile
 */
export async function fetchCurrentProfile(): Promise<ProfileDTO> {
  const res = await secureApiFetch("/api/profile");

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  const response = await res.json();
  return normalizeProfile(response.data || response);
}

/**
 * Fetch a user's public profile by ID
 */
export async function fetchProfile(userId: string): Promise<ProfileDTO> {
  const res = await secureApiFetch(`/api/profile/${userId}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Profile not found");
    }
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  const response = await res.json();
  return normalizeProfile(response.data || response);
}

/**
 * Update current user's profile
 */
export async function updateProfile(
  updates: ProfileUpdateDTO
): Promise<ProfileDTO> {
  const res = await secureApiFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update profile: ${res.status}`);
  }

  const response = await res.json();
  return normalizeProfile(response.data || response);
}

/**
 * Fetch user's connections
 */
export async function fetchConnections(
  userId?: string,
  options?: { limit?: number }
): Promise<ConnectionDTO[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));

  const endpoint = userId
    ? `/api/profile/${userId}/connections?${params.toString()}`
    : `/api/profile/connections?${params.toString()}`;

  const res = await secureApiFetch(endpoint);

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  const data = response.data || response;
  return (data.connections || data || []).map(normalizeConnection);
}

/**
 * Fetch user's spaces
 */
export async function fetchUserSpaces(
  userId?: string
): Promise<Array<{ id: string; name: string; role: string }>> {
  const endpoint = userId
    ? `/api/profile/${userId}/spaces`
    : "/api/profile/spaces";

  const res = await secureApiFetch(endpoint);

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  const data = response.data || response;
  return data.spaces || data || [];
}

// ============================================================
// Helpers
// ============================================================

function normalizeProfile(raw: Record<string, unknown>): ProfileDTO {
  return {
    id: (raw.id || raw.uid) as string,
    uid: (raw.uid || raw.id) as string,
    email: raw.email as string,
    fullName: raw.fullName as string,
    handle: raw.handle as string | undefined,
    photoURL: raw.photoURL as string | undefined,
    bio: raw.bio as string | undefined,
    campusId: (raw.campusId as string) || "ub-buffalo",
    schoolYear: raw.schoolYear as number | undefined,
    major: raw.major as string | undefined,
    interests: (raw.interests as string[]) || [],
    userType: (raw.userType as "explorer" | "leader") || "explorer",
    isOnboarded: (raw.isOnboarded as boolean) || false,
    createdAt: raw.createdAt as string,
    lastSeen: raw.lastSeen as string | undefined,
    presence: raw.presence as ProfileDTO["presence"],
    privacy: raw.privacy as ProfileDTO["privacy"],
    stats: raw.stats as ProfileDTO["stats"],
  };
}

function normalizeConnection(raw: Record<string, unknown>): ConnectionDTO {
  return {
    id: raw.id as string,
    userId: (raw.userId || raw.id) as string,
    fullName: raw.fullName as string,
    handle: raw.handle as string | undefined,
    photoURL: raw.photoURL as string | undefined,
    mutualSpaces: (raw.mutualSpaces as number) || 0,
    connectionStrength: (raw.connectionStrength as number) || 0,
  };
}
