/**
 * Real-time Presence System
 * Tracks online/offline status using Firebase
 */

import { useEffect, useState, useRef } from 'react';
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@hive/firebase';
import { useAuth } from '@hive/auth-logic';
import { logger } from '@/lib/logger';

// TTL for presence data: 90 minutes in milliseconds
const PRESENCE_TTL_MS = 90 * 60 * 1000;
// Consider stale after 5 minutes without heartbeat
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  lastHeartbeat: Date;
  expiresAt: Date;
  campusId: string;
  deviceInfo?: {
    browser?: string;
    platform?: string;
  };
}

interface OnlineUser {
  userId: string;
  handle: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away';
  lastSeen: Date;
}

/**
 * Hook to track user's presence status
 */
export function usePresence() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const _presenceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!user?.uid) return;

    if (!user.campusId) return;

    const campusId = user.campusId;
    const userPresenceRef = doc(db, 'presence', user.uid);

    // Function to update presence
    const updatePresence = async (status: 'online' | 'away' | 'offline') => {
      try {
        // Calculate expiration time (90 minutes from now)
        const expiresAt = new Date(Date.now() + PRESENCE_TTL_MS);

        await setDoc(userPresenceRef, {
          userId: user.uid,
          status,
          lastSeen: serverTimestamp(),
          lastHeartbeat: serverTimestamp(),
          expiresAt,
          campusId,
          deviceInfo: {
            browser: navigator.userAgent,
            platform: navigator.platform
          }
        }, { merge: true });
      } catch (error) {
        logger.error('Failed to update presence', { error: { error: error instanceof Error ? error.message : String(error) } });
      }
    };

    // Set user as online
    updatePresence('online');
    setIsOnline(true);

    // Handle page visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updatePresence('online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      updatePresence('offline');
    };

    // Handle page close/navigation (more reliable than React cleanup)
    // These fire when tab closes, page navigates, or browser closes
    const handleBeforeUnload = () => {
      // Fire-and-forget Firestore update on page unload
      // Note: This may not always complete, but combined with TTL + stale filtering,
      // the presence will eventually be cleaned up
      updatePresence('offline');
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // pagehide fires on mobile when app is backgrounded
      // persisted = true means page might be restored (bfcache)
      if (!event.persisted) {
        updatePresence('offline');
      } else {
        // Page is being cached, mark as away instead of offline
        updatePresence('away');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    const heartbeatInterval = setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        updatePresence('online');
      }
    }, 60000);

    // Cleanup (React unmount)
    return () => {
      updatePresence('offline');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      clearInterval(heartbeatInterval);
    };
  }, [user?.uid, user?.campusId]);

  return { isOnline };
}

/**
 * Hook to get online users in a space or campus
 * Uses batch fetching to avoid N+1 queries
 */
export function useOnlineUsers(spaceId?: string) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.campusId) {
      setOnlineUsers([]);
      setLoading(false);
      return;
    }

    const campusId = user.campusId;
    const constraints = [
      where('campusId', '==', campusId),
      where('status', 'in', ['online', 'away'])
    ];

    if (spaceId) {
      // For space-specific presence, we'd need to track that separately
      // For now, just get campus-wide presence
    }

    const presenceRef = collection(db, 'presence');
    const q = query(presenceRef, ...constraints);

    // Subscribe to online users
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // Collect all user IDs from presence docs, filtering stale entries
        const presenceMap = new Map<string, PresenceData>();
        const now = Date.now();

        snapshot.docs.forEach((doc) => {
          const presence = doc.data() as PresenceData;

          const heartbeatField = presence.lastHeartbeat || presence.lastSeen;
          let heartbeatTime: number;
          if (heartbeatField && typeof heartbeatField === 'object' && 'toMillis' in heartbeatField) {
            heartbeatTime = (heartbeatField as { toMillis: () => number }).toMillis();
          } else if (heartbeatField instanceof Date) {
            heartbeatTime = heartbeatField.getTime();
          } else {
            return;
          }

          if (now - heartbeatTime > STALE_THRESHOLD_MS) {
            return;
          }

          presenceMap.set(presence.userId, presence);
        });

        const userIds = Array.from(presenceMap.keys());

        if (userIds.length === 0) {
          setOnlineUsers([]);
          setLoading(false);
          return;
        }

        // Batch fetch user profiles (max 30 per query due to 'in' limit)
        const users: OnlineUser[] = [];
        const BATCH_SIZE = 30;

        try {
          for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);
            const userDocs = await getDocs(
              query(
                collection(db, 'users'),
                where('__name__', 'in', batch)
              )
            );

            userDocs.docs.forEach((userDoc) => {
              const userData = userDoc.data();
              const presence = presenceMap.get(userDoc.id);
              if (presence) {
                users.push({
                  userId: userDoc.id,
                  handle: userData.handle || 'unknown',
                  name: userData.name || 'Anonymous',
                  avatar: userData.avatar,
                  status: presence.status as 'online' | 'away',
                  lastSeen: presence.lastSeen instanceof Date
                    ? presence.lastSeen
                    : new Date()
                });
              }
            });
          }
        } catch (error) {
          logger.error('Failed to batch fetch user data', { error: { error: error instanceof Error ? error.message : String(error) } });
        }

        setOnlineUsers(users);
        setLoading(false);
      },
      (error) => {
        logger.error('Failed to subscribe to online users', { error: { error: error instanceof Error ? error.message : String(error) } });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [spaceId, user?.campusId]);

  return { onlineUsers, loading };
}

