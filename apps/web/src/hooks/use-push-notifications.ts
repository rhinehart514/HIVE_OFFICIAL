'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestFCMToken, onForegroundMessage, getNotificationState } from '@/lib/fcm-client';
import { toast } from 'sonner';

interface UsePushNotificationsOptions {
  /** User must be authenticated for token registration */
  userId?: string | null;
  /** Auto-request on mount when permission is 'default' */
  autoRequest?: boolean;
}

interface UsePushNotificationsReturn {
  /** Current permission state */
  permissionState: 'unsupported' | 'default' | 'granted' | 'denied';
  /** Whether we've successfully registered a token */
  isRegistered: boolean;
  /** Loading state during token request */
  isLoading: boolean;
  /** Request permission and register token */
  requestPermission: () => Promise<boolean>;
}

export function usePushNotifications({
  userId,
  autoRequest = false,
}: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const [permissionState, setPermissionState] = useState<'unsupported' | 'default' | 'granted' | 'denied'>('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const registeredTokenRef = useRef<string | null>(null);
  const foregroundUnsubRef = useRef<(() => void) | null>(null);

  // Check initial permission state
  useEffect(() => {
    setPermissionState(getNotificationState());
  }, []);

  // Register token with the server
  const registerToken = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        registeredTokenRef.current = token;
        setIsRegistered(true);
        return true;
      }
    } catch {
      // Silent failure — will retry on next mount
    }
    return false;
  }, []);

  // Request permission and get token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const token = await requestFCMToken();
      if (!token) {
        setPermissionState(getNotificationState());
        return false;
      }

      setPermissionState('granted');
      const registered = await registerToken(token);
      return registered;
    } finally {
      setIsLoading(false);
    }
  }, [userId, registerToken]);

  // Auto-request on mount if enabled and permission is default
  useEffect(() => {
    if (!userId || !autoRequest) return;
    if (permissionState !== 'default') return;

    // Don't auto-request on first visit — wait for user interaction
    const hasSeenPushPrompt = localStorage.getItem('hive:push-prompted');
    if (!hasSeenPushPrompt) return;

    requestPermission();
  }, [userId, autoRequest, permissionState, requestPermission]);

  // Re-register token if user is authenticated and permission granted
  useEffect(() => {
    if (!userId || permissionState !== 'granted') return;
    if (registeredTokenRef.current) return; // Already registered this session

    // Get token and register silently
    requestFCMToken().then(token => {
      if (token) registerToken(token);
    });
  }, [userId, permissionState, registerToken]);

  // Set up foreground message handler
  useEffect(() => {
    if (permissionState !== 'granted') return;

    foregroundUnsubRef.current = onForegroundMessage((payload) => {
      // Show in-app toast for foreground messages
      if (payload.title) {
        toast(payload.title, {
          description: payload.body,
          action: payload.data?.actionUrl
            ? {
                label: 'View',
                onClick: () => {
                  window.location.href = payload.data!.actionUrl;
                },
              }
            : undefined,
        });
      }
    });

    return () => {
      foregroundUnsubRef.current?.();
    };
  }, [permissionState]);

  // Cleanup token on unmount (not on regular unmount — only on explicit logout)
  // This is handled by the logout flow calling DELETE /api/notifications/register-token

  return {
    permissionState,
    isRegistered,
    isLoading,
    requestPermission,
  };
}
