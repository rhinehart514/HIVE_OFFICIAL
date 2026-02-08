/**
 * Unread Count Hook
 *
 * Tracks unread messages per board/space with real-time updates.
 * Persists last-read timestamps to Firestore for cross-device sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@hive/firebase';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';

interface UnreadState {
  count: number;
  lastReadAt: Date | null;
  loading: boolean;
}

interface BoardUnreadCounts {
  [boardId: string]: number;
}

/**
 * Hook to get unread message count for a specific board
 */
export function useUnreadCount(spaceId: string, boardId: string) {
  const { user } = useAuth();
  const [state, setState] = useState<UnreadState>({
    count: 0,
    lastReadAt: null,
    loading: true,
  });

  const lastReadAtRef = useRef<Date | null>(null);

  // Fetch last read timestamp and subscribe to new messages
  useEffect(() => {
    if (!user?.uid || !spaceId || !boardId) {
      setState({ count: 0, lastReadAt: null, loading: false });
      return;
    }

    let messagesUnsubscribe: (() => void) | undefined;

    const initializeUnread = async () => {
      try {
        // Get last read timestamp from userBoardReads collection
        const readRef = doc(db, 'userBoardReads', `${user.uid}_${boardId}`);
        const readDoc = await getDoc(readRef);

        let lastReadAt: Date;
        if (readDoc.exists()) {
          const data = readDoc.data();
          lastReadAt = data.lastReadAt instanceof Timestamp
            ? data.lastReadAt.toDate()
            : new Date(data.lastReadAt || 0);
        } else {
          // First visit - set to 24 hours ago so user sees recent content
          lastReadAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
        }

        lastReadAtRef.current = lastReadAt;
        setState(prev => ({ ...prev, lastReadAt, loading: false }));

        // Subscribe to messages newer than lastReadAt
        const messagesRef = collection(db, 'spaces', spaceId, 'boards', boardId, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('createdAt', '>', Timestamp.fromDate(lastReadAt)),
          orderBy('createdAt', 'desc'),
          limit(100) // Cap for performance
        );

        messagesUnsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            // Filter out user's own messages
            const unreadCount = snapshot.docs.filter(
              (doc) => doc.data().authorId !== user.uid
            ).length;

            setState(prev => ({ ...prev, count: unreadCount }));
          },
          (error) => {
            logger.error('Failed to subscribe to unread messages', {
              error: error.message,
              spaceId,
              boardId,
            });
          }
        );
      } catch (error) {
        logger.error('Failed to initialize unread count', {
          error: error instanceof Error ? error.message : 'Unknown error',
          spaceId,
          boardId,
        });
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeUnread();

    return () => {
      if (messagesUnsubscribe) messagesUnsubscribe();
    };
  }, [user?.uid, spaceId, boardId]);

  /**
   * Mark board as read (call when user views the board)
   */
  const markAsRead = useCallback(async () => {
    if (!user?.uid || !boardId) return;

    const now = new Date();
    try {
      const readRef = doc(db, 'userBoardReads', `${user.uid}_${boardId}`);
      await setDoc(readRef, {
        userId: user.uid,
        boardId,
        spaceId,
        lastReadAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      lastReadAtRef.current = now;
      setState(prev => ({ ...prev, count: 0, lastReadAt: now }));
    } catch (error) {
      logger.error('Failed to mark board as read', {
        error: error instanceof Error ? error.message : 'Unknown error',
        boardId,
      });
    }
  }, [user?.uid, spaceId, boardId]);

  return {
    unreadCount: state.count,
    lastReadAt: state.lastReadAt,
    loading: state.loading,
    hasUnread: state.count > 0,
    markAsRead,
  };
}

/**
 * Hook to get unread counts for multiple boards in a space
 */
export function useSpaceUnreadCounts(spaceId: string, boardIds: string[]) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<BoardUnreadCounts>({});
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!user?.uid || !spaceId || boardIds.length === 0) {
      setCounts({});
      setTotalUnread(0);
      setLoading(false);
      return;
    }

    const fetchAllUnreadCounts = async () => {
      try {
        const newCounts: BoardUnreadCounts = {};
        let total = 0;

        // Fetch read timestamps for all boards
        for (const boardId of boardIds.slice(0, 10)) { // Limit to 10 boards
          const readRef = doc(db, 'userBoardReads', `${user.uid}_${boardId}`);
          const readDoc = await getDoc(readRef);

          let lastReadAt: Date;
          if (readDoc.exists()) {
            const data = readDoc.data();
            lastReadAt = data.lastReadAt instanceof Timestamp
              ? data.lastReadAt.toDate()
              : new Date(data.lastReadAt || 0);
          } else {
            lastReadAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
          }

          // Query unread messages
          const messagesRef = collection(db, 'spaces', spaceId, 'boards', boardId, 'messages');
          const messagesQuery = query(
            messagesRef,
            where('createdAt', '>', Timestamp.fromDate(lastReadAt)),
            where('authorId', '!=', user.uid),
            limit(100)
          );

          // Use getDoc for initial count (cheaper than listener)
          const { getDocs } = await import('firebase/firestore');
          const messagesSnapshot = await getDocs(messagesQuery);
          const count = messagesSnapshot.size;

          newCounts[boardId] = count;
          total += count;
        }

        setCounts(newCounts);
        setTotalUnread(total);
        setLoading(false);
      } catch (error) {
        logger.error('Failed to fetch space unread counts', {
          error: error instanceof Error ? error.message : 'Unknown error',
          spaceId,
        });
        setLoading(false);
      }
    };

    fetchAllUnreadCounts();
  }, [user?.uid, spaceId, boardIds.join(',')]);

  /**
   * Mark all boards in space as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const batch = boardIds.slice(0, 10).map(async (boardId) => {
        const readRef = doc(db, 'userBoardReads', `${user.uid}_${boardId}`);
        return setDoc(readRef, {
          userId: user.uid,
          boardId,
          spaceId,
          lastReadAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      await Promise.all(batch);

      setCounts({});
      setTotalUnread(0);
    } catch (error) {
      logger.error('Failed to mark all boards as read', {
        error: error instanceof Error ? error.message : 'Unknown error',
        spaceId,
      });
    }
  }, [user?.uid, spaceId, boardIds]);

  return {
    counts,
    totalUnread,
    loading,
    hasUnread: totalUnread > 0,
    markAllAsRead,
  };
}

/**
 * Hook to get total unread count across all user's spaces
 */
export function useTotalUnreadCount() {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setTotalUnread(0);
      setLoading(false);
      return;
    }

    // This would ideally use a Cloud Function to aggregate counts
    // For now, we'll just return 0 and let individual space cards fetch their own
    setLoading(false);
  }, [user?.uid]);

  return { totalUnread, loading };
}
