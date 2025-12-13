/**
 * Push Notification Service
 *
 * Client-side service for managing Firebase Cloud Messaging (FCM) push notifications.
 * Handles permission requests, token management, and foreground notification display.
 */

import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getApp } from 'firebase/app';

// FCM VAPID key - used to identify the app for web push
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

// Notification permission status
export type NotificationPermission = 'granted' | 'denied' | 'default';

export interface PushNotificationState {
  permission: NotificationPermission;
  token: string | null;
  isSupported: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  actionUrl?: string;
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission as NotificationPermission;
}

/**
 * Request permission to show notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('[Push] Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error('[Push] Permission request failed:', error);
    return 'denied';
  }
}

/**
 * Get FCM token for push notifications
 *
 * @param serviceWorkerRegistration - The SW registration to use for FCM
 */
export async function getFCMToken(
  serviceWorkerRegistration?: ServiceWorkerRegistration
): Promise<string | null> {
  if (!isPushSupported()) {
    return null;
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return null;
  }

  if (!VAPID_KEY) {
    console.error('[Push] VAPID key not configured');
    return null;
  }

  try {
    const app = getApp();
    const messaging = getMessaging(app);

    // Use provided SW registration or get the default one
    let swRegistration = serviceWorkerRegistration;
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.ready;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    return token;
  } catch (error) {
    console.error('[Push] Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Save FCM token to user's profile in Firestore
 */
export async function saveFCMToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/profile/fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('[Push] Failed to save FCM token:', error);
    return false;
  }
}

/**
 * Remove FCM token from user's profile
 */
export async function removeFCMToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/profile/fcm-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('[Push] Failed to remove FCM token:', error);
    return false;
  }
}

/**
 * Subscribe to foreground messages
 *
 * Returns an unsubscribe function
 */
export function onForegroundMessage(
  callback: (payload: NotificationPayload) => void
): () => void {
  if (!isPushSupported()) {
    return () => {};
  }

  try {
    const app = getApp();
    const messaging = getMessaging(app);

    return onMessage(messaging, (payload: MessagePayload) => {

      const notification: NotificationPayload = {
        title: payload.notification?.title || 'HIVE',
        body: payload.notification?.body || '',
        icon: payload.notification?.icon,
        image: payload.notification?.image,
        data: payload.data,
        actionUrl: payload.data?.url || payload.data?.actionUrl,
      };

      callback(notification);
    });
  } catch (error) {
    console.error('[Push] Failed to subscribe to foreground messages:', error);
    return () => {};
  }
}

/**
 * Show a notification using the Notification API (for foreground)
 */
export function showNotification(payload: NotificationPayload): void {
  if (getNotificationPermission() !== 'granted') {
    console.warn('[Push] Cannot show notification - permission not granted');
    return;
  }

  // Extended options including Chrome-specific properties
  const options: NotificationOptions & { image?: string; renotify?: boolean; vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    image: payload.image,
    badge: '/icons/badge-72x72.png',
    data: {
      url: payload.actionUrl || '/',
      ...payload.data,
    },
    tag: payload.data?.tag || 'hive-notification',
    renotify: true,
    vibrate: [100, 50, 100],
  };

  const notification = new Notification(payload.title, options);

  notification.onclick = () => {
    window.focus();
    if (payload.actionUrl) {
      window.location.href = payload.actionUrl;
    }
    notification.close();
  };
}

/**
 * Complete push notification setup flow
 *
 * 1. Checks if supported
 * 2. Requests permission
 * 3. Gets FCM token
 * 4. Saves to user profile
 */
export async function setupPushNotifications(): Promise<PushNotificationState> {
  const state: PushNotificationState = {
    permission: 'default',
    token: null,
    isSupported: isPushSupported(),
  };

  if (!state.isSupported) {
    console.warn('[Push] Push notifications not supported');
    return state;
  }

  // Check current permission
  state.permission = getNotificationPermission();

  // If not yet asked, request permission
  if (state.permission === 'default') {
    state.permission = await requestNotificationPermission();
  }

  // If granted, get and save token
  if (state.permission === 'granted') {
    const token = await getFCMToken();
    if (token) {
      state.token = token;
      await saveFCMToken(token);
    }
  }

  return state;
}

/**
 * Local storage key for tracking if we've asked for permission
 */
const PERMISSION_ASKED_KEY = 'hive_push_permission_asked';

/**
 * Check if we should prompt for push notifications
 *
 * Returns true if:
 * - Push is supported
 * - Permission is 'default' (not yet asked)
 * - We haven't prompted recently
 */
export function shouldPromptForPush(): boolean {
  if (!isPushSupported()) return false;

  const permission = getNotificationPermission();
  if (permission !== 'default') return false;

  // Check if we've asked in the last 7 days
  const lastAsked = localStorage.getItem(PERMISSION_ASKED_KEY);
  if (lastAsked) {
    const elapsed = Date.now() - parseInt(lastAsked, 10);
    if (elapsed < 7 * 24 * 60 * 60 * 1000) return false;
  }

  return true;
}

/**
 * Mark that we've prompted for push notifications
 */
export function markPermissionAsked(): void {
  localStorage.setItem(PERMISSION_ASKED_KEY, Date.now().toString());
}
