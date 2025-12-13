"use client";

/**
 * Stub for realtime notifications hook
 * Returns empty state while the real implementation is being built
 */

import { useState, useEffect } from "react";

export interface Notification {
  id: string;
  title: string;
  body?: string;
  type: string;
  read: boolean;
  timestamp: { toDate: () => Date };
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // For now, return empty state - will be implemented with Firebase Realtime DB
  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: async (_id: string) => {},
    markAllAsRead: async () => {},
    refresh: async () => {},
  };
}
