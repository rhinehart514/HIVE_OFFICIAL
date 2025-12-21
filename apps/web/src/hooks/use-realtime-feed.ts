"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@hive/auth-logic';
import { getRealtimeFeedManager, type RealtimeFeedItem, cleanupRealtimeFeedManager } from '@/lib/real-time-feed-listeners';

export interface FeedOptions {
  limit?: number;
  spaceId?: string;
  userId?: string;
  sortBy?: 'recent' | 'popular' | 'relevance';
  types?: string[];
  enableRealtime?: boolean; // New option to control real-time mode
}

export interface Post {
  id: string;
  type: string;
  title: string;
  content?: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  createdAt: Date;
  updatedAt?: Date;
  spaceId?: string;
  reactions?: Record<string, number>;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    hasLiked: boolean;
    hasBookmarked: boolean;
  };
  isImported?: boolean;
  source?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
}

interface RealtimeFeedState {
  posts: Post[];
  realtimeItems: RealtimeFeedItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  liveUpdatesCount: number;
}

/**
 * Enhanced feed hook with real-time Firebase listeners
 * Combines traditional pagination with instant live updates
 */
export function useRealtimeFeed(options: FeedOptions = {}) {
  const { user, getAuthToken } = useAuth();
  const [feedState, setFeedState] = useState<RealtimeFeedState>({
    posts: [],
    realtimeItems: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    lastUpdated: null,
    connectionStatus: 'disconnected',
    liveUpdatesCount: 0
  });

  const feedManagerRef = useRef<ReturnType<typeof getRealtimeFeedManager> | null>(null);
  const userSpaceIdsRef = useRef<string[]>([]);
  const enableRealtime = options.enableRealtime !== false; // Default to true

  // MEMORY LEAK FIX: Track initialization to prevent duplicate loads
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get user's space memberships for real-time listeners
  const fetchUserSpaces = useCallback(async (): Promise<string[]> => {
    if (!user || !getAuthToken) return [];

    try {
      const authToken = await getAuthToken();
      const response = await fetch('/api/user/spaces', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.spaces?.map((s: { id: string }) => s.id) || [];
    } catch {
      return [];
    }
  }, [user, getAuthToken]);

  // Load initial feed data (traditional API call)
  // MEMORY LEAK FIX: Use ref for current posts length to avoid dependency issues
  const postsLengthRef = useRef(0);
  postsLengthRef.current = feedState.posts.length;

  const loadInitialFeed = useCallback(async (reset = false) => {
    if (!user) return;

    // MEMORY LEAK FIX: Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const isInitialLoad = reset || postsLengthRef.current === 0;
    setFeedState(prev => ({
      ...prev,
      isLoading: isInitialLoad,
      isLoadingMore: !isInitialLoad,
      error: null,
      connectionStatus: 'connecting'
    }));

    try {
      const params = new URLSearchParams({
        limit: String(options.limit || 20),
        ...(options.spaceId && { spaceId: options.spaceId }),
        ...(options.userId && { userId: options.userId }),
        ...(options.sortBy && { sortBy: options.sortBy }),
        ...(options.types && { types: options.types.join(',') }),
        ...(!reset && { offset: String(postsLengthRef.current) }),
      });

      const authToken = getAuthToken ? await getAuthToken() : '';
      const response = await fetch(`/api/feed?${params}`, {
        signal, // MEMORY LEAK FIX: Pass abort signal
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      // MEMORY LEAK FIX: Check if component is still mounted
      if (!isMountedRef.current) return;

      if (!response.ok) {
        throw new Error(`Feed load failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load feed');
      }

      const posts = Array.isArray(data.posts) ? data.posts : [];

      // Transform posts to match interface
      const transformedPosts: Post[] = posts.map((post: { content?: Record<string, unknown>; contentType?: string; id?: string; timestamp?: string; spaceId?: string; engagement?: Record<string, unknown>; userInteractions?: Record<string, unknown>; source?: string }) => ({
        id: post.content?.id || post.id,
        type: post.content?.type || post.contentType || 'post',
        title: post.content?.title || 'Untitled',
        content: post.content?.content,
        description: post.content?.description,
        authorId: post.content?.authorId,
        authorName: post.content?.authorName,
        createdAt: new Date(post.content?.createdAt as string | number | undefined || post.timestamp || Date.now()),
        updatedAt: post.content?.updatedAt ? new Date(post.content.updatedAt as string | number) : undefined,
        spaceId: post.spaceId,
        reactions: post.content?.reactions || {},
        engagement: {
          likes: post.engagement?.likes || 0,
          comments: post.engagement?.comments || 0,
          shares: post.engagement?.shares || 0,
          views: post.engagement?.views || 0,
          hasLiked: post.userInteractions?.hasLiked || false,
          hasBookmarked: post.userInteractions?.hasBookmarked || false,
        },
        isImported: post.content?.isImported || false,
        source: post.content?.source || post.source,
        // Event-specific fields
        startTime: post.content?.startTime ? new Date(post.content.startTime as string | number) : undefined,
        endTime: post.content?.endTime ? new Date(post.content.endTime as string | number) : undefined,
        location: post.content?.location
      }));

      // MEMORY LEAK FIX: Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      setFeedState(prev => ({
        ...prev,
        posts: reset ? transformedPosts : [...prev.posts, ...transformedPosts],
        isLoading: false,
        isLoadingMore: false,
        hasMore: transformedPosts.length === (options.limit || 20),
        lastUpdated: new Date(),
        connectionStatus: 'connected'
      }));

      // Return true to indicate success (realtime listeners started separately)
      return true;

    } catch (error) {
      // MEMORY LEAK FIX: Ignore abort errors and check mount status
      if (error instanceof Error && error.name === 'AbortError') return false;
      if (!isMountedRef.current) return false;

      setFeedState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: error instanceof Error ? error.message : 'Failed to load feed',
        connectionStatus: 'disconnected'
      }));
      return false;
    }
  }, [user, getAuthToken, options.limit, options.spaceId, options.userId, options.sortBy, options.types]);

  // Start real-time listeners
  const startRealtimeListeners = useCallback(async () => {
    if (!user || !enableRealtime || !isMountedRef.current) return;

    try {
      // Get user's spaces for targeted listening
      const spaceIds = await fetchUserSpaces();

      // MEMORY LEAK FIX: Check mount status after async operation
      if (!isMountedRef.current) return;

      userSpaceIdsRef.current = spaceIds;

      // Initialize real-time manager
      feedManagerRef.current = getRealtimeFeedManager(user.id);

      // Real-time callback to handle new items
      // MEMORY LEAK FIX: Check mount status in callback
      const handleRealtimeUpdate = (items: RealtimeFeedItem[], updateType: 'added' | 'modified' | 'removed') => {
        if (!isMountedRef.current) return;

        if (updateType === 'added' && items.length > 0) {
          setFeedState(prev => ({
            ...prev,
            realtimeItems: [...items, ...prev.realtimeItems.slice(0, 19)], // Keep last 20
            liveUpdatesCount: prev.liveUpdatesCount + items.length,
            connectionStatus: 'connected',
            lastUpdated: new Date()
          }));
        }
      };

      // Start listening
      await feedManagerRef.current.startFeedListeners(spaceIds, handleRealtimeUpdate);

      setFeedState(prev => ({
        ...prev,
        connectionStatus: 'connected'
      }));

    } catch {
      setFeedState(prev => ({
        ...prev,
        connectionStatus: 'disconnected'
      }));
    }
     
  }, [user, enableRealtime, fetchUserSpaces]);

  // Merge real-time items into main feed
  const mergeRealtimeItems = useCallback(() => {
    setFeedState(prev => {
      if (prev.realtimeItems.length === 0) return prev;

      // Convert real-time items to Post format
      const newPosts: Post[] = prev.realtimeItems.map(item => {
        const content = item.content as Record<string, unknown> | undefined;
        return {
          id: String(item.id || ''),
          type: String(item.type || 'post'),
          title: String(content?.title || 'Untitled'),
          content: content?.description as string | undefined,
          description: content?.description as string | undefined,
          authorId: content?.authorId as string | undefined,
          authorName: content?.authorName as string | undefined,
          createdAt: content?.createdAt instanceof Date ? content.createdAt : new Date(content?.createdAt as string | number || Date.now()),
          updatedAt: content?.createdAt instanceof Date ? content.createdAt : new Date(content?.createdAt as string | number || Date.now()),
          spaceId: item.spaceId as string | undefined,
          reactions: (content?.reactions as Record<string, number>) || {},
          engagement: {
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
            hasLiked: false,
            hasBookmarked: false,
          },
          isImported: Boolean(content?.isImported),
          source: content?.source as string | undefined,
          // Event fields
          startTime: content?.startTime ? new Date(content.startTime as string | number) : undefined,
          endTime: content?.endTime ? new Date(content.endTime as string | number) : undefined,
          location: content?.location as string | undefined
        };
      });

      // Deduplicate and sort by timestamp
      const allPosts = [...newPosts, ...prev.posts];
      const uniquePosts = allPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.id === post.id)
      );

      uniquePosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        ...prev,
        posts: uniquePosts,
        realtimeItems: [], // Clear merged items
        liveUpdatesCount: 0
      };
    });
  }, []);

  // MEMORY LEAK FIX: Track user ID for cleanup
  const userIdRef = useRef<string | null>(null);

  // Initialize feed on mount - MEMORY LEAK FIX: Stable initialization
  useEffect(() => {
    isMountedRef.current = true;

    const initializeFeed = async () => {
      if (user && !isInitializedRef.current) {
        isInitializedRef.current = true;
        userIdRef.current = user.id;
        const success = await loadInitialFeed(true);

        // Start realtime listeners after successful initial load
        if (success && enableRealtime && !feedManagerRef.current && isMountedRef.current) {
          await startRealtimeListeners();
        }
      } else if (!user) {
        isInitializedRef.current = false;
        setFeedState({
          posts: [],
          realtimeItems: [],
          isLoading: false,
          isLoadingMore: false,
          error: null,
          hasMore: true,
          lastUpdated: null,
          connectionStatus: 'disconnected',
          liveUpdatesCount: 0
        });
      }
    };

    initializeFeed();

    // MEMORY LEAK FIX: Comprehensive cleanup on unmount or user change
    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;

      // Cancel pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Cleanup realtime manager
      if (feedManagerRef.current && userIdRef.current) {
        cleanupRealtimeFeedManager(userIdRef.current);
        feedManagerRef.current = null;
      }
    };
  }, [user?.id, loadInitialFeed, enableRealtime, startRealtimeListeners]);

  // Load more posts (traditional pagination)
  const loadMore = useCallback(() => {
    if (!feedState.isLoadingMore && feedState.hasMore) {
      loadInitialFeed(false);
    }
  }, [loadInitialFeed, feedState.isLoadingMore, feedState.hasMore]);

  // Refresh feed
  const refresh = useCallback(() => {
    loadInitialFeed(true);
  }, [loadInitialFeed]);

  // Create a post
  const createPost = useCallback(async (postData: {
    content: string;
    spaceId?: string;
    type?: string;
  }) => {
    if (!user || !getAuthToken) return false;

    try {
      const authToken = await getAuthToken();
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // The real-time listener will automatically pick up the new post
      return true;
    } catch {
      return false;
    }
  }, [user, getAuthToken]);

  return {
    // State
    posts: feedState.posts,
    realtimeItems: feedState.realtimeItems,
    isLoading: feedState.isLoading,
    isLoadingMore: feedState.isLoadingMore,
    error: feedState.error,
    hasMore: feedState.hasMore,
    lastUpdated: feedState.lastUpdated,

    // Real-time specific
    connectionStatus: feedState.connectionStatus,
    hasLiveUpdates: feedState.liveUpdatesCount > 0,
    liveUpdatesCount: feedState.liveUpdatesCount,
    isRealtime: enableRealtime && feedManagerRef.current !== null,

    // Actions
    loadMore,
    refresh,
    createPost,
    mergeRealtimeItems,

    // Computed
    allItems: [...feedState.realtimeItems, ...feedState.posts],
    isEmpty: feedState.posts.length === 0 && feedState.realtimeItems.length === 0,
    isConnected: feedState.connectionStatus === 'connected'
  };
}