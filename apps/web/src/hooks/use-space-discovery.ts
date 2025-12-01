"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { secureApiFetch } from "@/lib/secure-auth-utils";

/**
 * Space Discovery Hook
 *
 * Handles browsing, searching, and filtering spaces for discovery pages.
 * Supports section-based discovery (featured, recommended, popular, new)
 * and traditional search/filter patterns.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

// ============================================================
// Types
// ============================================================

export type SpaceCategory =
  | "club"
  | "academic"
  | "student_org"
  | "residential"
  | "university_org"
  | "greek_life"
  | "sports"
  | "arts"
  | "all";

export interface DiscoverySpace {
  id: string;
  name: string;
  description: string;
  category: SpaceCategory;
  slug?: string;
  iconUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  onlineCount?: number;
  isVerified: boolean;
  isJoined: boolean;
  trendingScore?: number;
  activityLevel?: "high" | "medium" | "low" | "quiet";
  createdAt?: string;
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface DiscoverySections {
  featured: DiscoverySpace[];
  recommended: DiscoverySpace[];
  popular: DiscoverySpace[];
  new: DiscoverySpace[];
}

export interface BrowseFilters {
  category: SpaceCategory;
  query: string;
  sortBy: "trending" | "recent" | "popular" | "alphabetical";
  verifiedOnly: boolean;
  minMembers?: number;
  maxMembers?: number;
}

export interface BrowseOptions {
  initialCategory?: SpaceCategory;
  initialQuery?: string;
  limit?: number;
  enableSections?: boolean;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_FILTERS: BrowseFilters = {
  category: "all",
  query: "",
  sortBy: "trending",
  verifiedOnly: false,
};

const DEFAULT_LIMIT = 20;
const DEBOUNCE_MS = 300;

// ============================================================
// Hook
// ============================================================

export function useSpaceDiscovery(options: BrowseOptions = {}) {
  const {
    initialCategory = "all",
    initialQuery = "",
    limit = DEFAULT_LIMIT,
    enableSections = true,
  } = options;

  // State
  const [spaces, setSpaces] = useState<DiscoverySpace[]>([]);
  const [sections, setSections] = useState<DiscoverySections | null>(null);
  const [filters, setFilters] = useState<BrowseFilters>({
    ...DEFAULT_FILTERS,
    category: initialCategory,
    query: initialQuery,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);

  // Refs for debouncing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Joining state for optimistic updates
  const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set());

  /**
   * Fetch discovery sections (featured, recommended, popular, new)
   */
  const loadSections = useCallback(async () => {
    if (!enableSections) return;

    try {
      const res = await secureApiFetch("/api/spaces/recommended");
      if (!res.ok) throw new Error(`${res.status}`);

      const response = await res.json();
      const data = response.data || response;

      setSections({
        featured: data.panicRelief ?? data.featured ?? [],
        recommended: data.recommendations ?? data.recommended ?? [],
        popular: data.whereYourFriendsAre ?? data.popular ?? [],
        new: data.insiderAccess ?? data.new ?? [],
      });
    } catch (e) {
      // Sections failing shouldn't block the main experience
      console.warn("Failed to load discovery sections:", e);
    }
  }, [enableSections]);

  /**
   * Fetch spaces with filters
   */
  const loadSpaces = useCallback(
    async (reset = true) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (reset) {
        setIsLoading(true);
        setCursor(null);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters.category && filters.category !== "all") {
          params.set("category", filters.category);
        }
        if (filters.query) {
          params.set("q", filters.query);
        }
        params.set("sortBy", filters.sortBy);
        params.set("limit", String(limit));

        if (filters.verifiedOnly) {
          params.set("verified", "true");
        }
        if (filters.minMembers !== undefined) {
          params.set("minMembers", String(filters.minMembers));
        }
        if (filters.maxMembers !== undefined) {
          params.set("maxMembers", String(filters.maxMembers));
        }
        if (cursor && !reset) {
          params.set("cursor", cursor);
        }

        const endpoint = filters.query
          ? `/api/spaces/search?${params}`
          : `/api/spaces?${params}`;

        const res = await secureApiFetch(endpoint, {
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) throw new Error(`${res.status}`);

        const response = await res.json();
        const data = response.data || response;

        const newSpaces: DiscoverySpace[] = data.spaces ?? data ?? [];
        const pagination = data.pagination ?? response.meta?.pagination;

        if (reset) {
          setSpaces(newSpaces);
        } else {
          setSpaces((prev) => [...prev, ...newSpaces]);
        }

        setTotalCount(pagination?.total ?? data.total ?? newSpaces.length);
        setHasMore(pagination?.hasMore ?? newSpaces.length >= limit);
        setCursor(pagination?.nextCursor ?? null);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return; // Ignore aborted requests
        }
        setError(e instanceof Error ? e.message : "Failed to load spaces");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters, limit, cursor]
  );

  /**
   * Load more spaces (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await loadSpaces(false);
  }, [loadSpaces, isLoadingMore, hasMore]);

  /**
   * Set category filter
   */
  const setCategory = useCallback((category: SpaceCategory) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  /**
   * Set search query (debounced)
   */
  const setQuery = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Update immediately for UI responsiveness
    setFilters((prev) => ({ ...prev, query }));

    // Debounce the actual search
    searchTimeoutRef.current = setTimeout(() => {
      // loadSpaces will be triggered by the useEffect below
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Set sort order
   */
  const setSortBy = useCallback(
    (sortBy: BrowseFilters["sortBy"]) => {
      setFilters((prev) => ({ ...prev, sortBy }));
    },
    []
  );

  /**
   * Set verified-only filter
   */
  const setVerifiedOnly = useCallback((verifiedOnly: boolean) => {
    setFilters((prev) => ({ ...prev, verifiedOnly }));
  }, []);

  /**
   * Set member count range
   */
  const setMemberRange = useCallback(
    (min?: number, max?: number) => {
      setFilters((prev) => ({ ...prev, minMembers: min, maxMembers: max }));
    },
    []
  );

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Join a space (optimistic update)
   */
  const joinSpace = useCallback(
    async (spaceId: string): Promise<boolean> => {
      // Track joining state
      setJoiningIds((prev) => new Set(prev).add(spaceId));

      // Optimistic update
      setSpaces((prev) =>
        prev.map((s) =>
          s.id === spaceId
            ? { ...s, isJoined: true, memberCount: s.memberCount + 1 }
            : s
        )
      );

      // Update sections too
      if (sections) {
        setSections((prev) => {
          if (!prev) return prev;
          const updateSection = (spaces: DiscoverySpace[]) =>
            spaces.map((s) =>
              s.id === spaceId
                ? { ...s, isJoined: true, memberCount: s.memberCount + 1 }
                : s
            );
          return {
            featured: updateSection(prev.featured),
            recommended: updateSection(prev.recommended),
            popular: updateSection(prev.popular),
            new: updateSection(prev.new),
          };
        });
      }

      try {
        const res = await secureApiFetch("/api/spaces/join-v2", {
          method: "POST",
          body: JSON.stringify({ spaceId }),
        });

        if (res.ok) {
          return true;
        }

        // Revert on failure
        setSpaces((prev) =>
          prev.map((s) =>
            s.id === spaceId
              ? { ...s, isJoined: false, memberCount: s.memberCount - 1 }
              : s
          )
        );
        return false;
      } catch {
        // Revert on error
        setSpaces((prev) =>
          prev.map((s) =>
            s.id === spaceId
              ? { ...s, isJoined: false, memberCount: s.memberCount - 1 }
              : s
          )
        );
        return false;
      } finally {
        setJoiningIds((prev) => {
          const next = new Set(prev);
          next.delete(spaceId);
          return next;
        });
      }
    },
    [sections]
  );

  /**
   * Check if a space is being joined
   */
  const isJoining = useCallback(
    (spaceId: string): boolean => joiningIds.has(spaceId),
    [joiningIds]
  );

  // Derived state: All unique spaces from sections
  const allSectionSpaces = useMemo(() => {
    if (!sections) return [];
    const seen = new Set<string>();
    const all: DiscoverySpace[] = [];

    [
      ...sections.featured,
      ...sections.recommended,
      ...sections.popular,
      ...sections.new,
    ].forEach((space) => {
      if (!seen.has(space.id)) {
        seen.add(space.id);
        all.push(space);
      }
    });

    return all;
  }, [sections]);

  // Has active filters?
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== "all" ||
      filters.query !== "" ||
      filters.verifiedOnly ||
      filters.minMembers !== undefined ||
      filters.maxMembers !== undefined
    );
  }, [filters]);

  // Load initial data
  useEffect(() => {
    void loadSections();
    void loadSpaces(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change
  useEffect(() => {
    // Skip initial load (already done above)
    const timeout = setTimeout(() => {
      void loadSpaces(true);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.sortBy, filters.verifiedOnly, filters.minMembers, filters.maxMembers]);

  // Separate effect for query changes (already debounced in setQuery)
  useEffect(() => {
    if (filters.query !== initialQuery) {
      void loadSpaces(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Main results
    spaces,
    sections,
    allSectionSpaces,
    totalCount,

    // Filters
    filters,
    setCategory,
    setQuery,
    setSortBy,
    setVerifiedOnly,
    setMemberRange,
    resetFilters,
    hasActiveFilters,

    // Loading states
    isLoading,
    isLoadingMore,
    error,

    // Pagination
    hasMore,
    loadMore,

    // Actions
    joinSpace,
    isJoining,
    joiningIds,

    // Refresh
    refresh: () => {
      void loadSections();
      void loadSpaces(true);
    },
  };
}

export type UseSpaceDiscoveryReturn = ReturnType<typeof useSpaceDiscovery>;
