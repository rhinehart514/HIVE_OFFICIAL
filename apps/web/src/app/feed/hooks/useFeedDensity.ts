'use client';

/**
 * useFeedDensity - Persisted density preference for feed layout
 *
 * Stores user preference in localStorage and provides
 * density configuration for components.
 */

import { useState, useEffect, useCallback } from 'react';
import { FEED_DENSITY, type FeedDensity } from '../feed-tokens';

// localStorage key
const STORAGE_KEY = 'feed-density';

// Default density
const DEFAULT_DENSITY: FeedDensity = 'comfortable';

/**
 * Hook for managing feed density preference.
 *
 * @returns Current density, setter, and density config
 */
export function useFeedDensity() {
  const [density, setDensityState] = useState<FeedDensity>(DEFAULT_DENSITY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'compact' || stored === 'comfortable' || stored === 'spacious')) {
        setDensityState(stored as FeedDensity);
      }
    } catch {
      // localStorage unavailable
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage
  const setDensity = useCallback((newDensity: FeedDensity) => {
    setDensityState(newDensity);
    try {
      localStorage.setItem(STORAGE_KEY, newDensity);
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Get current config
  const config = FEED_DENSITY[density];

  return {
    density,
    setDensity,
    config,
    isLoaded,
  };
}

// ============================================
// DENSITY TOGGLE OPTIONS
// ============================================

export interface DensityOption {
  value: FeedDensity;
  label: string;
  icon: string;
  description: string;
}

export const DENSITY_OPTIONS: DensityOption[] = [
  {
    value: 'compact',
    label: 'Compact',
    icon: '▪▪▪',
    description: 'More information, less whitespace',
  },
  {
    value: 'comfortable',
    label: 'Comfortable',
    icon: '▪▪ ',
    description: 'Balanced layout (default)',
  },
  {
    value: 'spacious',
    label: 'Spacious',
    icon: '▪  ',
    description: 'Fewer items, more breathing room',
  },
];
