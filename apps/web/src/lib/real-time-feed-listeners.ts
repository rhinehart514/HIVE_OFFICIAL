/**
 * Real-time Feed Listeners
 *
 * Provides Firestore-based real-time listeners for feed content.
 * Listens to posts and events in user's spaces for instant updates.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@hive/firebase';
import { logger } from '@/lib/logger';

export interface RealtimeFeedItem {
  id: string;
  type: 'post' | 'event' | 'announcement';
  spaceId: string;
  content: {
    title?: string;
    description?: string;
    authorId: string;
    authorName?: string;
    createdAt: Date;
    updatedAt?: Date;
    startTime?: Date;
    endTime?: Date;
    location?: string;
    reactions?: Record<string, number>;
    isImported?: boolean;
    source?: string;
  };
  timestamp: Date;
}

interface FeedManagerState {
  listeners: Unsubscribe[];
  spaceIds: string[];
  lastItems: Map<string, RealtimeFeedItem>;
}

// Cache of feed managers per user
const feedManagers = new Map<string, FeedManagerState>();

/**
 * Get or create a real-time feed manager for a user
 */
export function getRealtimeFeedManager(userId?: string) {
  if (!userId) {
    return {
      subscribe: () => () => {},
      loadInitialFeed: async () => [] as RealtimeFeedItem[],
      loadMore: async () => [] as RealtimeFeedItem[],
      startFeedListeners: async () => {},
      cleanup: () => {},
    };
  }

  // Get or create manager state
  let state = feedManagers.get(userId);
  if (!state) {
    state = {
      listeners: [],
      spaceIds: [],
      lastItems: new Map(),
    };
    feedManagers.set(userId, state);
  }

  return {
    /**
     * Subscribe to a specific callback (legacy API)
     */
    subscribe: () => () => {},

    /**
     * Load initial feed data via API (not real-time)
     */
    loadInitialFeed: async () => [] as RealtimeFeedItem[],

    /**
     * Load more items via API (not real-time)
     */
    loadMore: async () => [] as RealtimeFeedItem[],

    /**
     * Start real-time Firestore listeners for user's spaces
     */
    startFeedListeners: async (
      spaceIds: string[],
      onUpdate: (items: RealtimeFeedItem[], updateType: 'added' | 'modified' | 'removed') => void
    ) => {
      // Clean up existing listeners first
      state!.listeners.forEach((unsub) => unsub());
      state!.listeners = [];
      state!.spaceIds = spaceIds;

      if (spaceIds.length === 0) {
        logger.info('No spaces to listen to for real-time feed');
        return;
      }

      // Limit to max 10 spaces to avoid too many listeners
      const spacesToListen = spaceIds.slice(0, 10);
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      try {
        // Listen to posts in user's spaces
        const postsUnsubscribe = listenToPosts(spacesToListen, thirtyMinutesAgo, onUpdate);
        state!.listeners.push(postsUnsubscribe);

        // Listen to events in user's spaces
        const eventsUnsubscribe = listenToEvents(spacesToListen, thirtyMinutesAgo, onUpdate);
        state!.listeners.push(eventsUnsubscribe);

        // Listen to announcements in user's spaces
        const announcementsUnsubscribe = listenToAnnouncements(spacesToListen, thirtyMinutesAgo, onUpdate);
        state!.listeners.push(announcementsUnsubscribe);

        logger.info('Real-time feed listeners started', {
          userId,
          spaceCount: spacesToListen.length,
        });
      } catch (error) {
        logger.error('Failed to start real-time feed listeners', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
        });
      }
    },

    /**
     * Clean up all listeners
     */
    cleanup: () => {
      state!.listeners.forEach((unsub) => unsub());
      state!.listeners = [];
      state!.lastItems.clear();
    },
  };
}

/**
 * Clean up a specific user's feed manager
 */
export function cleanupRealtimeFeedManager(userId?: string) {
  if (!userId) return;

  const state = feedManagers.get(userId);
  if (state) {
    state.listeners.forEach((unsub) => unsub());
    feedManagers.delete(userId);
    logger.info('Cleaned up real-time feed manager', { userId });
  }
}

// ============================================
// PRIVATE LISTENER HELPERS
// ============================================

/**
 * Listen to posts in spaces (created after cutoff time)
 */
