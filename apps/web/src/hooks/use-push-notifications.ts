"use client";

/**
 * Push Notifications Hook
 *
 * Manages push notification permissions and FCM token registration.
 * Provides hooks for showing push prompts and handling notification state.
 */

import { useState, useEffect, useCallback } from "react";

const PROMPT_DISMISSED_KEY = "hive_push_prompt_dismissed";
const PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface PushState {
  isSupported: boolean;
  permission: NotificationPermission | "unknown";
  isEnabled: boolean;
  fcmToken: string | null;
}

interface UsePushPromptReturn {
  shouldShow: boolean;
  dismiss: () => void;
  enable: () => Promise<boolean>;
}

interface UsePushNotificationsReturn extends PushState {
  requestPermission: () => Promise<boolean>;
  registerToken: (token: string) => Promise<void>;
}

/**
 * Check if we should show the push notification prompt
 */
function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false;

  // Check if notifications are supported
  if (!("Notification" in window)) return false;

  // Don't show if already granted or denied
  if (Notification.permission !== "default") return false;

  // Check cooldown
  const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
  if (dismissedAt) {
    const elapsed = Date.now() - parseInt(dismissedAt, 10);
    if (elapsed < PROMPT_COOLDOWN_MS) return false;
  }

  return true;
}

/**
 * Hook for the push notification prompt UI
 */
export function usePushPrompt(): UsePushPromptReturn {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Delay showing the prompt to avoid disrupting initial experience
    const timer = setTimeout(() => {
      setShouldShow(shouldShowPrompt());
    }, 5000); // 5 second delay

    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    setShouldShow(false);
  }, []);

  const enable = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setShouldShow(false);

      if (permission === "granted") {
        // TODO: Register FCM token
        // await registerFCMToken();
        return true;
      }

      // If denied, set cooldown
      if (permission === "denied") {
        localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
      }

      return false;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, []);

  return {
    shouldShow,
    dismiss,
    enable,
  };
}

/**
 * Full push notifications hook for managing notification state
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    permission: "unknown",
    isEnabled: false,
    fcmToken: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    const permission: NotificationPermission | "unknown" = isSupported
      ? Notification.permission
      : "unknown";

    setState((prev) => ({
      ...prev,
      isSupported,
      permission,
      isEnabled: permission === "granted",
    }));
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      const isEnabled = permission === "granted";

      setState((prev) => ({
        ...prev,
        permission,
        isEnabled,
      }));

      return isEnabled;
    } catch (error) {
      console.error("Failed to request permission:", error);
      return false;
    }
  }, [state.isSupported]);

  const registerToken = useCallback(async (token: string): Promise<void> => {
    // TODO: Send token to server via /api/profile/fcm-token
    setState((prev) => ({
      ...prev,
      fcmToken: token,
    }));
    console.log("FCM token registered:", token.slice(0, 20) + "...");
  }, []);

  return {
    ...state,
    requestPermission,
    registerToken,
  };
}
