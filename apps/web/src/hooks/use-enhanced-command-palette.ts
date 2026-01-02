"use client";
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

// Define SearchableItem locally since it might not be exported
interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

interface SearchAPI {
  spaces: (query: string) => Promise<SearchableItem[]>;
  tools: (query: string) => Promise<SearchableItem[]>;
  people: (query: string) => Promise<SearchableItem[]>;
  events: (query: string) => Promise<SearchableItem[]>;
  posts: (query: string) => Promise<SearchableItem[]>;
}

// Real search API implementations
const createRealSearchAPI = (navigate: (url: string) => void): SearchAPI => ({
  // Real spaces search using /api/spaces/search
  spaces: async (query: string): Promise<SearchableItem[]> => {
    try {
      const response = await fetch('/api/spaces/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, limit: 10 }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const spaces = data.spaces || [];

      return spaces.map((space: {
        id: string;
        name: string;
        description?: string;
        memberCount?: number;
        isVerified?: boolean;
        type?: string;
      }) => ({
        id: `space-${space.id}`,
        title: space.name,
        description: space.description || '',
        icon: '🏠',
        category: 'spaces',
        type: 'space' as const,
        keywords: [],
        action: () => navigate(`/spaces/${space.id}`),
        metadata: {
          memberCount: space.memberCount,
          isVerified: space.isVerified,
          spaceType: space.type,
        },
        url: `/spaces/${space.id}`,
      }));
    } catch (error) {
      logger.error('Space search error', { component: 'useEnhancedCommandPalette' }, error instanceof Error ? error : undefined);
      return [];
    }
  },

  // Real tools search using /api/tools/search
  tools: async (query: string): Promise<SearchableItem[]> => {
    try {
      const response = await fetch('/api/tools/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, limit: 10 }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const tools = data.tools || [];

      return tools.map((tool: {
        id: string;
        name: string;
        description?: string;
        category?: string;
        averageRating?: number;
        creator?: { name?: string };
      }) => ({
        id: `tool-${tool.id}`,
        title: tool.name,
        description: tool.description || '',
        icon: '🛠️',
        category: 'tools',
        type: 'tool' as const,
        keywords: [],
        action: () => navigate(`/tools/${tool.id}`),
        metadata: {
          category: tool.category,
          rating: tool.averageRating,
          creator: tool.creator?.name,
        },
        url: `/tools/${tool.id}`,
      }));
    } catch (error) {
      logger.error('Tool search error', { component: 'useEnhancedCommandPalette' }, error instanceof Error ? error : undefined);
      return [];
    }
  },

  // Profile search - no dedicated API, returns empty (users can use profile pages)
  people: async (_query: string): Promise<SearchableItem[]> => {
    // People search not yet implemented - direct users to profile pages
    // Future: implement /api/profile/search endpoint
    return [];
  },

  // Events search - filter from /api/events
  events: async (query: string): Promise<SearchableItem[]> => {
    try {
      const response = await fetch('/api/events?limit=50&upcoming=true', {
        credentials: 'include',
      });

      if (!response.ok) return [];

      const data = await response.json();
      const events = data.events || [];
      const queryLower = query.toLowerCase();

      // Client-side filtering since there's no search endpoint
      const filteredEvents = events.filter((event: {
        title?: string;
        description?: string;
        tags?: string[];
      }) => {
        const titleMatch = event.title?.toLowerCase().includes(queryLower);
        const descMatch = event.description?.toLowerCase().includes(queryLower);
        const tagMatch = event.tags?.some((tag: string) =>
          tag.toLowerCase().includes(queryLower)
        );
        return titleMatch || descMatch || tagMatch;
      }).slice(0, 10);

      return filteredEvents.map((event: {
        id: string;
        title: string;
        description?: string;
        startTime?: string;
        space?: { name?: string };
      }) => ({
        id: `event-${event.id}`,
        title: event.title,
        description: event.description || '',
        icon: '📅',
        category: 'events',
        type: 'event' as const,
        keywords: [],
        action: () => navigate(`/events/${event.id}`),
        metadata: {
          date: event.startTime,
          space: event.space?.name,
        },
        url: `/events/${event.id}`,
      }));
    } catch (error) {
      logger.error('Event search error', { component: 'useEnhancedCommandPalette' }, error instanceof Error ? error : undefined);
      return [];
    }
  },

  // Posts search - not implemented, returns empty
  posts: async (_query: string): Promise<SearchableItem[]> => {
    // Post search not yet implemented
    // Future: implement /api/feed/search endpoint
    return [];
  }
});

export function useEnhancedCommandPalette() {
  const router = useRouter();
  const [searchAPI] = useState(() => createRealSearchAPI((url) => router.push(url)));

  const handleSearch = useCallback(async (
    query: string,
    category?: string
  ): Promise<SearchableItem[]> => {
    if (!query.trim()) return [];

    try {
      const results: SearchableItem[] = [];

      if (!category) {
        // Search all categories in parallel
        const [spaces, tools, events] = await Promise.all([
          searchAPI.spaces(query),
          searchAPI.tools(query),
          searchAPI.events(query),
          // Skip people and posts as they don't have search APIs
        ]);

        results.push(...spaces, ...tools, ...events);
      } else {
        // Search specific category
        switch (category) {
          case 'spaces':
            results.push(...await searchAPI.spaces(query));
            break;
          case 'tools':
            results.push(...await searchAPI.tools(query));
            break;
          case 'people':
            results.push(...await searchAPI.people(query));
            break;
          case 'events':
            results.push(...await searchAPI.events(query));
            break;
          case 'posts':
            results.push(...await searchAPI.posts(query));
            break;
        }
      }

      // Sort by relevance (exact title matches first, then description matches)
      return results.sort((a, b) => {
        const aExactTitle = a.title.toLowerCase() === query.toLowerCase();
        const bExactTitle = b.title.toLowerCase() === query.toLowerCase();
        if (aExactTitle && !bExactTitle) return -1;
        if (!aExactTitle && bExactTitle) return 1;

        const aTitleMatch = a.title.toLowerCase().includes(query.toLowerCase());
        const bTitleMatch = b.title.toLowerCase().includes(query.toLowerCase());
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;

        return 0;
      });

    } catch (error) {
      logger.error('Search error', { component: 'useEnhancedCommandPalette' }, error instanceof Error ? error : undefined);
      return [];
    }
  }, [searchAPI]);

  return {
    handleSearch
  };
}
