/**
 * Admin API Client
 *
 * Wraps fetch to include Firebase ID token for authenticated requests.
 * The web app's API validates Bearer tokens via Firebase Admin SDK.
 */

import { auth } from '@hive/firebase';

/**
 * Fetch wrapper that automatically includes Firebase ID token
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const currentUser = auth.currentUser;

  const headers = new Headers(init?.headers);

  // Add Bearer token if user is authenticated
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (e) {
      console.warn('[Admin API] Failed to get ID token:', e);
    }
  }

  // Always include credentials for cookie-based fallback
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

/**
 * Type-safe admin API response handler
 */
export async function adminApi<T>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await adminFetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return { error: data.error?.message || data.error || 'Request failed' };
    }

    return { data: data.data ?? data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Request failed' };
  }
}
