/**
 * Browse & Discovery API Fetchers
 *
 * Pure fetch functions for space discovery.
 */

import { secureApiFetch } from "@/lib/secure-auth-utils";

// ============================================================
// Types
// ============================================================

export interface BrowseSpaceDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  slug?: string;
  bannerImage?: string;
  memberCount: number;
  onlineCount?: number;
  isVerified: boolean;
  visibility: "public" | "private";
  lastActivity?: string;
  trendingScore?: number;
  isMember?: boolean;
}

export interface BrowseFilters {
  category?: string;
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: "trending" | "newest" | "members" | "activity";
}

export interface BrowseResponse {
  spaces: BrowseSpaceDTO[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface SearchFilters {
  query: string;
  category?: string;
  limit?: number;
}

export interface SearchResponse {
  spaces: BrowseSpaceDTO[];
  total: number;
}

// ============================================================
// Fetchers
// ============================================================

/**
 * Browse spaces with filtering and pagination
 */
export async function fetchBrowseSpaces(
  filters: BrowseFilters = {}
): Promise<BrowseResponse> {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }
  if (filters.query) params.set("query", filters.query);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  if (filters.sortBy) params.set("sortBy", filters.sortBy);

  const res = await secureApiFetch(`/api/spaces/browse-v2?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch spaces: ${res.status}`);
  }

  const response = await res.json();
  const data = response.data || response;

  return {
    spaces: (data.spaces || []).map(normalizeSpace),
    total: data.total || 0,
    hasMore: data.hasMore || false,
    nextOffset: data.nextOffset,
  };
}

/**
 * Search spaces
 */
export async function searchSpaces(
  filters: SearchFilters
): Promise<SearchResponse> {
  const params = new URLSearchParams();
  params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.limit) params.set("limit", String(filters.limit));

  const res = await secureApiFetch(`/api/spaces/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Search failed: ${res.status}`);
  }

  const response = await res.json();
  const data = response.data || response;

  return {
    spaces: (data.spaces || data.results || []).map(normalizeSpace),
    total: data.total || 0,
  };
}

/**
 * Fetch recommended spaces
 */
export async function fetchRecommendedSpaces(
  limit: number = 5
): Promise<BrowseSpaceDTO[]> {
  const res = await secureApiFetch(`/api/spaces/recommended?limit=${limit}`);

  if (!res.ok) {
    return [];
  }

  const response = await res.json();
  const data = response.data || response;
  return (data.spaces || data || []).map(normalizeSpace);
}

/**
 * Fetch featured/trending space (hero)
 */
export async function fetchFeaturedSpace(): Promise<BrowseSpaceDTO | null> {
  const res = await secureApiFetch("/api/spaces/featured");

  if (!res.ok) {
    return null;
  }

  const response = await res.json();
  const data = response.data || response;
  return data ? normalizeSpace(data) : null;
}

// ============================================================
// Helpers
// ============================================================

function normalizeSpace(raw: Record<string, unknown>): BrowseSpaceDTO {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: (raw.description as string) || "",
    category: (raw.category as string) || "club",
    slug: raw.slug as string | undefined,
    bannerImage: (raw.bannerImage || raw.bannerUrl || raw.banner) as string | undefined,
    memberCount: (raw.memberCount as number) || 0,
    onlineCount: raw.onlineCount as number | undefined,
    isVerified: (raw.isVerified as boolean) || false,
    visibility: (raw.visibility as "public" | "private") || "public",
    lastActivity: raw.lastActivity as string | undefined,
    trendingScore: raw.trendingScore as number | undefined,
    isMember: raw.isMember as boolean | undefined,
  };
}
