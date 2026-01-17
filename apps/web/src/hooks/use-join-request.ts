'use client';

/**
 * useJoinRequest Hook
 *
 * Manages join request state for private spaces:
 * - Fetch user's current join request status
 * - Create new join request
 * - Cancel pending request
 *
 * @version 1.0.0 - Jan 2026
 */

import * as React from 'react';
import { apiClient } from '@/lib/api-client';

// ============================================================
// Types
// ============================================================

export interface JoinRequestState {
  id?: string;
  status: 'pending' | 'approved' | 'rejected' | null;
  message?: string;
  createdAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

interface UseJoinRequestReturn {
  /** Current join request state */
  joinRequest: JoinRequestState | null;
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Loading state for actions */
  isActing: boolean;
  /** Error message if any */
  error: string | null;
  /** Create a new join request */
  createRequest: (message?: string) => Promise<boolean>;
  /** Cancel a pending request */
  cancelRequest: () => Promise<boolean>;
  /** Refresh the request state */
  refresh: () => Promise<void>;
  /** Can request again after rejection (based on cooldown) */
  canRequestAgain: boolean;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useJoinRequest(spaceId: string | null | undefined): UseJoinRequestReturn {
  const [joinRequest, setJoinRequest] = React.useState<JoinRequestState | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isActing, setIsActing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check if user can request again after rejection (7 day cooldown)
  const canRequestAgain = React.useMemo(() => {
    if (!joinRequest || joinRequest.status !== 'rejected') return true;
    if (!joinRequest.reviewedAt) return true;

    const rejectedAt = new Date(joinRequest.reviewedAt);
    const cooldownDays = 7;
    const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    return now - rejectedAt.getTime() > cooldownMs;
  }, [joinRequest]);

  // Fetch current request status
  const fetchRequest = React.useCallback(async () => {
    if (!spaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.get(`/api/spaces/${spaceId}/join-request`);

      if (!res.ok) {
        // 404 means no request exists, which is fine
        if (res.status === 404) {
          setJoinRequest(null);
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data.error?.message || 'Failed to fetch join request');
        return;
      }

      const data: ApiResponse<JoinRequestState | null> = await res.json();
      if (data.success) {
        setJoinRequest(data.data ?? null);
      } else {
        setError(data.error?.message || 'Failed to fetch join request');
      }
    } catch (err) {
      console.error('[useJoinRequest] Fetch error:', err);
      setError('Failed to fetch join request');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  // Create a new join request
  const createRequest = React.useCallback(
    async (message?: string): Promise<boolean> => {
      if (!spaceId) return false;

      setIsActing(true);
      setError(null);

      try {
        const res = await apiClient.post(`/api/spaces/${spaceId}/join-request`, { message });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error?.message || 'Failed to create join request');
          return false;
        }

        const data: ApiResponse<JoinRequestState> = await res.json();
        if (data.success) {
          setJoinRequest({
            id: data.data?.id,
            status: 'pending',
            message,
            createdAt: new Date().toISOString(),
          });
          return true;
        } else {
          setError(data.error?.message || 'Failed to create join request');
          return false;
        }
      } catch (err) {
        console.error('[useJoinRequest] Create error:', err);
        setError('Failed to create join request');
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [spaceId]
  );

  // Cancel a pending request
  const cancelRequest = React.useCallback(async (): Promise<boolean> => {
    if (!spaceId) return false;

    setIsActing(true);
    setError(null);

    try {
      const res = await apiClient.delete(`/api/spaces/${spaceId}/join-request`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.message || 'Failed to cancel join request');
        return false;
      }

      const data: ApiResponse<{ message: string }> = await res.json();
      if (data.success) {
        setJoinRequest(null);
        return true;
      } else {
        setError(data.error?.message || 'Failed to cancel join request');
        return false;
      }
    } catch (err) {
      console.error('[useJoinRequest] Cancel error:', err);
      setError('Failed to cancel join request');
      return false;
    } finally {
      setIsActing(false);
    }
  }, [spaceId]);

  // Initial fetch
  React.useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return {
    joinRequest,
    isLoading,
    isActing,
    error,
    createRequest,
    cancelRequest,
    refresh: fetchRequest,
    canRequestAgain,
  };
}

export default useJoinRequest;
