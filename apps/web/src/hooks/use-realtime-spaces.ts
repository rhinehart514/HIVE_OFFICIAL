import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@hive/auth-logic';
import type { Space } from '@hive/core';

interface UseRealtimeSpacesOptions {
  filterType?: string;
  searchQuery?: string;
  limitCount?: number;
}

export function useRealtimeSpaces(options: UseRealtimeSpacesOptions = {}) {
  const { filterType = 'all', searchQuery = '', limitCount = 50 } = options;
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      // Build query constraints
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

      // Create the query
      const spacesQuery = query(
        collection(db, 'spaces'),
        ...constraints
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        spacesQuery,
        (snapshot) => {
          const updatedSpaces = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Space[];

          setSpaces(updatedSpaces);
          setLoading(false);

          // Log real-time updates
          if (!snapshot.metadata.hasPendingWrites) {
            const changes = snapshot.docChanges();
            changes.forEach(change => {
              if (change.type === 'added') {
                // Space added - no action needed, already in list
              } else if (change.type === 'modified') {
                // Space modified - already updated in list
              } else if (change.type === 'removed') {
                // Space removed - already removed from list
              }
            });
          }
        },
        (err) => {
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup function
      return () => {
        unsubscribe();
      };
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [filterType, searchQuery, limitCount, user?.campusId]);

  const refetch = useCallback(() => {
    // Trigger a re-render by changing a dependency
    setLoading(true);
  }, []);

  return {
    spaces,
    loading,
    error,
    refetch,
    totalCount: spaces.length
  };
}