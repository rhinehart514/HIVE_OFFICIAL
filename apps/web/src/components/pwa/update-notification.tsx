'use client';

/**
 * PWA Update Notification
 *
 * Shows a notification when a new version of the app is available.
 * Allows users to reload to get the latest version.
 */

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/use-pwa';

export function UpdateNotification() {
  const { registration, isUpdating, skipWaiting } = usePWA();
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Check if there's a waiting service worker
    if (registration?.waiting) {
      setShowUpdate(true);
    }

    // Listen for new service worker
    const handleControllerChange = () => {
      setShowUpdate(false);
    };

    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [registration]);

  // Also show when update is detected
  useEffect(() => {
    if (registration?.waiting && !isUpdating) {
      setShowUpdate(true);
    }
  }, [registration?.waiting, isUpdating]);

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <div className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white max-w-md">
        {/* Icon */}
        <svg
          className="h-5 w-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>

        {/* Message */}
        <p className="flex-1 text-sm">
          A new version is available!
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowUpdate(false)}
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            Later
          </button>
          <button
            onClick={skipWaiting}
            className="px-3 py-1.5 bg-white text-blue-600 text-sm font-semibold rounded-md hover:bg-blue-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
