'use client';

/**
 * Push Notification Prompt
 *
 * Shows a prompt asking users to enable push notifications.
 * Appears after a delay when the user hasn't been asked recently.
 * Hidden on auth and onboarding pages for clean UX.
 */

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePushPrompt } from '@/hooks/use-push-notifications';

// Pages where we don't want to show the push prompt
const HIDDEN_PATHS = ['/enter', '/schools'];

export function PushNotificationPrompt() {
  const pathname = usePathname();
  const { shouldShow, dismiss, enable } = usePushPrompt();
  const [isEnabling, setIsEnabling] = useState(false);

  // Check if we're on a page where prompt should be hidden
  const isHiddenPage = HIDDEN_PATHS.some(path => pathname?.startsWith(path));

  if (!shouldShow || isHiddenPage) {
    return null;
  }

  const handleEnable = async () => {
    setIsEnabling(true);
    await enable();
    setIsEnabling(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 flex justify-center sm:left-auto sm:right-4 sm:bottom-4">
      <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-4 shadow-lg border border-zinc-800">
        {/* Icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-yellow-500/10 rounded-lg">
            <svg
              className="h-6 w-6 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm">
              Stay in the loop
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Get notified about new events, messages, and updates from your spaces.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={dismiss}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleEnable}
            disabled={isEnabling}
            className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isEnabling ? 'Enabling...' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}
