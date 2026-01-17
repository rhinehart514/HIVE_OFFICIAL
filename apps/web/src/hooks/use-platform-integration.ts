/**
 * HIVE Platform Integration React Hook
 *
 * Connects React components to the platform integration systems
 * Provides unified access to real-time data, search, and notifications
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUnifiedStore, useFeedState, useSpacesState, useToolsState, useNotificationsState, useRealtimeState } from '@/lib/unified-state-management';
import { getPlatformIntegration, type FeedItem } from '@/lib/platform-integration';
import { getSearchEngine, type SearchResult, type SearchQuery, type SearchOptions, type SearchFilters, searchPlatform } from '@/lib/platform-wide-search';
import { getNotificationManager, type NotificationType } from '@/lib/cross-platform-notifications';
import { logger } from '@/lib/logger';

// ===== MAIN PLATFORM INTEGRATION HOOK =====

export function usePlatformIntegration() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);

  const user = useUnifiedStore(state => state.user);
  const isAuthenticated = !!user;

  // Initialize platform integration when user authenticates
  useEffect(() => {
    if (isAuthenticated && user && !isInitialized) {
      try {
        const _integration = getPlatformIntegration();
        const searchEngine = getSearchEngine();
        const _notificationManager = getNotificationManager();
        const userId = user?.id ?? '';

        // Set search context
        searchEngine.setContext({
          userId,
          currentSlice: 'feed',
          recentSearches: [],
          preferences: {
            defaultSlices: ['spaces', 'tools', 'feed', 'profile'],
            preferredResultTypes: ['space', 'tool', 'post', 'user'],
            maxResults: 20,
            enableAutoComplete: true,
            enableRecentSearches: true,
            saveSearchHistory: true
          }
        });

        setIsInitialized(true);
        setIntegrationError(null);
      } catch (error) {
        logger.error('Failed to initialize platform integration', { component: 'usePlatformIntegration' }, error instanceof Error ? error : undefined);
        setIntegrationError(error instanceof Error ? error.message : 'Initialization failed');
      }
    }
  }, [isAuthenticated, user, isInitialized]);

  return {
    isInitialized,
    error: integrationError,
    user,
    isAuthenticated
  };
}

// ===== UNIFIED FEED HOOK =====

export function useUnifiedFeed(options: {
  limit?: number;
  sources?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
} = {}) {
  const { limit = 20, sources = ['feed', 'spaces', 'tools', 'profile'], autoRefresh = true, refreshInterval = 60000 } = options;
  
  const { feedItems, loading, error, refresh } = useFeedState();
  const { isOnline, _syncWithServer } = useRealtimeState();
  const user = useUnifiedStore(state => state.user);

  // Auto-refresh feed data
  useEffect(() => {
    if (autoRefresh && user) {
      const interval = setInterval(() => {
        if (isOnline) {
          refresh({ force: false });
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, user, refresh, isOnline, refreshInterval]);

  const refreshFeed = useCallback(async (force = false) => {
    if (user) {
      await refresh({ force });
    }
  }, [user, refresh]);

  const getFeedData = useCallback(async (customOptions?: {
    limit?: number;
    sources?: string[];
    [key: string]: unknown;
  }) => {
    if (!user) return [];

    try {
      const integration = getPlatformIntegration();
      const userId = (user as { uid?: string })?.uid ?? '';
      return await integration.getUnifiedFeedData(userId, {
        limit,
        sources,
        ...customOptions
      });
    } catch (error) {
      logger.error('Error getting feed data', { component: 'useFeed' }, error instanceof Error ? error : undefined);
      return [];
    }
  }, [user, limit, sources]);

  return {
    feedItems: feedItems.slice(0, limit),
    loading,
    error,
    refresh: refreshFeed,
    getFeedData,
    isOnline
  };
}

// ===== SPACE INTEGRATION HOOK =====

interface SpaceData {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

interface SpacePost {
  id: string;
  title?: string;
  content?: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  [key: string]: unknown;
}

interface SpaceMember {
  id: string;
  name: string;
  avatar?: string;
  [key: string]: unknown;
}

export function useSpaceIntegration(spaceId: string | null) {
  const { spaces, loading, error, refresh, setActiveSpace } = useSpacesState();
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [spacePosts, setSpacePosts] = useState<SpacePost[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([]);
  
  const user = useUnifiedStore(state => state.user);

  // Set active space
  useEffect(() => {
    if (spaceId) {
      setActiveSpace(spaceId);
    }
  }, [spaceId, setActiveSpace]);

  // Load space data
   
  useEffect(() => {
    if (spaceId && user) {
      loadSpaceData(spaceId);
    }
  }, [spaceId, user]);

  const loadSpaceData = useCallback(async (id: string) => {
    try {
      // Load space details
      const space = spaces.find(s => s.id === id);
      if (space) {
        setSpaceData(space);
      }

      // Load space posts
      const postsResponse = await fetch(`/api/spaces/${id}/posts?limit=20`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setSpacePosts(postsData.posts || []);
      }

      // Load space members
      const membersResponse = await fetch(`/api/spaces/${id}/members?limit=50`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setSpaceMembers(membersData.members || []);
      }
    } catch (error) {
      logger.error('Error loading space data', { component: 'useSpaces' }, error instanceof Error ? error : undefined);
    }
  }, [spaces]);

  const createPost = useCallback(async (postData: {
    title?: string;
    content: string;
    [key: string]: unknown;
  }) => {
    if (!spaceId || !user) return null;

    try {
      const response = await fetch(`/api/spaces/${spaceId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        const newPost = await response.json() as { post: SpacePost };
        setSpacePosts(prev => [newPost.post, ...prev]);
        return newPost.post;
      }
    } catch (error) {
      logger.error('Error creating post', { component: 'useSpaces' }, error instanceof Error ? error : undefined);
    }
    return null;
  }, [spaceId, user]);

  const joinSpace = useCallback(async (id: string) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/spaces/${id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (response.ok) {
        await refresh();
        return true;
      }
    } catch (error) {
      logger.error('Error joining space', { component: 'useSpaces' }, error instanceof Error ? error : undefined);
    }
    return false;
  }, [user, refresh]);

  return {
    spaceData,
    spacePosts,
    spaceMembers,
    loading,
    error,
    refresh: () => refresh(),
    createPost,
    joinSpace,
    reloadSpace: () => spaceId && loadSpaceData(spaceId)
  };
}

// ===== TOOL INTEGRATION HOOK =====

interface ToolData {
  id: string;
  name: string;
  description?: string;
  [key: string]: unknown;
}

interface ToolDeployment {
  id: string;
  toolId: string;
  deployedAt: string;
  [key: string]: unknown;
}

export function useToolIntegration(toolId: string | null) {
  const { tools, loading, error, refresh, setActiveTool } = useToolsState();
  const [toolData, setToolData] = useState<ToolData | null>(null);
  const [toolDeployments, setToolDeployments] = useState<ToolDeployment[]>([]);
  
  const user = useUnifiedStore(state => state.user);

   
  useEffect(() => {
    if (toolId) {
      setActiveTool(toolId);
      loadToolData(toolId);
    }
  }, [toolId, setActiveTool]);

  const loadToolData = useCallback(async (id: string) => {
    try {
      const tool = tools.find(t => t.id === id);
      if (tool) {
        setToolData(tool);
      }

      // Load tool deployments
      const deploymentsResponse = await fetch(`/api/tools/${id}/deployments`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (deploymentsResponse.ok) {
        const deploymentsData = await deploymentsResponse.json();
        setToolDeployments(deploymentsData.deployments || []);
      }
    } catch (error) {
      logger.error('Error loading tool data', { component: 'useTools' }, error instanceof Error ? error : undefined);
    }
  }, [tools]);

  const deployTool = useCallback(async (deploymentData: {
    name?: string;
    config?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    if (!toolId || !user) return null;

    try {
      const response = await fetch(`/api/tools/${toolId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(deploymentData)
      });

      if (response.ok) {
        const deployment = await response.json() as { deployment: ToolDeployment };
        setToolDeployments(prev => [deployment.deployment, ...prev]);
        return deployment.deployment;
      }
    } catch (error) {
      logger.error('Error deploying tool', { component: 'useTools' }, error instanceof Error ? error : undefined);
    }
    return null;
  }, [toolId, user]);

  const shareTool = useCallback(async (shareData: {
    targetUsers?: string[];
    targetSpaces?: string[];
    message?: string;
    [key: string]: unknown;
  }) => {
    if (!toolId || !user) return false;

    try {
      const response = await fetch(`/api/tools/${toolId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(shareData)
      });

      return response.ok;
    } catch (error) {
      logger.error('Error sharing tool', { component: 'useTools' }, error instanceof Error ? error : undefined);
      return false;
    }
  }, [toolId, user]);

  return {
    toolData,
    toolDeployments,
    loading,
    error,
    refresh: () => refresh(),
    deployTool,
    shareTool,
    reloadTool: () => toolId && loadToolData(toolId)
  };
}

// ===== SEARCH INTEGRATION HOOK =====

interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'command';
  category: string;
  metadata?: Record<string, unknown>;
}

export function useSearchIntegration() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: {
    options?: Partial<SearchOptions>;
    filters?: Partial<SearchFilters>;
  }) => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchPlatform(query, options?.options, options?.filters);
      setSearchResults(results);
      return results;
    } catch (error) {
      logger.error('Search error', { component: 'useSearch' }, error instanceof Error ? error : undefined);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getSuggestions = useCallback(async (partial: string) => {
    if (partial.length < 2) {
      setSuggestions([]);
      return [];
    }

    try {
      const engine = getSearchEngine();
      const results = await engine.getSuggestions(partial);
      setSuggestions(results);
      return results;
    } catch (error) {
      logger.error('Suggestions error', { component: 'useSearch' }, error instanceof Error ? error : undefined);
      return [];
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSuggestions([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    suggestions,
    isSearching,
    error: searchError,
    search,
    getSuggestions,
    clearSearch
  };
}

// ===== NOTIFICATION INTEGRATION HOOK =====

export function useNotificationIntegration() {
  const { notifications, unreadCount, addNotification, markAsRead, removeNotification } = useNotificationsState();
  const user = useUnifiedStore(state => state.user);

  const sendNotification = useCallback(async (
    type: NotificationType,
    targetUserId: string,
    data: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      const manager = getNotificationManager();
      await manager.createNotification(type, targetUserId, data);
    } catch (error) {
      logger.error('Error sending notification', { component: 'useNotifications' }, error instanceof Error ? error : undefined);
    }
  }, [user]);

  const updatePreferences = useCallback(async (preferences: {
    enableEmail?: boolean;
    enablePush?: boolean;
    enableInApp?: boolean;
    [key: string]: unknown;
  }) => {
    if (!user) return;

    try {
      const manager = getNotificationManager();
      const userId = (user as { uid?: string })?.uid ?? '';
      await manager.updateUserPreferences(userId, preferences);
    } catch (error) {
      logger.error('Error updating notification preferences', { component: 'useNotifications' }, error instanceof Error ? error : undefined);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    removeNotification,
    sendNotification,
    updatePreferences
  };
}

// ===== REAL-TIME INTEGRATION HOOK =====

export function useRealtimeIntegration() {
  const { isOnline, websocketConnected, lastSyncTime, syncInProgress, syncWithServer, handleRealtimeUpdate } = useRealtimeState();

  const subscribeToUpdates = useCallback(() => {
    const integration = getPlatformIntegration();

    // Wrapper to adapt callback signature from (...args: unknown[]) to { type, data }
    const wrapCallback = (eventType: string) => (...args: unknown[]) => {
      const data = args[0];
      handleRealtimeUpdate({ type: eventType, data });
    };

    const unsubscribers = [
      integration.subscribe('platform_update', wrapCallback('platform_update')),
      integration.subscribe('feed_update', wrapCallback('feed_update')),
      integration.subscribe('space_activity', wrapCallback('space_activity')),
      integration.subscribe('tool_interaction', wrapCallback('tool_interaction')),
      integration.subscribe('notification', wrapCallback('notification'))
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [handleRealtimeUpdate]);

  const forceSync = useCallback(async (slices?: string[]) => {
    await syncWithServer(slices);
  }, [syncWithServer]);

  return {
    isOnline,
    websocketConnected,
    lastSyncTime,
    syncInProgress,
    subscribeToUpdates,
    forceSync
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get Firebase auth token for authenticated API requests
 * SECURITY: Uses real Firebase tokens only - no dev token fallbacks
 */