function listenToPosts(
  spaceIds: string[],
  afterTime: Date,
  onUpdate: (items: RealtimeFeedItem[], updateType: 'added' | 'modified' | 'removed') => void
): Unsubscribe {
  // Firestore 'in' queries support max 30 items, but we limit to 10 spaces
  const postsRef = collection(db, 'posts');
  const postsQuery = query(
    postsRef,
    where('spaceId', 'in', spaceIds),
    where('createdAt', '>', Timestamp.fromDate(afterTime)),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const addedItems: RealtimeFeedItem[] = [];
      const modifiedItems: RealtimeFeedItem[] = [];
      const removedItems: RealtimeFeedItem[] = [];

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const item = transformToFeedItem(change.doc.id, data, 'post');

        if (change.type === 'added') {
          addedItems.push(item);
        } else if (change.type === 'modified') {
          modifiedItems.push(item);
        } else if (change.type === 'removed') {
          removedItems.push(item);
        }
      });

      if (addedItems.length > 0) onUpdate(addedItems, 'added');
      if (modifiedItems.length > 0) onUpdate(modifiedItems, 'modified');
      if (removedItems.length > 0) onUpdate(removedItems, 'removed');
    },
    (error) => {
      logger.error('Posts listener error', {
        error: error.message,
      });
    }
  );
}

/**
 * Listen to events in spaces (starting after cutoff time)
 */
function listenToEvents(
  spaceIds: string[],
  afterTime: Date,
  onUpdate: (items: RealtimeFeedItem[], updateType: 'added' | 'modified' | 'removed') => void
): Unsubscribe {
  const eventsRef = collection(db, 'events');
  const eventsQuery = query(
    eventsRef,
    where('spaceId', 'in', spaceIds),
    where('startTime', '>', Timestamp.fromDate(afterTime)),
    orderBy('startTime', 'asc'),
    limit(20)
  );

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const addedItems: RealtimeFeedItem[] = [];
      const modifiedItems: RealtimeFeedItem[] = [];
      const removedItems: RealtimeFeedItem[] = [];

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const item = transformToFeedItem(change.doc.id, data, 'event');

        if (change.type === 'added') {
          addedItems.push(item);
        } else if (change.type === 'modified') {
          modifiedItems.push(item);
        } else if (change.type === 'removed') {
          removedItems.push(item);
        }
      });

      if (addedItems.length > 0) onUpdate(addedItems, 'added');
      if (modifiedItems.length > 0) onUpdate(modifiedItems, 'modified');
      if (removedItems.length > 0) onUpdate(removedItems, 'removed');
    },
    (error) => {
      logger.error('Events listener error', {
        error: error.message,
      });
    }
  );
}

/**
 * Listen to announcements in spaces
 */
function listenToAnnouncements(
  spaceIds: string[],
  afterTime: Date,
  onUpdate: (items: RealtimeFeedItem[], updateType: 'added' | 'modified' | 'removed') => void
): Unsubscribe {
  const announcementsRef = collection(db, 'announcements');
  const announcementsQuery = query(
    announcementsRef,
    where('spaceId', 'in', spaceIds),
    where('createdAt', '>', Timestamp.fromDate(afterTime)),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(
    announcementsQuery,
    (snapshot) => {
      const addedItems: RealtimeFeedItem[] = [];
      const modifiedItems: RealtimeFeedItem[] = [];
      const removedItems: RealtimeFeedItem[] = [];

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const item = transformToFeedItem(change.doc.id, data, 'announcement');

        if (change.type === 'added') {
          addedItems.push(item);
        } else if (change.type === 'modified') {
          modifiedItems.push(item);
        } else if (change.type === 'removed') {
          removedItems.push(item);
        }
      });

      if (addedItems.length > 0) onUpdate(addedItems, 'added');
      if (modifiedItems.length > 0) onUpdate(modifiedItems, 'modified');
      if (removedItems.length > 0) onUpdate(removedItems, 'removed');
    },
    (error) => {
      logger.error('Announcements listener error', {
        error: error.message,
      });
    }
  );
}

/**
 * Transform Firestore document to RealtimeFeedItem
 */
function transformToFeedItem(
  id: string,
  data: Record<string, unknown>,
  type: 'post' | 'event' | 'announcement'
): RealtimeFeedItem {
  const toDate = (value: unknown): Date => {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date();
  };

  return {
    id,
    type,
    spaceId: String(data.spaceId || ''),
    content: {
      title: data.title as string | undefined,
      description: (data.description || data.content) as string | undefined,
      authorId: String(data.authorId || data.createdBy || ''),
      authorName: data.authorName as string | undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
      startTime: data.startTime ? toDate(data.startTime) : undefined,
      endTime: data.endTime ? toDate(data.endTime) : undefined,
      location: data.location as string | undefined,
      reactions: (data.reactions as Record<string, number>) || {},
      isImported: Boolean(data.isImported),
      source: data.source as string | undefined,
    },
    timestamp: toDate(data.createdAt || data.startTime),
  };
}