/**
 * Hook to track typing indicators in a space/chat
 */
export function useTypingIndicator(contextId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!contextId) return;

    const typingRef = collection(db, 'typing', contextId, 'users');

    // Subscribe to typing indicators
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const typing: string[] = [];
      const now = Date.now();

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only show if typed within last 3 seconds
        if (data.timestamp && (now - data.timestamp.toMillis()) < 3000) {
          if (doc.id !== user?.uid) {
            typing.push(doc.id);
          }
        }
      });

      setTypingUsers(typing);
    });

    return () => unsubscribe();
  }, [contextId, user?.uid]);

  // Function to indicate current user is typing
  const setTyping = async (isTyping: boolean) => {
    if (!user?.uid || !contextId) return;

    const typingRef = doc(db, 'typing', contextId, 'users', user.uid);

    if (isTyping) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing indicator
      await setDoc(typingRef, {
        timestamp: serverTimestamp(),
        userId: user.uid
      });

      // Auto-clear after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    } else {
      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await setDoc(typingRef, {
        timestamp: null,
        userId: user.uid
      });
    }
  };

  return { typingUsers, setTyping };
}

/**
 * Hook to count users active within the last 24 hours on a campus
 * Uses lastHeartbeat from presence data to determine activity
 */
export function useActiveTodayCount() {
  const { user } = useAuth();
  const [activeTodayCount, setActiveTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.campusId) {
      setActiveTodayCount(0);
      setLoading(false);
      return;
    }

    const campusId = user.campusId;
    const presenceRef = collection(db, 'presence');
    const q = query(presenceRef, where('campusId', '==', campusId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        let count = 0;

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const heartbeatField = data.lastHeartbeat || data.lastSeen;

          let heartbeatTime: number;
          if (heartbeatField && typeof heartbeatField === 'object' && 'toMillis' in heartbeatField) {
            heartbeatTime = (heartbeatField as { toMillis: () => number }).toMillis();
          } else if (heartbeatField instanceof Date) {
            heartbeatTime = heartbeatField.getTime();
          } else {
            return;
          }

          if (now - heartbeatTime <= twentyFourHoursMs) {
            count++;
          }
        });

        setActiveTodayCount(count);
        setLoading(false);
      },
      (error) => {
        logger.error('Failed to get active today count', { error: { error: error instanceof Error ? error.message : String(error) } });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.campusId]);

  return { activeTodayCount, loading };
}

/**
 * Get user's current online status
 */
export function useUserStatus(userId: string) {
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('offline');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  useEffect(() => {
    if (!userId) return;

    const presenceRef = doc(db, 'presence', userId);

    const unsubscribe = onSnapshot(
      presenceRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PresenceData;

          const heartbeatField = data.lastHeartbeat || data.lastSeen;
          let heartbeatTime: number;
          if (heartbeatField && typeof heartbeatField === 'object' && 'toMillis' in heartbeatField) {
            heartbeatTime = (heartbeatField as { toMillis: () => number }).toMillis();
          } else if (heartbeatField instanceof Date) {
            heartbeatTime = heartbeatField.getTime();
          } else {
            setStatus('offline');
            setLastSeen(null);
            return;
          }

          const now = Date.now();
          if (now - heartbeatTime > STALE_THRESHOLD_MS) {
            setStatus('offline');
            setLastSeen(new Date(heartbeatTime));
            return;
          }

          setStatus(data.status);
          setLastSeen(new Date(heartbeatTime));
        } else {
          setStatus('offline');
          setLastSeen(null);
        }
      },
      (error) => {
        logger.error('Failed to get user status', { error: { error: error instanceof Error ? error.message : String(error) }, userId });
        setStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { status, lastSeen };
}
