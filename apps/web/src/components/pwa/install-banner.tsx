'use client';

/**
 * PWA Install Banner
 *
 * Shows a banner prompting users to install the PWA.
 * Appears when the app is installable and user hasn't dismissed it.
 * Hidden on auth and onboarding pages for clean UX.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { usePWA } from '@/hooks/use-pwa';

// Pages where we don't want to show the install banner
const HIDDEN_PATHS = ['/enter', '/schools'];

const DISMISSED_KEY = 'hive_pwa_install_dismissed';
const DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallBanner() {
  const pathname = usePathname();
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if we're on a page where banner should be hidden
  const isHiddenPage = HIDDEN_PATHS.some(path => pathname?.startsWith(path));

  // Check if banner was recently dismissed
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISSED_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleInstall = useCallback(async () => {
    setIsInstalling(true);
    const success = await promptInstall();
    setIsInstalling(false);

    if (success) {
      setIsDismissed(true);
    }
  }, [promptInstall]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  // Don't show if already installed, can't install, dismissed, or on hidden page
  if (isInstalled || !canInstall || isDismissed || isHiddenPage) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-4 rounded-xl bg-[var(--bg-surface)] p-4 shadow-lg border border-white/[0.06]">
          {/* App Icon - Official HIVE logo */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-yellow-500 flex items-center justify-center p-2">
              <svg
                className="h-full w-full text-black"
                viewBox="0 0 1500 1500"
                fill="currentColor"
              >
                <path d="M432.83,133.2l373.8,216.95v173.77s-111.81,64.31-111.81,64.31v-173.76l-262.47-150.64-262.27,150.84.28,303.16,259.55,150.31,5.53-.33,633.4-365.81,374.52,215.84v433.92l-372.35,215.04h-2.88l-372.84-215.99-.27-174.53,112.08-63.56v173.76c87.89,49.22,174.62,101.14,262.48,150.69l261.99-151.64v-302.41s-261.51-151.27-261.51-151.27l-2.58.31-635.13,366.97c-121.32-69.01-241.36-140.28-362.59-209.44-4.21-2.4-8.42-5.15-13.12-6.55v-433.92l375.23-216h.96Z" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Install HIVE</p>
            <p className="text-xs text-zinc-400 truncate">
              Add to home screen for the best experience
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
