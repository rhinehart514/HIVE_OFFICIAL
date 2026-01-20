/**
 * Unified State Management
 * Placeholder - to be implemented with Zustand
 */

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface FeedItem {
  id: string;
  [key: string]: unknown;
}

interface Space {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Tool {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: string;
  read: boolean;
  [key: string]: unknown;
}

interface UnifiedState {
  user: User | null;
  feed: {
    items: FeedItem[];
    loading: boolean;
    error: string | null;
  };
  spaces: {
    items: Space[];
    activeSpaceId: string | null;
    loading: boolean;
    error: string | null;
  };
  tools: {
    items: Tool[];
    activeToolId: string | null;
    loading: boolean;
    error: string | null;
  };
  notifications: {
    items: Notification[];
    unreadCount: number;
  };
  realtime: {
    connected: boolean;
    websocketConnected: boolean;
    isOnline: boolean;
    lastSyncTime: Date | null;
    syncInProgress: boolean;
  };
  setUser: (user: User | null) => void;
  setFeed: (items: FeedItem[]) => void;
  setFeedLoading: (loading: boolean) => void;
  setFeedError: (error: string | null) => void;
  setSpaces: (items: Space[]) => void;
  setActiveSpace: (spaceId: string | null) => void;
  setSpacesLoading: (loading: boolean) => void;
  setSpacesError: (error: string | null) => void;
  setTools: (items: Tool[]) => void;
  setActiveTool: (toolId: string | null) => void;
  setToolsLoading: (loading: boolean) => void;
  setToolsError: (error: string | null) => void;
  setNotifications: (items: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  setRealtimeConnected: (connected: boolean) => void;
  setWebsocketConnected: (connected: boolean) => void;
  setOnline: (online: boolean) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

export const useUnifiedStore = create<UnifiedState>((set) => ({
  user: null,
  feed: {
    items: [],
    loading: false,
    error: null,
  },
  spaces: {
    items: [],
    activeSpaceId: null,
    loading: false,
    error: null,
  },
  tools: {
    items: [],
    activeToolId: null,
    loading: false,
    error: null,
  },
  notifications: {
    items: [],
    unreadCount: 0,
  },
  realtime: {
    connected: false,
    websocketConnected: false,
    isOnline: true,
    lastSyncTime: null,
    syncInProgress: false,
  },
  setUser: (user) => set({ user }),
  setFeed: (items) => set((state) => ({ feed: { ...state.feed, items } })),
  setFeedLoading: (loading) => set((state) => ({ feed: { ...state.feed, loading } })),
  setFeedError: (error) => set((state) => ({ feed: { ...state.feed, error } })),
  setSpaces: (items) => set((state) => ({ spaces: { ...state.spaces, items } })),
  setActiveSpace: (activeSpaceId) => set((state) => ({ spaces: { ...state.spaces, activeSpaceId } })),
  setSpacesLoading: (loading) => set((state) => ({ spaces: { ...state.spaces, loading } })),
  setSpacesError: (error) => set((state) => ({ spaces: { ...state.spaces, error } })),
  setTools: (items) => set((state) => ({ tools: { ...state.tools, items } })),
  setActiveTool: (activeToolId) => set((state) => ({ tools: { ...state.tools, activeToolId } })),
  setToolsLoading: (loading) => set((state) => ({ tools: { ...state.tools, loading } })),
  setToolsError: (error) => set((state) => ({ tools: { ...state.tools, error } })),
  setNotifications: (items) => set(() => ({
    notifications: { items, unreadCount: items.filter(n => !n.read).length }
  })),
  addNotification: (notification) => set((state) => ({
    notifications: {
      items: [notification, ...state.notifications.items],
      unreadCount: state.notifications.unreadCount + (notification.read ? 0 : 1),
    }
  })),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: {
      items: state.notifications.items.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, state.notifications.unreadCount - 1),
    }
  })),
  removeNotification: (id) => set((state) => {
    const notification = state.notifications.items.find(n => n.id === id);
    return {
      notifications: {
        items: state.notifications.items.filter(n => n.id !== id),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.notifications.unreadCount - 1)
          : state.notifications.unreadCount,
      }
    };
  }),
  setRealtimeConnected: (connected) => set((state) => ({
    realtime: { ...state.realtime, connected, lastSyncTime: new Date() }
  })),
  setWebsocketConnected: (websocketConnected) => set((state) => ({
    realtime: { ...state.realtime, websocketConnected }
  })),
  setOnline: (isOnline) => set((state) => ({
    realtime: { ...state.realtime, isOnline }
  })),
  setSyncInProgress: (syncInProgress) => set((state) => ({
    realtime: { ...state.realtime, syncInProgress }
  })),
}));

