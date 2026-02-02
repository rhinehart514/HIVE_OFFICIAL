/**
 * FCM Token Registration Hook
 *
 * Automatically requests notification permission and registers
 * the FCM token with the server when user is authenticated.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@hive/auth-logic';
import {
  requestFCMToken,
  onForegroundMessage,
  getNotificationState,
} from '@/lib/fcm-client';
import { logger } from '@/lib/logger';

interface UseFCMRegistrationReturn {
  /** Current permission state */
  permissionState: 'unsupported' | 'default' | 'granted' | 'denied';
  /** Whether token is registered */
  isRegistered: boolean;
  /** Request permission manually */
  requestPermission: () => Promise<boolean>;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook to handle FCM token registration
 *
 * - Automatically requests permission on mount (if not denied)
 * - Registers token with server when obtained
 * - Sets up foreground message handler
 */
export function useFCMRegistration(): UseFCMRegistrationReturn {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<
    'unsupported' | 'default' | 'granted' | 'denied'
  >('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Register token with server
  const registerToken = useCallback(async (token: string) => {
    if (!user?.uid) return false;

    try {
      const response = await fetch('/api/users/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      if (response.ok) {
        logger.info('FCM token registered with server');
        return true;
      } else {
        logger.error('Failed to register FCM token', {
          status: response.status,
        });
        return false;
      }
    } catch (error) {
      logger.error('Error registering FCM token', { error });
      return false;
    }
  }, [user?.uid]);

  // Request permission and get token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!user?.uid) return false;

    setIsLoading(true);
    try {
      const token = await requestFCMToken();
      if (token) {
        const registered = await registerToken(token);
        setIsRegistered(registered);
        setPermissionState('granted');
        return registered;
      }
      setPermissionState(getNotificationState());
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, registerToken]);

  // Initial setup on mount
  useEffect(() => {
    // Check initial permission state
    setPermissionState(getNotificationState());
  }, []);

  // Auto-register when user is authenticated and permission is granted
  useEffect(() => {
    if (!user?.uid) return;

    const state = getNotificationState();
    setPermissionState(state);

    // If already granted, get token
    if (state === 'granted') {
      requestPermission();
    }
  }, [user?.uid, requestPermission]);

  // Set up foreground message handler
  useEffect(() => {
    if (permissionState !== 'granted') return;

    const unsubscribe = onForegroundMessage((payload) => {
      // Show in-app notification or toast
      // For now, use native notification API
      if (payload.title) {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/assets/hive-logo-gold.svg',
        });
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [permissionState]);

  return {
    permissionState,
    isRegistered,
    requestPermission,
    isLoading,
  };
}
