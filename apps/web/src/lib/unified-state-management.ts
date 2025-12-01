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

interface UnifiedState {
  user: User | null;
  feed: unknown[];
  spaces: unknown[];
  tools: unknown[];
  notifications: unknown[];
  realtime: {
    connected: boolean;
    lastUpdate: Date | null;
  };
  setUser: (user: User | null) => void;
  setFeed: (feed: unknown[]) => void;
  setSpaces: (spaces: unknown[]) => void;
  setTools: (tools: unknown[]) => void;
  setNotifications: (notifications: unknown[]) => void;
  setRealtimeConnected: (connected: boolean) => void;
}

export const useUnifiedStore = create<UnifiedState>((set) => ({
  user: null,
  feed: [],
  spaces: [],
  tools: [],
  notifications: [],
  realtime: {
    connected: false,
    lastUpdate: null,
  },
  setUser: (user) => set({ user }),
  setFeed: (feed) => set({ feed }),
  setSpaces: (spaces) => set({ spaces }),
  setTools: (tools) => set({ tools }),
  setNotifications: (notifications) => set({ notifications }),
  setRealtimeConnected: (connected) => set((state) => ({
    realtime: { ...state.realtime, connected, lastUpdate: new Date() }
  })),
}));

// Selector hooks for specific state slices
export const useFeedState = () => useUnifiedStore((state) => state.feed);
export const useSpacesState = () => useUnifiedStore((state) => state.spaces);
export const useToolsState = () => useUnifiedStore((state) => state.tools);
export const useNotificationsState = () => useUnifiedStore((state) => state.notifications);
export const useRealtimeState = () => useUnifiedStore((state) => state.realtime);