async function getAuthToken(): Promise<string> {
  if (typeof window === 'undefined') return '';

  try {
    // Try to get real Firebase token
    const { auth } = await import('@/lib/firebase');
    if (auth?.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (error) {
    logger.error('Error getting auth token', { component: 'useRealtime' }, error instanceof Error ? error : undefined);
  }

  return '';
}

// ===== COMBINED HOOK FOR SURFACE COMPONENTS =====

interface SurfaceItem {
  id: string;
  [key: string]: unknown;
}

export function useSurfaceIntegration(surfaceType: 'posts' | 'members' | 'events' | 'tools' | 'chat' | 'pinned', spaceId?: string) {
  const platformIntegration = usePlatformIntegration();
  const _feedIntegration = useUnifiedFeed();
  const spaceIntegration = useSpaceIntegration(spaceId || null);
  const realtimeIntegration = useRealtimeIntegration();

  const [surfaceData, setSurfaceData] = useState<SurfaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSurfaceData = useCallback(async () => {
    if (!spaceId || !platformIntegration.isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      let data = [];

      switch (surfaceType) {
        case 'posts':
          data = spaceIntegration.spacePosts;
          break;
        case 'members':
          data = spaceIntegration.spaceMembers;
          break;
        case 'events': {
          // Load events data
          const eventsResponse = await fetch(`/api/spaces/${spaceId}/events`, {
            headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
          });
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            data = eventsData.events || [];
          }
          break;
        }
        case 'tools': {
          // Load space tools
          const toolsResponse = await fetch(`/api/spaces/${spaceId}/tools`, {
            headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
          });
          if (toolsResponse.ok) {
            const toolsData = await toolsResponse.json();
            data = toolsData.tools || [];
          }
          break;
        }
        // Add more surface types as needed
      }

      setSurfaceData(data);
    } catch (err) {
      logger.error(`Error loading ${surfaceType} data`, { component: 'useSurfaceData', surfaceType }, err instanceof Error ? err : undefined);
      setError(err instanceof Error ? err.message : `Failed to load ${surfaceType}`);
    } finally {
      setLoading(false);
    }
  }, [surfaceType, spaceId, platformIntegration.isInitialized, spaceIntegration.spacePosts, spaceIntegration.spaceMembers]);

  useEffect(() => {
    loadSurfaceData();
  }, [loadSurfaceData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = realtimeIntegration.subscribeToUpdates();
    return unsubscribe;
  }, [realtimeIntegration]);

  return {
    data: surfaceData,
    loading: loading || spaceIntegration.loading,
    error: error || spaceIntegration.error,
    refresh: loadSurfaceData,
    space: spaceIntegration,
    realtime: realtimeIntegration
  };
}
