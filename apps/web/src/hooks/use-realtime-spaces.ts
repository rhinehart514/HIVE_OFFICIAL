import { useEffect, useState, useCallback, useRef } from 'react';
import { collection, getDocs, query, where, orderBy, limit, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@hive/auth-logic';
import type { Space } from '@hive/core';

interface UseRealtimeSpacesOptions {
  filterType?: string;
  searchQuery?: string;
  limitCount?: number;
}

/**
 * Hook to fetch spaces with filtering and search.
 * Uses one-time reads (getDocs) instead of real-time listeners for cost efficiency.
 * Browsing spaces doesn't need real-time updates - users can refresh manually.
 */
export function useRealtimeSpaces(options: UseRealtimeSpacesOptions = {}) {
  const { filterType = 'all', searchQuery = '', limitCount = 50 } = options;
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchIdRef = useRef(0);

  const fetchSpaces = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const constraints: QueryConstraint[] = [];

      // SECURITY: Campus isolation is MANDATORY
      const campusId = user?.campusId || 'ub-buffalo';
      constraints.push(where('campusId', '==', campusId));
      constraints.push(where('isActive', '==', true));

      // Add type filter
      if (filterType && filterType !== 'all') {
        constraints.push(where('type', '==', filterType));
      }

      // Add search filter (requires composite index)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        constraints.push(
          where('name_lowercase', '>=', searchLower),
          where('name_lowercase', '<=', searchLower + '\uf8ff')
        );
        constraints.push(orderBy('name_lowercase'));
      } else {
        // Default ordering by creation date
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Add limit
      constraints.push(limit(limitCount));

      // Create and execute the query (one-time read)
      const spacesQuery = query(
        collection(db, 'spaces'),
        ...constraints
      );

      const snapshot = await getDocs(spacesQuery);

      // Only update state if this is still the latest fetch
      if (currentFetchId === fetchIdRef.current) {
        const fetchedSpaces = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Space[];

        setSpaces(fetchedSpaces);
        setLoading(false);
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current) {
        setError(err as Error);
        setLoading(false);
      }
    }
  }, [filterType, searchQuery, limitCount, user?.campusId]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  return {
    spaces,
    loading,
    error,
    refetch: fetchSpaces,
    totalCount: spaces.length
  };
}