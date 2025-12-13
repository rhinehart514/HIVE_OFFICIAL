/**
 * Secure Authentication Utilities for HIVE
 *
 * SECURITY: This file provides hardened authentication utilities.
 * All auth relies on HttpOnly session cookies - no localStorage tokens in production.
 *
 * @author HIVE Security Team
 * @version 2.0.0 - Production Ready
 */

import { logger } from './logger';

export interface SecureAuthHeaders extends Record<string, string | undefined> {
  'Content-Type': string;
  'X-Hive-Client': string;
}

/**
 * Get secure authentication headers for API requests
 *
 * SECURITY FEATURES:
 * - No development token bypasses
 * - Relies on HttpOnly session cookies for authentication
 * - Client identification headers for audit trails
 *
 * @returns {SecureAuthHeaders} Headers ready for API requests
 */
export function getSecureAuthHeaders(): SecureAuthHeaders {
  // SECURITY: Rely on HttpOnly session cookies for authentication
  // The server validates auth via the hive_session cookie
  return {
    'Content-Type': 'application/json',
    'X-Hive-Client': 'web-app-v1'
  };
}

/**
 * Secure fetch wrapper that automatically includes authentication
 *
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>} Authenticated fetch response
 */
export async function secureApiFetch(
  url: string,
  options: globalThis.RequestInit = {}
): Promise<Response> {
  try {
    const headers = getSecureAuthHeaders();

    // Attempt to include CSRF token if present (admin APIs)
    const csrfHeaders: Record<string, string> = {};
    if (typeof document !== 'undefined') {
      const csrfMeta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfMeta) csrfHeaders['X-CSRF-Token'] = csrfMeta;
    }

    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...csrfHeaders,
        ...(options.headers as Record<string, string> | undefined)
      } as HeadersInit,
      // Always include cookies for same-site API calls
      credentials: 'include'
    });
  } catch (error) {
    // SECURITY: Log auth failures for monitoring
    logger.error('Secure API fetch failed', { component: 'secure-auth-utils', url }, error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Check if user has valid authentication
 * SECURITY: Client-side hints only; server validates real auth via HttpOnly cookies.
 *
 * @returns {boolean} True if user appears to be authenticated
 */
export function isAuthenticated(): boolean {
  // Client-side hints only; server validates real auth via HttpOnly cookies.
  if (typeof window === 'undefined') return false;

  // Check for auth indicator cookie (not the actual session - that's HttpOnly)
  const cookies = document.cookie.split(';').map(c => c.trim());
  const authIndicator = cookies.find(c => c.startsWith('hive_authenticated='));

  return authIndicator?.split('=')[1] === 'true';
}

/**
 * Clear user authentication (logout)
 */
export function clearAuthentication(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('hive_session_token');
  localStorage.removeItem('hive_session');
  localStorage.removeItem('auth_token'); // Clear legacy tokens
}

/**
 * Handle authentication errors consistently
 *
 * @param error - Error from API call
 * @param redirectToLogin - Whether to redirect to login page
 */
export function handleAuthError(error: Error, redirectToLogin: boolean = true): void {
  if (error.message.includes('HIVE_AUTH_') || error.message.includes('401') || error.message.includes('Unauthorized')) {
    clearAuthentication();

    if (redirectToLogin && typeof window !== 'undefined') {
      window.location.href = '/auth/login?reason=session_expired';
    }
  }
}
