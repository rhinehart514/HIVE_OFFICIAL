'use client';

/**
 * useSpaceVisitTracking - Persistent first visit tracking
 *
 * Replaces sessionStorage with persistent tracking:
 * - localStorage: `hive-space-visits-{userId}` (instant read)
 * - Firestore: `memberships/{userId}/spaces/{spaceId}` (background sync)
 *
 * Logic:
 * - First visit ever: Full ceremony
 * - Return visit (ceremony seen): Abbreviated (0.5s fade)
 * - Ceremony interrupted: Mark incomplete, retry next visit
 *
 * @version 1.0.0 - Initial implementation (Spaces Rebuild)
 */

import * as React from 'react';
import { useAuth } from '@hive/auth-logic';

// ============================================================
// Types
// ============================================================

interface SpaceVisit {
  spaceId: string;
  firstVisitAt: number;
  lastVisitAt: number;
  ceremonySeen: boolean;
}

interface UseSpaceVisitTrackingReturn {
  /** Whether this is the user's first visit to this space */
  isFirstVisit: boolean;
  /** Whether the ceremony has been seen */
  ceremonySeen: boolean;
  /** Whether the visit data is still loading */
  isLoading: boolean;
  /** Mark the ceremony as completed */
  markCeremonySeen: () => void;
  /** Update the last visit time */
  updateLastVisit: () => void;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY_PREFIX = 'hive-space-visits-';

// ============================================================
// Helper Functions
// ============================================================

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadVisitsFromStorage(userId: string): Record<string, SpaceVisit> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function saveVisitsToStorage(userId: string, visits: Record<string, SpaceVisit>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(visits));
  } catch {
    // Storage might be full or unavailable
  }
}

// ============================================================
// Hook
// ============================================================

export function useSpaceVisitTracking(spaceId: string): UseSpaceVisitTrackingReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [visit, setVisit] = React.useState<SpaceVisit | null>(null);

  // Load visit data on mount
  React.useEffect(() => {
    if (!user?.id || !spaceId) {
      setIsLoading(false);
      return;
    }

    const visits = loadVisitsFromStorage(user.id);
    const existingVisit = visits[spaceId];

    if (existingVisit) {
      setVisit(existingVisit);
    } else {
      // First visit - create new record
      const newVisit: SpaceVisit = {
        spaceId,
        firstVisitAt: Date.now(),
        lastVisitAt: Date.now(),
        ceremonySeen: false,
      };
      setVisit(newVisit);

      // Save to localStorage
      visits[spaceId] = newVisit;
      saveVisitsToStorage(user.id, visits);

      // Background sync to Firestore (fire and forget)
      syncVisitToFirestore(user.id, newVisit).catch(() => {
        // Silent fail - localStorage is the source of truth for instant reads
      });
    }

    setIsLoading(false);
  }, [user?.id, spaceId]);

  // Mark ceremony as seen
  const markCeremonySeen = React.useCallback(() => {
    if (!user?.id || !spaceId) return;

    const visits = loadVisitsFromStorage(user.id);
    const updatedVisit: SpaceVisit = {
      ...(visits[spaceId] || {
        spaceId,
        firstVisitAt: Date.now(),
        lastVisitAt: Date.now(),
      }),
      ceremonySeen: true,
      lastVisitAt: Date.now(),
    };

    visits[spaceId] = updatedVisit;
    saveVisitsToStorage(user.id, visits);
    setVisit(updatedVisit);

    // Background sync to Firestore
    syncVisitToFirestore(user.id, updatedVisit).catch(() => {});
  }, [user?.id, spaceId]);

  // Update last visit time
  const updateLastVisit = React.useCallback(() => {
    if (!user?.id || !spaceId) return;

    const visits = loadVisitsFromStorage(user.id);
    const existingVisit = visits[spaceId];

    if (existingVisit) {
      const updatedVisit: SpaceVisit = {
        ...existingVisit,
        lastVisitAt: Date.now(),
      };

      visits[spaceId] = updatedVisit;
      saveVisitsToStorage(user.id, visits);
      setVisit(updatedVisit);

      // Background sync (less important for just timestamp)
      syncVisitToFirestore(user.id, updatedVisit).catch(() => {});
    }
  }, [user?.id, spaceId]);

  return {
    isFirstVisit: !visit || !visit.ceremonySeen,
    ceremonySeen: visit?.ceremonySeen ?? false,
    isLoading,
    markCeremonySeen,
    updateLastVisit,
  };
}

// ============================================================
// Firestore Sync (Background)
// ============================================================

async function syncVisitToFirestore(
  userId: string,
  visit: SpaceVisit
): Promise<void> {
  try {
    await fetch('/api/spaces/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceId: visit.spaceId,
        firstVisitAt: visit.firstVisitAt,
        lastVisitAt: visit.lastVisitAt,
        ceremonySeen: visit.ceremonySeen,
      }),
    });
  } catch {
    // Silent fail - localStorage is source of truth
  }
}

// ============================================================
// Migration Helper
// ============================================================

/**
 * Migrates old sessionStorage-based visits to new localStorage format.
 * Call this once on app init if needed.
 */
export function migrateSessionStorageVisits(userId: string): void {
  if (typeof window === 'undefined') return;

  const existingVisits = loadVisitsFromStorage(userId);
  let migrated = false;

  // Look for old sessionStorage keys
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('visited-')) {
      const spaceHandle = key.replace('visited-', '');

      // Skip if already migrated
      if (!existingVisits[spaceHandle]) {
        existingVisits[spaceHandle] = {
          spaceId: spaceHandle,
          firstVisitAt: Date.now(), // Unknown original time
          lastVisitAt: Date.now(),
          ceremonySeen: true, // They saw something
        };
        migrated = true;
      }

      // Remove old sessionStorage entry
      sessionStorage.removeItem(key);
    }
  }

  if (migrated) {
    saveVisitsToStorage(userId, existingVisits);
  }
}

export default useSpaceVisitTracking;
