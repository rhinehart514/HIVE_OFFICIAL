/**
 * Admin API Hook
 *
 * React hook for making authenticated API calls from the admin dashboard.
 * Automatically includes Firebase ID token in Authorization header.
 */

"use client";

import { useCallback, useEffect, useState } from 'react';
import { auth } from '@hive/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Get authenticated fetch function
 */
export function useAdminFetch() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsReady(!!user);
    });
    return () => unsubscribe();
  }, []);

  const adminFetch = useCallback(async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const currentUser = auth.currentUser;
    const headers = new Headers(init?.headers);

    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      } catch (e) {
        console.warn('[Admin API] Failed to get ID token:', e);
      }
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: 'include',
    });
  }, []);

  return { adminFetch, isReady };
}

/**
 * Simple fetch with auth that doesn't need React hook context
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const currentUser = auth.currentUser;
  const headers = new Headers(init?.headers);

  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (e) {
      console.warn('[Admin API] Failed to get ID token:', e);
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}
