/**
 * useRecommendations - Hook for personalized space recommendations
 *
 * Fetches recommendations from /api/spaces/recommended endpoint.
 * Uses behavioral psychology algorithm:
 * - Panic Relief: Spaces addressing student anxieties
 * - Where Your Friends Are: Social proof
 * - Insider Access: Exclusive opportunities
 *
 * @version 1.0.0 - Jan 2026
 */

'use client';

import * as React from 'react';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export interface RecommendedSpace {
  id: string;
  name: string;
  slug?: string;
  description: string;
  category: string;
  memberCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  anxietyReliefScore: number;
  socialProofScore: number;
  insiderAccessScore: number;
  recommendationScore: number;
  mutualConnections: number;
  friendsInSpace: number;
  bannerImage?: string;
}

export interface RecommendationsResponse {
  panicRelief: RecommendedSpace[];
  whereYourFriendsAre: RecommendedSpace[];
  insiderAccess: RecommendedSpace[];
  recommendations: RecommendedSpace[];
  meta: {
    totalSpaces: number;
    userConnections: number;
    userFriends: number;
  };
}

export interface UseRecommendationsReturn {
  /** Top recommendation from all categories */
  topRecommendations: RecommendedSpace[];
  /** Spaces addressing student anxieties (academic, career, social) */
  panicRelief: RecommendedSpace[];
  /** Spaces where user's friends are members */
  friendsSpaces: RecommendedSpace[];
  /** Exclusive/invite-only opportunities */
  insiderAccess: RecommendedSpace[];
  /** Whether data is loading */
  loading: boolean;
  /** Whether we have any recommendations */
  hasRecommendations: boolean;
  /** Error if fetch failed */
  error: string | null;
}

// ============================================================
// Hook
// ============================================================

export function useRecommendations(limit: number = 10): UseRecommendationsReturn {
  const [data, setData] = React.useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await secureApiFetch(
          `/api/spaces/recommended?limit=${limit}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          // Non-fatal - recommendations are optional
          logger.debug('Recommendations not available', {
            status: response.status,
            component: 'useRecommendations'
          });
          setData(null);
          return;
        }

        const json = await response.json();

        if (cancelled) return;

        if (json.success && json.data) {
          setData(json.data);
        } else {
          setData(null);
        }
      } catch (err) {
        if (cancelled) return;
        logger.debug('Failed to fetch recommendations', {
          error: err instanceof Error ? err.message : String(err),
          component: 'useRecommendations'
        });
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        setData(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return {
    topRecommendations: data?.recommendations?.slice(0, 6) ?? [],
    panicRelief: data?.panicRelief ?? [],
    friendsSpaces: data?.whereYourFriendsAre ?? [],
    insiderAccess: data?.insiderAccess ?? [],
    loading,
    hasRecommendations: (data?.recommendations?.length ?? 0) > 0,
    error,
  };
}
