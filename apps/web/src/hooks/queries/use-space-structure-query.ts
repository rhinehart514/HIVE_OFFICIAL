"use client";

/**
 * React Query hook for fetching space structure (tabs, widgets, permissions)
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchSpaceStructure,
  type SpaceStructureDTO,
} from "@/lib/fetchers/space-fetchers";

interface UseSpaceStructureQueryOptions
  extends Omit<UseQueryOptions<SpaceStructureDTO, Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Fetch space structure with React Query caching
 *
 * @example
 * const { data: structure, isLoading } = useSpaceStructureQuery('space-123');
 * console.log(structure?.tabs, structure?.widgets);
 */
export function useSpaceStructureQuery(
  spaceId: string,
  options?: UseSpaceStructureQueryOptions
) {
  return useQuery({
    queryKey: queryKeys.spaces.structure(spaceId),
    queryFn: () => fetchSpaceStructure(spaceId),
    enabled: Boolean(spaceId) && options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes - structure changes less frequently
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    ...options,
  });
}
