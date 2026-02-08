'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

export interface PendingAction {
  id: string;
  type: 'message' | 'reaction' | 'join' | 'leave' | 'vote' | 'generic';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body: unknown;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  /** Context for display (e.g., space name, message preview) */
  context?: {
    label: string;
    spaceId?: string;
    boardId?: string;
  };
}

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnline: Date | null;
  pendingActions: PendingAction[];
  isSyncing: boolean;
  syncProgress: number;
}

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'hive_pending_actions';
const SYNC_CHECK_INTERVAL = 5000; // 5 seconds
const MAX_PENDING_ACTIONS = 100;
const DEFAULT_MAX_RETRIES = 3;

// ============================================================
// Storage Helpers
// ============================================================

function loadPendingActions(): PendingAction[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const actions = JSON.parse(stored) as PendingAction[];
      // Filter out expired actions (older than 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return actions.filter(a => a.createdAt > oneDayAgo);
    }
  } catch {
    logger.warn('Failed to load pending actions', { component: 'useOffline' });
  }

  return [];
}

function savePendingActions(actions: PendingAction[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Keep only the most recent actions
    const trimmed = actions.slice(-MAX_PENDING_ACTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    logger.warn('Failed to save pending actions', { component: 'useOffline' });
  }
}

// ============================================================
// Main Hook
// ============================================================

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnline: null,
    pendingActions: [],
    isSyncing: false,
    syncProgress: 0,
  });

  const syncInProgressRef = useRef(false);

  // Initialize pending actions from storage
  useEffect(() => {
    const actions = loadPendingActions();
    if (actions.length > 0) {
      setState(prev => ({
        ...prev,
        pendingActions: actions,
      }));
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        wasOffline: !prev.isOnline ? true : prev.wasOffline,
        lastOnline: new Date(),
      }));

      logger.info('Connection restored', { component: 'useOffline' });
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
      }));

      logger.warn('Connection lost', { component: 'useOffline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add a pending action
  const addPendingAction = useCallback((
    action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>
  ): string => {
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingAction: PendingAction = {
      ...action,
      id,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || DEFAULT_MAX_RETRIES,
    };

    setState(prev => {
      const newActions = [...prev.pendingActions, pendingAction];
      savePendingActions(newActions);
      return {
        ...prev,
        pendingActions: newActions,
      };
    });

    return id;
  }, []);

  // Remove a pending action
  const removePendingAction = useCallback((id: string) => {
    setState(prev => {
      const newActions = prev.pendingActions.filter(a => a.id !== id);
      savePendingActions(newActions);
      return {
        ...prev,
        pendingActions: newActions,
      };
    });
  }, []);

  // Execute a single action
  const executeAction = useCallback(async (action: PendingAction): Promise<boolean> => {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(action.body),
      });

      if (response.ok) {
        logger.info('Pending action synced', {
          component: 'useOffline',
          actionId: action.id,
          type: action.type,
        });
        return true;
      }

      // Non-retryable error (4xx)
      if (response.status >= 400 && response.status < 500) {
        logger.warn('Pending action failed permanently', {
          component: 'useOffline',
          actionId: action.id,
          status: response.status,
        });
        return true; // Remove from queue anyway
      }

      return false;
    } catch {
      logger.warn('Failed to execute pending action', {
        component: 'useOffline',
        actionId: action.id,
      });
      return false;
    }
  }, []);

  // Sync all pending actions
  const syncPendingActions = useCallback(async () => {
    if (syncInProgressRef.current || state.pendingActions.length === 0 || !state.isOnline) {
      return;
    }

    syncInProgressRef.current = true;
    setState(prev => ({ ...prev, isSyncing: true, syncProgress: 0 }));

    const actionsToProcess = [...state.pendingActions];
    const successfulIds: string[] = [];
    const failedActions: PendingAction[] = [];

    for (let i = 0; i < actionsToProcess.length; i++) {
      const action = actionsToProcess[i];
      const success = await executeAction(action);

      if (success) {
        successfulIds.push(action.id);
      } else if (action.retryCount < action.maxRetries) {
        failedActions.push({
          ...action,
          retryCount: action.retryCount + 1,
        });
      } else {
        // Max retries reached, log and discard
        logger.error('Pending action failed after max retries', {
          component: 'useOffline',
          actionId: action.id,
          type: action.type,
        });
      }

      // Update progress
      setState(prev => ({
        ...prev,
        syncProgress: Math.round(((i + 1) / actionsToProcess.length) * 100),
      }));
    }

    // Update state with remaining failed actions
    setState(prev => {
      const newActions = failedActions;
      savePendingActions(newActions);
      return {
        ...prev,
        pendingActions: newActions,
        isSyncing: false,
        syncProgress: 100,
        wasOffline: newActions.length === 0 ? false : prev.wasOffline,
      };
    });

    syncInProgressRef.current = false;
  }, [state.pendingActions, state.isOnline, executeAction]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.pendingActions.length > 0 && !state.isSyncing) {
      // Small delay to let network stabilize
      const timer = setTimeout(syncPendingActions, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.isOnline, state.pendingActions.length, state.isSyncing, syncPendingActions]);

  // Periodic sync check
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isOnline && state.pendingActions.length > 0 && !state.isSyncing) {
        syncPendingActions();
      }
    }, SYNC_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isOnline, state.pendingActions.length, state.isSyncing, syncPendingActions]);

  // Clear wasOffline flag after some time
  useEffect(() => {
    if (state.wasOffline && state.isOnline && state.pendingActions.length === 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, wasOffline: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.wasOffline, state.isOnline, state.pendingActions.length]);

  // Helper to queue an action and handle offline gracefully
  const queueAction = useCallback(
    async function queueActionFn<T>(
      action: Omit<PendingAction, 'id' | 'createdAt' | 'retryCount'>,
      onlineHandler: () => Promise<T>
    ): Promise<T | null> {
      if (state.isOnline) {
        try {
          return await onlineHandler();
        } catch (error) {
          // If network error, queue the action
          const err = error as Error;
          if (err.name === 'TypeError' || err.message?.includes('network')) {
            addPendingAction(action);
            return null;
          }
          throw error;
        }
      }

      // Offline - queue the action
      addPendingAction(action);
      return null;
    },
    [state.isOnline, addPendingAction]
  );

  return {
    ...state,
    addPendingAction,
    removePendingAction,
    syncPendingActions,
    queueAction,
    hasPendingActions: state.pendingActions.length > 0,
  };
}

