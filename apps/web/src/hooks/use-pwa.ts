"use client";

/**
 * PWA Hook
 *
 * Provides PWA functionality including:
 * - Install prompt detection and triggering
 * - Service worker registration and updates
 * - App installation state
 * - Online/offline status detection
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook to track online/offline status
 * Used by offline storage and sync systems
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  canInstall: boolean;
  isInstalled: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    canInstall: false,
    isInstalled: false,
    isUpdating: false,
    registration: null,
  });

  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Check if app is installed (standalone mode)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    setState((prev) => ({ ...prev, isInstalled: isStandalone }));
  }, []);

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setState((prev) => ({ ...prev, canInstall: true }));
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setState((prev) => ({
        ...prev,
        canInstall: false,
        isInstalled: true,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        setState((prev) => ({ ...prev, registration }));

        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                setState((prev) => ({ ...prev, registration }));
              }
            });
          }
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    registerSW();
  }, []);

  // Prompt user to install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        deferredPromptRef.current = null;
        setState((prev) => ({
          ...prev,
          canInstall: false,
          isInstalled: true,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Install prompt failed:", error);
      return false;
    }
  }, []);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(() => {
    const { registration } = state;
    if (!registration?.waiting) return;

    setState((prev) => ({ ...prev, isUpdating: true }));

    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Reload once the new service worker takes over
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }, [state]);

  return {
    canInstall: state.canInstall,
    isInstalled: state.isInstalled,
    isUpdating: state.isUpdating,
    registration: state.registration,
    promptInstall,
    skipWaiting,
  };
}
