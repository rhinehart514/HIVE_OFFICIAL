'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface CompletionData {
  isComplete: boolean;
  entryComplete: boolean;
  profileComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  missingRequired: string[];
  missingRecommended: string[];
  completedFields: string[];
  requiredFields: readonly string[];
  recommendedFields: readonly string[];
  optionalFields: readonly string[];
  nextSteps: string[];
}

interface UseProfileCompletionReturn {
  isLoading: boolean;
  error: string | null;
  entryComplete: boolean;
  profileComplete: boolean;
  percentage: number;
  missingRequired: string[];
  missingRecommended: string[];
  nextSteps: string[];
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'hive:profile-completion-dismissed';
const DISMISS_DAYS = 7;

/**
 * Hook for profile completion state
 * Fetches from /api/profile/completion
 */
export function useProfileCompletion(): UseProfileCompletionReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CompletionData | null>(null);

  const fetchCompletion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile/completion', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile completion');
      }

      const json = await response.json();
      if (!json.success || !json.completion) {
        throw new Error(json.error || 'Invalid response');
      }

      setData(json.completion);
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
    entryComplete: data?.entryComplete ?? true,
    profileComplete: data?.profileComplete ?? true,
    percentage: data?.completionPercentage ?? 100,
    missingRequired: data?.missingRequired ?? [],
    missingRecommended: data?.missingRecommended ?? [],
    nextSteps: data?.nextSteps ?? [],
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

/**
 * Clear dismissal (for testing)
 */
export function clearCompletionDismissal(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
