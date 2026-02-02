/**
 * Firebase Cloud Messaging Client
 *
 * Handles push notification permission, token registration,
 * and foreground message handling.
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { logger } from './logger';

let messaging: Messaging | null = null;

/**
 * Get or initialize Firebase Messaging instance
 * Only works in browser with service worker support
 */
export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!('PushManager' in window)) return null;

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      logger.error('Failed to initialize Firebase Messaging', { error });
      return null;
    }
  }

  return messaging;
}

/**
 * Request notification permission and get FCM token
 * Returns null if permission denied or unavailable
 */
export async function requestFCMToken(): Promise<string | null> {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) {
    logger.warn('FCM not available in this environment');
    return null;
  }

  try {
    // Check current permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.info('Notification permission denied');
      return null;
    }

    // Get VAPID key from environment
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      logger.warn('VAPID key not configured, FCM disabled');
      return null;
    }

    // Register service worker first
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Get token with service worker registration
    const token = await getToken(messagingInstance, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      logger.info('FCM token obtained');
      return token;
    } else {
      logger.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    logger.error('Error getting FCM token', { error });
    return null;
  }
}

/**
 * Set up foreground message handler
 * Messages received while app is in foreground
 */
export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): (() => void) | null {
  const messagingInstance = getMessagingInstance();
  if (!messagingInstance) return null;

  return onMessage(messagingInstance, (payload) => {
    logger.info('Foreground message received', {
      title: payload.notification?.title,
      data: payload.data
    });

    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    });
  });
}

/**
 * Check if notifications are supported and permission state
 */
export function getNotificationState(): 'unsupported' | 'default' | 'granted' | 'denied' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
