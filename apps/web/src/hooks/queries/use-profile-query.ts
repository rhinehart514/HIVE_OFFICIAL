"use client";

/**
 * React Query hooks for profiles
 *
 * Provides caching for current user and public profiles.
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchCurrentProfile,
  fetchProfile,
  fetchConnections,
  fetchUserSpaces,
  type ProfileDTO,
  type ConnectionDTO,
} from "@/lib/fetchers";

// ============================================================
// Current User Profile
// ============================================================

interface UseCurrentProfileOptions
  extends Omit<UseQueryOptions<ProfileDTO, Error>, "queryKey" | "queryFn"> {}

/**
 * Fetch the current user's profile
 *
 * @example
 * const { data: profile, isLoading } = useCurrentProfile();
 */
export function useCurrentProfile(options?: UseCurrentProfileOptions) {
  return useQuery<ProfileDTO, Error>({
    queryKey: queryKeys.users.current(),
    queryFn: fetchCurrentProfile,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
    ...options,
  });
}

// ============================================================
// Public Profile
// ============================================================

interface UseProfileOptions
  extends Omit<UseQueryOptions<ProfileDTO, Error>, "queryKey" | "queryFn"> {
  enabled?: boolean;
}

/**
 * Fetch a user's public profile by ID
 *
 * @example
 * const { data: profile } = useProfile(userId);
 */
export function useProfileQuery(userId: string, options?: UseProfileOptions) {
  return useQuery<ProfileDTO, Error>({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId) && options?.enabled !== false,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    ...options,
  });
}

// ============================================================
// Connections
// ============================================================

/**
 * Fetch user's connections
 *
 * @example
 * const { data: connections } = useConnections(userId, { limit: 10 });
 */
export function useConnections(
  userId?: string,
  options?: { limit?: number; enabled?: boolean }
) {
  return useQuery<ConnectionDTO[]>({
    queryKey: userId
      ? [...queryKeys.users.detail(userId), "connections"]
      : [...queryKeys.users.current(), "connections"],
    queryFn: () => fetchConnections(userId, { limit: options?.limit }),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ============================================================
// User's Spaces
// ============================================================

/**
 * Fetch spaces a user belongs to
 *
 * @example
 * const { data: spaces } = useUserSpaces(userId);
 */
export function useUserSpaces(userId?: string, options?: { enabled?: boolean }) {
  return useQuery<Array<{ id: string; name: string; role: string }>>({
    queryKey: userId
      ? queryKeys.users.spaces(userId)
      : [...queryKeys.users.current(), "spaces"],
    queryFn: () => fetchUserSpaces(userId),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
