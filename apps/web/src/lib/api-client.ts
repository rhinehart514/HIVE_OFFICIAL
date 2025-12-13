/**
 * Authenticated API Client
 * SECURITY: Uses Firebase Auth tokens for all authenticated requests
 */

import { logger } from './structured-logger';

// Lazy import Firebase auth to avoid initialization errors
let authModule: { auth: { currentUser: { getIdToken: () => Promise<string> } | null } } | null = null;

async function getFirebaseAuth() {
  if (!authModule) {
    try {
      authModule = await import('./firebase');
    } catch (error) {
      logger.warn('Firebase not available', { component: 'api-client', error });
      return null;
    }
  }
  return authModule?.auth || null;
}

type RequestInitType = globalThis.RequestInit;

interface ApiOptions extends RequestInitType {
  skipAuth?: boolean;
  suppressToast?: boolean;
}

class ApiClient {
  private baseUrl = '';

  /**
   * Get the current user's auth token
   * SECURITY: Only uses real Firebase tokens - no dev token fallbacks
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const auth = await getFirebaseAuth();
      if (auth?.currentUser) {
        return await auth.currentUser.getIdToken();
      }

      return null;
    } catch (error) {
      logger.error('Failed to get auth token', { component: 'api-client', action: 'get_auth_token' }, error instanceof Error ? error : undefined);
      return null;
    }
  }

  /**
   * Make an authenticated API request
   */
  async fetch(url: string, options: ApiOptions = {}): Promise<Response> {
    const { skipAuth = false, suppressToast = false, headers = {}, ...restOptions } = options;

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    // Add auth token unless explicitly skipped
    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else {
        logger.warn('No auth token available for API request', { component: 'api-client', action: 'missing_auth_token', url });
      }
    }

    // Make the request
    const start = performance.now?.() ?? Date.now();
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
      // Always include cookies for same-origin API calls
      credentials: 'include',
    });
    const duration = (performance.now?.() ?? Date.now()) - start;

    // Centralized error handling with optional toasts
    if (!response.ok && !suppressToast) {
      try {
        const status = response.status;
        const title = status >= 500
          ? 'Server error'
          : status === 401
            ? 'Please sign in'
            : status === 403
              ? 'Permission denied'
              : 'Request failed';
        const description = `${status} ${response.statusText}`;

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hive:toast', {
            detail: { title, description, type: status >= 500 ? 'error' : 'warning' }
          }));
        }

        logger.warn('API request failed', {
          component: 'api-client',
          action: 'api_error',
          url,
          status,
          duration: `${Math.round(duration)}ms`
        });
      } catch {
        // Silently ignore toast dispatch errors
      }
    }

    return response;
  }

  /**
   * GET request
   */
  async get(url: string, options?: ApiOptions): Promise<Response> {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url: string, body?: unknown, options?: ApiOptions): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put(url: string, body?: unknown, options?: ApiOptions): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch(url: string, body?: unknown, options?: ApiOptions): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete(url: string, options?: ApiOptions): Promise<Response> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience methods for common operations
export const api = {
  spaces: {
    list: (params?: URLSearchParams) =>
      apiClient.get(`/api/spaces${params ? `?${params}` : ''}`),

    create: (data: unknown) =>
      apiClient.post('/api/spaces', data),

    get: (id: string) =>
      apiClient.get(`/api/spaces/${id}`),

    join: (spaceId: string) =>
      apiClient.post('/api/spaces/join', { spaceId }),

    leave: (spaceId: string) =>
      apiClient.post('/api/spaces/leave', { spaceId }),

    members: {
      list: (spaceId: string) =>
        apiClient.get(`/api/spaces/${spaceId}/members`),

      remove: (spaceId: string, memberId: string) =>
        apiClient.delete(`/api/spaces/${spaceId}/members/${memberId}`),

      updateRole: (spaceId: string, memberId: string, role: string) =>
        apiClient.patch(`/api/spaces/${spaceId}/members/${memberId}`, { role }),
    },

    membership: {
      get: (spaceId: string) =>
        apiClient.get(`/api/spaces/${spaceId}/membership?limit=1`),
    },

    tools: {
      list: (spaceId: string) =>
        apiClient.get(`/api/spaces/${spaceId}/tools`),
      install: (spaceId: string, toolData: unknown) =>
        apiClient.post(`/api/spaces/${spaceId}/tools`, toolData),
      configure: (spaceId: string, toolId: string, config: unknown) =>
        apiClient.put(`/api/spaces/${spaceId}/tools/${toolId}`, config),
      remove: (spaceId: string, toolId: string) =>
        apiClient.delete(`/api/spaces/${spaceId}/tools/${toolId}`),
    }
  },

  profile: {
    get: () => apiClient.get('/api/profile'),
    update: (data: unknown) => apiClient.put('/api/profile', data),
  },

  feed: {
    get: () => apiClient.get('/api/feed'),
  }
};
