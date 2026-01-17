/**
 * HIVE Follow Hook
 * Manages follow/unfollow functionality for user profiles
 */

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@hive/auth-logic';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

interface FollowStatus {
  isFollowing: boolean;
  isFollower: boolean;
  isMutual: boolean;
  isSelf: boolean;
  connectionType?: 'friend' | 'following' | 'pending' | 'blocked';
}

interface FollowResult {
  success: boolean;
  type: 'following' | 'friend';
  message: string;
}

interface UseFollowOptions {
  onSuccess?: (result: FollowResult) => void;
  onError?: (error: Error) => void;
}

export function useFollow(targetUserId: string, options?: UseFollowOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOptimisticFollowing, setIsOptimisticFollowing] = useState<boolean | null>(null);

  // Query follow status
  const {
    data: status,
    isLoading,
    error,
    refetch
  } = useQuery<FollowStatus>({
    queryKey: ['follow-status', targetUserId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${targetUserId}/follow`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to check follow status');
      }

      return response.json();
    },
    enabled: !!user && !!targetUserId && targetUserId !== user.uid,
    staleTime: 30000, // 30 seconds
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/profile/${targetUserId}/follow`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to follow user');
      }

      return response.json() as Promise<FollowResult>;
    },
    onMutate: () => {
      // Optimistic update
      setIsOptimisticFollowing(true);
    },
    onSuccess: (result) => {
      setIsOptimisticFollowing(null);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      options?.onSuccess?.(result);
    },
    onError: (error: Error) => {
      setIsOptimisticFollowing(null);
      options?.onError?.(error);
    }
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/profile/${targetUserId}/follow`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unfollow user');
      }

      return response.json();
    },
    onMutate: () => {
      // Optimistic update
      setIsOptimisticFollowing(false);
    },
    onSuccess: () => {
      setIsOptimisticFollowing(null);
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
    },
    onError: (error: Error) => {
      setIsOptimisticFollowing(null);
      options?.onError?.(error);
    }
  });

  // Computed follow state (with optimistic updates)
  const isFollowing = isOptimisticFollowing !== null
    ? isOptimisticFollowing
    : status?.isFollowing ?? false;

  const follow = useCallback(() => {
    if (!user) throw new Error('Not authenticated');
    if (targetUserId === user.uid) throw new Error('Cannot follow yourself');
    return followMutation.mutateAsync();
  }, [user, targetUserId, followMutation]);

  const unfollow = useCallback(() => {
    if (!user) throw new Error('Not authenticated');
    return unfollowMutation.mutateAsync();
  }, [user, unfollowMutation]);

  const toggleFollow = useCallback(() => {
    if (isFollowing) {
      return unfollow();
    } else {
      return follow();
    }
  }, [isFollowing, follow, unfollow]);

  return {
    // Status
    isFollowing,
    isFollower: status?.isFollower ?? false,
    isMutual: status?.isMutual ?? false,
    isSelf: status?.isSelf ?? (user?.uid === targetUserId),
    connectionType: status?.connectionType,

    // Loading states
    isLoading,
    isFollowLoading: followMutation.isPending,
    isUnfollowLoading: unfollowMutation.isPending,
    isActionPending: followMutation.isPending || unfollowMutation.isPending,

    // Errors
    error: error as Error | null,
    followError: followMutation.error as Error | null,
    unfollowError: unfollowMutation.error as Error | null,

    // Actions
    follow,
    unfollow,
    toggleFollow,
    refetch
  };
}

/**
 * Hook for getting follow/follower counts
 */
export function useFollowCounts(userId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${userId}/connections`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch follow counts');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });

  return {
    connectionCount: data?.connectionCount ?? 0,
    friendCount: data?.friendCount ?? 0,
    mutualCount: data?.mutualCount ?? 0,
    isLoading,
    error: error as Error | null,
    refetch
  };
}

/**
 * Hook for getting connection strength with a user
 */
export function useConnectionStrength(targetUserId: string) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['connection-strength', targetUserId],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${targetUserId}/connection-strength`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connection strength');
      }

      return response.json();
    },
    enabled: !!user && !!targetUserId && targetUserId !== user.uid,
    staleTime: 300000, // 5 minutes - strength doesn't change frequently
  });

  return {
    isConnected: data?.isConnected ?? false,
    connectionType: data?.connectionType as 'friend' | 'following' | 'pending' | undefined,
    score: data?.score ?? 0,
    tier: data?.tier as string | undefined,
    tierLabel: data?.tierLabel as string | undefined,
    factors: data?.factors as {
      interactionCount: number;
      sharedSpacesCount: number;
      sharedInterestsCount: number;
      messageCount: number;
      daysSinceConnection: number;
      recentInteractionDays: number;
      mutualConnectionsCount: number;
    } | null,
    isLoading,
    error: error as Error | null,
    refetch
  };
}
