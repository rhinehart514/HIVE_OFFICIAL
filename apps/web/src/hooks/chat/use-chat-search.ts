'use client';

/**
 * Chat Search Hook
 *
 * Provides search functionality for chat messages within a space.
 * Supports filtering by board, author, and date range.
 */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessageData } from './types';

export interface SearchFilters {
  boardId?: string;
  authorId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UseChatSearchOptions {
  spaceId: string;
  enabled?: boolean;
}

export interface UseChatSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: ChatMessageData[];
  totalCount: number;
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  search: (query?: string, filters?: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
}

const SEARCH_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

export function useChatSearch(options: UseChatSearchOptions): UseChatSearchReturn {
  const { spaceId, enabled = true } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatMessageData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});

  const currentOffsetRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (searchQuery?: string, searchFilters?: SearchFilters) => {
      const q = searchQuery ?? query;
      const f = searchFilters ?? filters;

      if (!enabled || !spaceId || !q || q.trim().length < MIN_QUERY_LENGTH) {
        return;
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      setError(null);
      currentOffsetRef.current = 0;

      try {
        const params = new URLSearchParams({
          q: q.trim(),
          limit: SEARCH_LIMIT.toString(),
          offset: '0',
        });

        if (f.boardId) params.set('boardId', f.boardId);
        if (f.authorId) params.set('authorId', f.authorId);
        if (f.startDate) params.set('startDate', f.startDate.toISOString());
        if (f.endDate) params.set('endDate', f.endDate.toISOString());

        const response = await fetch(
          `/api/spaces/${spaceId}/chat/search?${params.toString()}`,
          {
            credentials: 'include',
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error?.message || 'Search failed');
        }

        const data = await response.json();

        setResults(data.messages || []);
        setTotalCount(data.totalCount || 0);
        setHasMore(data.hasMore || false);
        currentOffsetRef.current = data.messages?.length || 0;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsSearching(false);
      }
    },
    [enabled, spaceId, query, filters]
  );

  const loadMore = useCallback(async () => {
    if (!enabled || !spaceId || !query || isSearching || !hasMore) {
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: SEARCH_LIMIT.toString(),
        offset: currentOffsetRef.current.toString(),
      });

      if (filters.boardId) params.set('boardId', filters.boardId);
      if (filters.authorId) params.set('authorId', filters.authorId);
      if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.set('endDate', filters.endDate.toISOString());

      const response = await fetch(
        `/api/spaces/${spaceId}/chat/search?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to load more results');
      }

      const data = await response.json();

      setResults((prev) => [...prev, ...(data.messages || [])]);
      setHasMore(data.hasMore || false);
      currentOffsetRef.current += data.messages?.length || 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsSearching(false);
    }
  }, [enabled, spaceId, query, filters, isSearching, hasMore]);

  const clearSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setHasMore(false);
    setError(null);
    currentOffsetRef.current = 0;
  }, []);

  return {
    query,
    setQuery,
    results,
    totalCount,
    hasMore,
    isSearching,
    error,
    filters,
    setFilters,
    search,
    loadMore,
    clearSearch,
  };
}

export default useChatSearch;
