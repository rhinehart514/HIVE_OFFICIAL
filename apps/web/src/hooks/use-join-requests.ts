'use client';

/**
 * useJoinRequests Hook (for Space Leaders)
 *
 * Manages join requests for a space:
 * - Fetch pending/all join requests
 * - Approve requests
 * - Reject requests with optional reason
 *
 * @version 1.0.0 - Jan 2026
 */

import * as React from 'react';
import { apiClient } from '@/lib/api-client';

// ============================================================
// Types
// ============================================================

export interface JoinRequestUser {
  id: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  user: JoinRequestUser | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

interface UseJoinRequestsReturn {
  /** List of join requests */
  requests: JoinRequest[];
  /** Total count */
  total: number;
  /** Loading state */
  isLoading: boolean;
  /** Acting state (approving/rejecting) */
  isActing: boolean;
  /** Error message */
  error: string | null;
  /** Approve a join request */
  approveRequest: (requestId: string) => Promise<boolean>;
  /** Reject a join request with optional reason */
  rejectRequest: (requestId: string, reason?: string) => Promise<boolean>;
  /** Refresh the list */
  refresh: () => Promise<void>;
  /** Filter by status */
  filterByStatus: (status: 'pending' | 'approved' | 'rejected' | 'all') => void;
  /** Current filter status */
  statusFilter: 'pending' | 'approved' | 'rejected' | 'all';
}

// ============================================================
// Hook Implementation
// ============================================================

export function useJoinRequests(
  spaceId: string | null | undefined,
  enabled: boolean = true
): UseJoinRequestsReturn {
  const [requests, setRequests] = React.useState<JoinRequest[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isActing, setIsActing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Fetch join requests
  const fetchRequests = React.useCallback(async () => {
    if (!spaceId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ status: statusFilter });
      const res = await apiClient.get(`/api/spaces/${spaceId}/join-requests?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error?.message || 'Failed to fetch join requests');
        return;
      }

      const data: ApiResponse<{ requests: JoinRequest[]; total: number }> = await res.json();
      if (data.success && data.data) {
        setRequests(data.data.requests);
        setTotal(data.data.total);
      } else {
        setError(data.error?.message || 'Failed to fetch join requests');
      }
    } catch {
      setError('Failed to fetch join requests');
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, enabled, statusFilter]);

  // Approve a request
  const approveRequest = React.useCallback(
    async (requestId: string): Promise<boolean> => {
      if (!spaceId) return false;

      setIsActing(true);
      setError(null);

      try {
        const res = await apiClient.patch(`/api/spaces/${spaceId}/join-requests`, {
          requestId,
          action: 'approve',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error?.message || 'Failed to approve request');
          return false;
        }

        const data: ApiResponse<{ message: string }> = await res.json();
        if (data.success) {
          // Remove from list or update status
          setRequests((prev) =>
            prev.map((r) =>
              r.id === requestId ? { ...r, status: 'approved' as const } : r
            )
          );
          // Refresh to get updated list
          await fetchRequests();
          return true;
        } else {
          setError(data.error?.message || 'Failed to approve request');
          return false;
        }
      } catch {
        setError('Failed to approve request');
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [spaceId, fetchRequests]
  );

  // Reject a request
  const rejectRequest = React.useCallback(
    async (requestId: string, reason?: string): Promise<boolean> => {
      if (!spaceId) return false;

      setIsActing(true);
      setError(null);

      try {
        const res = await apiClient.patch(`/api/spaces/${spaceId}/join-requests`, {
          requestId,
          action: 'reject',
          rejectionReason: reason,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error?.message || 'Failed to reject request');
          return false;
        }

        const data: ApiResponse<{ message: string }> = await res.json();
        if (data.success) {
          // Remove from list or update status
          setRequests((prev) =>
            prev.map((r) =>
              r.id === requestId ? { ...r, status: 'rejected' as const, rejectionReason: reason } : r
            )
          );
          // Refresh to get updated list
          await fetchRequests();
          return true;
        } else {
          setError(data.error?.message || 'Failed to reject request');
          return false;
        }
      } catch {
        setError('Failed to reject request');
        return false;
      } finally {
        setIsActing(false);
      }
    },
    [spaceId, fetchRequests]
  );

  // Filter by status
  const filterByStatus = React.useCallback((status: 'pending' | 'approved' | 'rejected' | 'all') => {
    setStatusFilter(status);
  }, []);

  // Initial fetch and refetch when filter changes
  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    total,
    isLoading,
    isActing,
    error,
    approveRequest,
    rejectRequest,
    refresh: fetchRequests,
    filterByStatus,
    statusFilter,
  };
}

export default useJoinRequests;
