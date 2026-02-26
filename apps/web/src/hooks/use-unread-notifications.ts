'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseUnreadNotificationsOptions {
  userId?: string | null;
  /** Max notifications to track for count */
  maxCount?: number;
}

interface UseUnreadNotificationsReturn {
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether we're still loading initial count */
  isLoading: boolean;
  /** Recent unread notifications (lightweight — id, title, timestamp) */
  recentUnread: Array<{
    id: string;
    title: string;
    category: string;
    timestamp: string;
    actionUrl?: string;
  }>;
}

export function useUnreadNotifications({
  userId,
  maxCount = 99,
}: UseUnreadNotificationsOptions = {}): UseUnreadNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentUnread, setRecentUnread] = useState<UseUnreadNotificationsReturn['recentUnread']>([]);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setRecentUnread([]);
      setIsLoading(false);
      return;
    }

    // Real-time listener for unread notifications
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
        setRecentUnread(
          snapshot.docs.slice(0, 5).map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || '',
              category: data.category || 'system',
              timestamp: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
              actionUrl: data.actionUrl,
            };
          })
        );
        setIsLoading(false);
      },
      (error) => {
        // Firestore permission error or index missing — fail silently
        console.error('Unread notifications listener error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, maxCount]);

  return { unreadCount, isLoading, recentUnread };
}
