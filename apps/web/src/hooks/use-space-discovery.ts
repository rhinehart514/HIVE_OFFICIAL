"use client";

/**
 * useSpaceDiscovery hook stub
 *
 * Simplified version to replace the deleted hook.
 * Provides space discovery functionality with category filtering.
 */

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@hive/auth-logic";
import { logger } from "@/lib/logger";

export type SpaceCategory =
  | "all"
  | "club"
  | "student_org"
  | "academic"
  | "residential"
  | "university_org"
  | "greek_life"
  | "sports"
  | "arts";

interface SpaceData {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  bannerUrl?: string;
  iconUrl?: string;
  category: string;
  isVerified?: boolean;
  activityLevel?: string;
  creator?: { id: string; name: string; avatar?: string };
}

interface SpaceDiscoveryFilters {
  query: string;
  category: SpaceCategory;
}

interface SpaceDiscoverySections {
  featured: SpaceData[];
  recommended: SpaceData[];
  popular: SpaceData[];
  new: SpaceData[];
}

interface UseSpaceDiscoveryOptions {
  enableSections?: boolean;
  limit?: number;
}

interface UseSpaceDiscoveryReturn {
  spaces: SpaceData[];
  sections: SpaceDiscoverySections | null;
  filters: SpaceDiscoveryFilters;
  setCategory: (category: SpaceCategory) => void;
  setQuery: (query: string) => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  error: string | null;
  joinSpace: (spaceId: string) => Promise<boolean>;
  isJoining: boolean;
  joiningIds: Set<string>;
  refresh: () => void;
}

export function useSpaceDiscovery(
  options: UseSpaceDiscoveryOptions = {}
): UseSpaceDiscoveryReturn {
  const { enableSections = true, limit = 20 } = options;
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [sections, setSections] = useState<SpaceDiscoverySections | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<SpaceDiscoveryFilters>({
    query: "",
    category: "all",
  });

  const fetchSpaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        ...(filters.category !== "all" && { category: filters.category }),
        ...(filters.query && { query: filters.query }),
      });

      const response = await fetch(`/api/spaces/browse-v2?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch spaces");
      }

      const data = await response.json();

      if (enableSections && data.sections) {
        setSections({
          featured: Array.isArray(data.sections.featured) ? data.sections.featured : [],
          recommended: Array.isArray(data.sections.recommended) ? data.sections.recommended : [],
          popular: Array.isArray(data.sections.popular) ? data.sections.popular : [],
          new: Array.isArray(data.sections.new) ? data.sections.new : [],
        });
      }

      // Ensure we always set an array
      const spacesData = data.spaces ?? data.data;
      setSpaces(Array.isArray(spacesData) ? spacesData : []);
    } catch (err) {
      logger.error("Failed to fetch spaces", { component: "useSpaceDiscovery" }, err instanceof Error ? err : undefined);
      setError(err instanceof Error ? err.message : "Failed to load spaces");
    } finally {
      setIsLoading(false);
    }
  }, [enableSections, limit, filters.category, filters.query]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const setCategory = useCallback((category: SpaceCategory) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  const joinSpace = useCallback(
    async (spaceId: string): Promise<boolean> => {
      if (!user) return false;

      setIsJoining(true);
      setJoiningIds((prev) => new Set(prev).add(spaceId));

      try {
        const response = await fetch("/api/spaces/join-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spaceId }),
        });

        if (!response.ok) {
          throw new Error("Failed to join space");
        }

        // Update local state to reflect membership
        setSpaces((prev) =>
          prev.map((space) =>
            space.id === spaceId
              ? { ...space, memberCount: space.memberCount + 1 }
              : space
          )
        );

        return true;
      } catch (err) {
        logger.error("Failed to join space", { component: "useSpaceDiscovery", spaceId }, err instanceof Error ? err : undefined);
        return false;
      } finally {
        setIsJoining(false);
        setJoiningIds((prev) => {
          const next = new Set(prev);
          next.delete(spaceId);
          return next;
        });
      }
    },
    [user]
  );

  const hasActiveFilters = filters.query.length > 0 || filters.category !== "all";

  return {
    spaces,
    sections,
    filters,
    setCategory,
    setQuery,
    hasActiveFilters,
    isLoading,
    error,
    joinSpace,
    isJoining,
    joiningIds,
    refresh: fetchSpaces,
  };
}
