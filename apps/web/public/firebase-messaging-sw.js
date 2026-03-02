/**
 * Firebase Messaging Service Worker
 *
 * Required canonical filename for FCM background message handling.
 * Delegates push/notification events to the main sw.js which already
 * handles push notifications. This file exists so Firebase SDK can
 * find and register its messaging service worker.
 */

// Import Firebase scripts for SW context
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase in the SW context
// These are public client-side config values (not secrets).
// Service workers can't access process.env, so values are hardcoded here.
// Must match the NEXT_PUBLIC_FIREBASE_* env vars used by the app.
firebase.initializeApp({
  apiKey: 'AIzaSyDMDHXJ8LcWGXz05ipPTNvA-fRi9nfdzbQ',
  authDomain: 'hive-9265c.firebaseapp.com',
  projectId: 'hive-9265c',
  storageBucket: 'hive-9265c.appspot.com',
  messagingSenderId: '573191826528',
  appId: '1:573191826528:web:1d5eaeb8531276e4c1a705',
});

const messaging = firebase.messaging();

// Handle background messages (when app is not in foreground)
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notification = payload.notification || {};
  const data = payload.data || {};

  const actionUrl = payload.fcmOptions?.link
    || data.actionUrl
    || notification.click_action
    || '/me/notifications';

  const tag = data.type
    ? `hive-${data.type}-${Date.now()}`
    : `hive-notification-${Date.now()}`;

  const options = {
    body: notification.body || 'New notification from HIVE',
    icon: notification.icon || '/assets/hive-logo-gold.svg',
    badge: '/assets/hive-logo-gold.svg',
    tag,
    data: {
      url: actionUrl,
      ...data,
    },
    requireInteraction: data.type === 'mention' || data.type === 'event_reminder',
    vibrate: [200, 100, 200],
  };

  return self.registration.showNotification(
    notification.title || 'HIVE',
    options
  );
});

// Notification click — open or focus the right URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
