'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface UseProfileCompletionReturn {
  isLoading: boolean;
  error: string | null;
  profileComplete: boolean;
  percentage: number;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'hive:profile-completion-dismissed';
const DISMISS_DAYS = 7;

/**
 * Hook for profile completion state.
 * Uses the main profile endpoint which returns completionPercentage.
 */
export function useProfileCompletion(): UseProfileCompletionReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [percentage, setPercentage] = useState(100);

  const fetchCompletion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Invalid response');
      }

      setPercentage(json.data.completionPercentage ?? 100);
    } catch (err) {
      logger.error('Failed to fetch profile completion', {
        component: 'useProfileCompletion',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(err instanceof Error ? err.message : 'Failed to load completion status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletion();
  }, [fetchCompletion]);

  return {
    isLoading,
    error,
    profileComplete: percentage >= 100,
    percentage,
    refresh: fetchCompletion,
  };
}

/**
 * Check if completion card was dismissed within cooldown period
 */
export function isCompletionDismissed(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const dismissedAt = localStorage.getItem(CACHE_KEY);
    if (!dismissedAt) return false;

    const dismissedDate = new Date(dismissedAt);
    const now = new Date();
    const daysSinceDismiss = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceDismiss < DISMISS_DAYS;
  } catch {
    return false;
  }
}

/**
 * Dismiss completion card for cooldown period
 */
export function dismissCompletion(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, new Date().toISOString());
  } catch {
    // Ignore localStorage errors
  }
}