// ============================================================
// Specialized Hooks
// ============================================================

/**
 * Hook for offline-capable chat messages
 */
export function useOfflineChat(spaceId: string, boardId: string) {
  const offline = useOffline();

  const queueMessage = useCallback((content: string, _userId: string) => {
    return offline.queueAction(
      {
        type: 'message',
        endpoint: `/api/spaces/${spaceId}/chat`,
        method: 'POST',
        body: { content, boardId },
        maxRetries: 5,
        context: {
          label: `Message: "${content.slice(0, 30)}${content.length > 30 ? '...' : ''}"`,
          spaceId,
          boardId,
        },
      },
      async () => {
        const response = await fetch(`/api/spaces/${spaceId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content, boardId }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
      }
    );
  }, [spaceId, boardId, offline]);

  return {
    ...offline,
    queueMessage,
  };
}

/**
 * Hook for offline-capable reactions
 */
export function useOfflineReactions() {
  const offline = useOffline();

  const queueReaction = useCallback((
    targetType: 'message' | 'post',
    targetId: string,
    emoji: string,
    spaceId?: string
  ) => {
    const endpoint = targetType === 'message'
      ? `/api/spaces/${spaceId}/chat/${targetId}/reactions`
      : `/api/posts/${targetId}/reactions`;

    return offline.queueAction(
      {
        type: 'reaction',
        endpoint,
        method: 'POST',
        body: { emoji },
        maxRetries: 3,
        context: {
          label: `Reaction: ${emoji}`,
          spaceId,
        },
      },
      async () => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ emoji }),
        });
        if (!response.ok) throw new Error('Failed to add reaction');
        return response.json();
      }
    );
  }, [offline]);

  return {
    ...offline,
    queueReaction,
  };
}

// ============================================================
// Context Provider (Optional)
// ============================================================

import { createContext, useContext, type ReactNode } from 'react';

const OfflineContext = createContext<ReturnType<typeof useOffline> | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const offline = useOffline();

  return (
    <OfflineContext.Provider value={offline}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineContext must be used within an OfflineProvider');
  }
  return context;
}

export default useOffline;
