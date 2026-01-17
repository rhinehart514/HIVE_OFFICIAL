/**
 * usePlatformStats - Fetch real-time platform statistics
 *
 * Returns platform stats for landing page display.
 * Gracefully handles loading and error states with fallback values.
 */

'use client';

import { useState, useEffect } from 'react';

interface PlatformStats {
  activeUsers: number;
  totalSpaces: number;
  totalUsers: number;
  recentActivity: {
    type: 'space_created' | 'user_joined' | 'space_joined';
    handle?: string;
    spaceName?: string;
    timestamp: string;
  } | null;
}

interface UsePlatformStatsReturn {
  stats: PlatformStats;
  loading: boolean;
  error: boolean;
}

// Fallback stats while loading or on error
const FALLBACK_STATS: PlatformStats = {
  activeUsers: 0,
  totalSpaces: 0,
  totalUsers: 0,
  recentActivity: null,
};

export function usePlatformStats(): UsePlatformStatsReturn {
  const [stats, setStats] = useState<PlatformStats>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      try {
        const response = await fetch('/api/stats', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }

        const data = await response.json();

        if (mounted && data.success && data.data) {
          setStats(data.data);
          setError(false);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          // Keep fallback stats on error
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, error };
}

/**
 * Format number for display
 * e.g., 1234 -> "1.2K", 12345 -> "12K+"
 */
export function formatStatNumber(num: number): string {
  if (num === 0) return '—';
  if (num < 1000) return String(num);
  if (num < 10000) return `${(num / 1000).toFixed(1)}K`;
  return `${Math.floor(num / 1000)}K+`;
}

/**
 * Format relative time for activity display
 */
export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
