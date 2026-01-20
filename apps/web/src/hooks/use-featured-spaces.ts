/**
 * useFeaturedSpaces - Fetch featured spaces for landing page org ticker
 *
 * Returns a list of top spaces for social proof display.
 * Used on landing page to show "Already here: [orgs]"
 */

'use client';

import { useState, useEffect } from 'react';

export interface FeaturedSpace {
  id: string;
  name: string;
  iconURL?: string;
  memberCount: number;
  category?: string;
}

interface UseFeaturedSpacesReturn {
  spaces: FeaturedSpace[];
  loading: boolean;
}

export function useFeaturedSpaces(limit = 20): UseFeaturedSpacesReturn {
  const [spaces, setSpaces] = useState<FeaturedSpace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSpaces() {
      try {
        const response = await fetch(`/api/spaces/browse-v2?limit=${limit}&sort=trending`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch spaces: ${response.status}`);
        }

        const data = await response.json();
        const spacesData = data?.data?.spaces || data?.spaces || [];

        if (mounted) {
          setSpaces(
            spacesData.map((s: Record<string, unknown>) => ({
              id: s.id as string,
              name: s.name as string,
              iconURL: s.iconURL as string | undefined,
              memberCount: (s.memberCount as number) || 0,
              category: s.category as string | undefined,
            }))
          );
        }
      } catch {
        // Silently fail - landing page should still work without org ticker
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSpaces();

    return () => {
      mounted = false;
    };
  }, [limit]);

  return { spaces, loading };
}
