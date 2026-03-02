/**
 * Firebase Cloud Messaging Client
 *
 * Handles push notification permission, token registration,
 * and foreground message handling.
 *
 * SW registration is independent of push permission so users
 * who deny push still get offline caching via the service worker.
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from './firebase';
import { logger } from './logger';

let messaging: Messaging | null = null;
let swRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null;

/**
 * Register the service worker independently of push permission.
 * Safe to call multiple times — returns the same promise.
 */
export function ensureServiceWorker(): Promise<ServiceWorkerRegistration> | null {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.info('Service worker registered');
        return registration;
      })
      .catch((error) => {
        logger.error('Service worker registration failed', { error });
        swRegistrationPromise = null;
        throw error;
      });
  }

  return swRegistrationPromise;
}

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

    // Mark that we've prompted regardless of result
    try {
      localStorage.setItem('hive:push-prompted', '1');
    } catch {
      // localStorage may be unavailable in some contexts
    }

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

    // Ensure SW is registered
    const registrationPromise = ensureServiceWorker();
    if (!registrationPromise) return null;

    const registration = await registrationPromise;
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
