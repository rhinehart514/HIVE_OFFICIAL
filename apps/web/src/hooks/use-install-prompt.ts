'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useInstallPrompt — Intercepts the browser's `beforeinstallprompt` event,
 * defers it, and exposes it so we can show it after a value moment
 * (first space join, first tool interaction, etc.).
 *
 * Usage:
 *   const { canInstall, promptInstall } = useInstallPrompt();
 *   // After a value moment:
 *   if (canInstall) promptInstall();
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

interface UseInstallPromptReturn {
  /** Whether the install prompt is available to show */
  canInstall: boolean;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Trigger the install prompt. Returns true if user accepted. */
  promptInstall: () => Promise<boolean>;
}

const STORAGE_KEY = 'hive:install-dismissed';

export function useInstallPrompt(): UseInstallPromptReturn {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed (standalone or fullscreen mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as Record<string, unknown>).standalone === true);

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed within the last 7 days
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedAt < sevenDays) {
          return; // Don't capture the prompt if recently dismissed
        }
      }
    } catch {
      // localStorage unavailable
    }

    const handleBeforeInstall = (e: Event) => {
      // Prevent the browser's mini-infobar from showing
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === 'dismissed') {
        // Record dismissal so we don't nag for 7 days
        try {
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          // localStorage unavailable
        }
      }

      // Clear the prompt — it can only be used once
      deferredPromptRef.current = null;
      setCanInstall(false);

      return outcome === 'accepted';
    } catch {
      return false;
    }
  }, []);

  return { canInstall, isInstalled, promptInstall };
}