// Selector hooks for specific state slices with proper interfaces
export function useFeedState() {
  const feedItems = useUnifiedStore((state) => state.feed.items);
  const loading = useUnifiedStore((state) => state.feed.loading);
  const error = useUnifiedStore((state) => state.feed.error);
  const setFeed = useUnifiedStore((state) => state.setFeed);
  const setFeedLoading = useUnifiedStore((state) => state.setFeedLoading);
  const setFeedError = useUnifiedStore((state) => state.setFeedError);

  const refresh = async (_options?: { force?: boolean }) => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const response = await fetch('/api/feed', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch feed');
      const data = await response.json();
      setFeed(data.items || data.feed || []);
    } catch (err) {
      setFeedError(err instanceof Error ? err.message : 'Failed to fetch feed');
    } finally {
      setFeedLoading(false);
    }
  };

  return { feedItems, loading, error, refresh, setFeed };
}

export function useSpacesState() {
  const spaces = useUnifiedStore((state) => state.spaces.items);
  const loading = useUnifiedStore((state) => state.spaces.loading);
  const error = useUnifiedStore((state) => state.spaces.error);
  const setSpaces = useUnifiedStore((state) => state.setSpaces);
  const setActiveSpace = useUnifiedStore((state) => state.setActiveSpace);
  const setSpacesLoading = useUnifiedStore((state) => state.setSpacesLoading);
  const setSpacesError = useUnifiedStore((state) => state.setSpacesError);

  const refresh = async () => {
    setSpacesLoading(true);
    setSpacesError(null);
    try {
      const response = await fetch('/api/spaces/browse-v2', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch spaces');
      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      setSpacesError(err instanceof Error ? err.message : 'Failed to fetch spaces');
    } finally {
      setSpacesLoading(false);
    }
  };

  return { spaces, loading, error, refresh, setActiveSpace, setSpaces };
}

export function useToolsState() {
  const tools = useUnifiedStore((state) => state.tools.items);
  const loading = useUnifiedStore((state) => state.tools.loading);
  const error = useUnifiedStore((state) => state.tools.error);
  const setTools = useUnifiedStore((state) => state.setTools);
  const setActiveTool = useUnifiedStore((state) => state.setActiveTool);
  const setToolsLoading = useUnifiedStore((state) => state.setToolsLoading);
  const setToolsError = useUnifiedStore((state) => state.setToolsError);

  const refresh = async () => {
    setToolsLoading(true);
    setToolsError(null);
    try {
      const response = await fetch('/api/tools', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      setTools(data.tools || []);
    } catch (err) {
      setToolsError(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setToolsLoading(false);
    }
  };

  return { tools, loading, error, refresh, setActiveTool, setTools };
}

export function useNotificationsState() {
  const notifications = useUnifiedStore((state) => state.notifications.items);
  const unreadCount = useUnifiedStore((state) => state.notifications.unreadCount);
  const addNotification = useUnifiedStore((state) => state.addNotification);
  const markAsRead = useUnifiedStore((state) => state.markNotificationAsRead);
  const removeNotification = useUnifiedStore((state) => state.removeNotification);

  return { notifications, unreadCount, addNotification, markAsRead, removeNotification };
}

export function useRealtimeState() {
  const isOnline = useUnifiedStore((state) => state.realtime.isOnline);
  const websocketConnected = useUnifiedStore((state) => state.realtime.websocketConnected);
  const lastSyncTime = useUnifiedStore((state) => state.realtime.lastSyncTime);
  const syncInProgress = useUnifiedStore((state) => state.realtime.syncInProgress);
  const setSyncInProgress = useUnifiedStore((state) => state.setSyncInProgress);
  const setRealtimeConnected = useUnifiedStore((state) => state.setRealtimeConnected);
  const setFeed = useUnifiedStore((state) => state.setFeed);
  const setSpaces = useUnifiedStore((state) => state.setSpaces);
  const setTools = useUnifiedStore((state) => state.setTools);
  const addNotification = useUnifiedStore((state) => state.addNotification);

  const syncWithServer = async (slices?: string[]) => {
    if (syncInProgress) return;
    setSyncInProgress(true);
    try {
      const syncSlices = slices || ['feed', 'spaces', 'tools'];

      const promises = syncSlices.map(async (slice) => {
        switch (slice) {
          case 'feed': {
            const res = await fetch('/api/feed', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              setFeed(data.items || data.feed || []);
            }
            break;
          }
          case 'spaces': {
            const res = await fetch('/api/spaces/browse-v2', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              setSpaces(data.spaces || []);
            }
            break;
          }
          case 'tools': {
            const res = await fetch('/api/tools', { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              setTools(data.tools || []);
            }
            break;
          }
        }
      });

      await Promise.all(promises);
      setRealtimeConnected(true);
    } catch {
      // Sync failed silently
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleRealtimeUpdate = (update: { type: string; data: unknown }) => {
    if (!update || !update.type) return;

    switch (update.type) {
      case 'notification':
        addNotification(update.data as Notification);
        break;
      case 'feed':
        // Trigger a feed refresh on significant updates
        syncWithServer(['feed']);
        break;
      case 'space':
        syncWithServer(['spaces']);
        break;
      case 'tool':
        syncWithServer(['tools']);
        break;
    }
  };

  return {
    isOnline,
    websocketConnected,
    lastSyncTime,
    syncInProgress,
    syncWithServer,
    handleRealtimeUpdate,
    _syncWithServer: syncWithServer,  // Alias for compatibility
  };
}
