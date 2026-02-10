'use client';

/**
 * Offline Page
 *
 * Shown when the user is offline and the requested page
 * is not available in the cache.
 */

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If user comes back online, redirect to home
  useEffect(() => {
    if (isOnline) {
      // Small delay to ensure network is stable
      const timeout = setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Offline Icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-[#0A0A0A] flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
            <line
              x1="4"
              y1="4"
              x2="20"
              y2="20"
              className="stroke-red-500"
              strokeWidth={2}
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold">You&apos;re Offline</h1>

        {/* Description */}
        <p className="text-white/50">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry - some
          features are still available offline.
        </p>

        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
            {isOnline ? 'Back online! Redirecting...' : 'No internet connection'}
          </span>
        </div>

        {/* Offline Features */}
        <div className="bg-[#0A0A0A] rounded-lg p-4 text-left">
          <h3 className="font-semibold mb-3">Available Offline:</h3>
          <ul className="space-y-2 text-sm text-white/50">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previously viewed spaces
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cached feed content
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Draft messages (will sync when online)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-white/[0.06] text-white font-semibold rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-white/50">
          Your actions will be saved and synced automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
