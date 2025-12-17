/**
 * API Client for HiveLab
 *
 * Provides authenticated API calls to the web app's endpoints.
 * In development, uses Next.js rewrites to proxy to localhost:3000.
 * In production, uses the configured NEXT_PUBLIC_API_URL.
 */

import { getAuth } from 'firebase/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function getAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('/api')
    ? `${API_BASE}${endpoint}`
    : `${API_BASE}/api${endpoint}`;

  return fetch(url, {
    ...options,
    headers,
  });
}

export const apiClient = {
  get: (endpoint: string) => fetchWithAuth(endpoint, { method: 'GET' }),

  post: (endpoint: string, body?: unknown) =>
    fetchWithAuth(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (endpoint: string, body?: unknown) =>
    fetchWithAuth(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: (endpoint: string, body?: unknown) =>
    fetchWithAuth(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (endpoint: string) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};

export default apiClient;
