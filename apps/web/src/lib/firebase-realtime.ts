/**
 * Firebase Realtime Database Service
 *
 * Provides real-time typing indicators and presence for chat.
 * Uses Firebase Realtime Database for low-latency updates.
 */

import { getDatabase, ref, set, onValue, remove, get } from 'firebase/database';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { logger } from '@/lib/structured-logger';

// Firebase config - uses same project as Firestore
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase app if not already initialized
let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch {
  app = initializeApp(firebaseConfig);
}

// Get Realtime Database instance
let realtimeDb: ReturnType<typeof getDatabase> | null = null;

function getRealtimeDb() {
  if (!realtimeDb) {
    // Only initialize if DATABASE_URL is configured
    if (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
      try {
        realtimeDb = getDatabase(app);
      } catch (error) {
        logger.warn('Firebase Realtime Database not available', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }
  return realtimeDb;
}

export interface TypingIndicator {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  timestamp: number;
  isTyping: boolean;
}

// Typing indicator TTL (8 seconds - must stop typing to clear)
const TYPING_TTL_MS = 8000;

/**
 * Real-time typing indicator service
 */
export const realtimeService = {
  /**
   * Set user's typing status in a space/board
   */
  setTyping: async (
    spaceId: string,
    boardId: string,
    user: Omit<TypingIndicator, 'timestamp'>
  ): Promise<void> => {
    const db = getRealtimeDb();
    if (!db) return; // Silently fail if not configured

    try {
      const typingRef = ref(db, `typing/${spaceId}/${boardId}/${user.userId}`);
      await set(typingRef, {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || null,
        isTyping: user.isTyping,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to set typing indicator', {
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
        boardId,
      });
    }
  },

  /**
   * Clear user's typing status
   */
  clearTyping: async (
    spaceId: string,
    boardId: string,
    userId: string
  ): Promise<void> => {
    const db = getRealtimeDb();
    if (!db) return;

    try {
      const typingRef = ref(db, `typing/${spaceId}/${boardId}/${userId}`);
      await remove(typingRef);
    } catch (error) {
      logger.error('Failed to clear typing indicator', {
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
        boardId,
      });
    }
  },

  /**
   * Subscribe to typing indicators for a board
   */
  subscribeToTyping: (
    spaceId: string,
    boardId: string,
    callback: (users: TypingIndicator[]) => void
  ): (() => void) => {
    const db = getRealtimeDb();
    if (!db) {
      // Return no-op unsubscribe if not configured
      return () => {};
    }

    const typingRef = ref(db, `typing/${spaceId}/${boardId}`);

    const unsubscribe = onValue(typingRef, (snapshot) => {
      const now = Date.now();
      const typingUsers: TypingIndicator[] = [];

      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, Omit<TypingIndicator, 'userId'>>;

        for (const [userId, userData] of Object.entries(data)) {
          // Only include if typing and not stale
          if (userData.isTyping && (now - userData.timestamp) < TYPING_TTL_MS) {
            typingUsers.push({
              userId,
              displayName: userData.displayName,
              avatarUrl: userData.avatarUrl,
              timestamp: userData.timestamp,
              isTyping: userData.isTyping,
            });
          }
        }
      }

      callback(typingUsers);
    });

    return unsubscribe;
  },

  /**
   * Set typing indicator (simplified API for use-chat-typing.ts)
   */
  setBoardTypingIndicator: async (
    spaceId: string,
    boardId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> => {
    const db = getRealtimeDb();
    if (!db) return;

    try {
      const typingRef = ref(db, `typing/${spaceId}/${boardId}/${userId}`);

      if (isTyping) {
        await set(typingRef, {
          isTyping: true,
          timestamp: Date.now(),
        });
      } else {
        await remove(typingRef);
      }
    } catch (error) {
      logger.error('Failed to set board typing indicator', {
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
        boardId,
      });
    }
  },

  /**
   * Listen to board typing indicators (for use-chat-typing.ts)
   */
  listenToBoardTyping: (
    spaceId: string,
    boardId: string,
    callback: (data: Record<string, TypingIndicator>) => void
  ): (() => void) => {
    const db = getRealtimeDb();
    if (!db) {
      callback({});
      return () => {};
    }

    const typingRef = ref(db, `typing/${spaceId}/${boardId}`);

    const unsubscribe = onValue(typingRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Convert to expected format with userId as key
        const result: Record<string, TypingIndicator> = {};
        for (const [userId, userData] of Object.entries(data as Record<string, Omit<TypingIndicator, 'userId'>>)) {
          result[userId] = {
            userId,
            ...userData,
          };
        }
        callback(result);
      } else {
        callback({});
      }
    });

    return unsubscribe;
  },

  /**
   * Clean up stale typing indicators (called periodically)
   */
  cleanupStaleTypingIndicators: async (
    spaceId: string,
    boardId: string
  ): Promise<void> => {
    const db = getRealtimeDb();
    if (!db) return;

    try {
      const typingRef = ref(db, `typing/${spaceId}/${boardId}`);
      const snapshot = await get(typingRef);

      if (snapshot.exists()) {
        const now = Date.now();
        const data = snapshot.val() as Record<string, { timestamp: number }>;

        for (const [userId, userData] of Object.entries(data)) {
          if ((now - userData.timestamp) > TYPING_TTL_MS) {
            const userRef = ref(db, `typing/${spaceId}/${boardId}/${userId}`);
            await remove(userRef);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup stale typing indicators', {
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
        boardId,
      });
    }
  },
};

export { realtimeDb };
