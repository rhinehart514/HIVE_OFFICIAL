/**
 * E2E API Helpers for HIVE Platform
 *
 * Provides helper functions for making API calls during E2E tests.
 */

import { Page, APIRequestContext } from '@playwright/test';

// ============================================================================
// TYPES
// ============================================================================

interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
}

interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
}

// ============================================================================
// CHAT API HELPERS
// ============================================================================

/**
 * Send a chat message to a space
 */
export async function sendChatMessage(
  page: Page,
  spaceId: string,
  boardId: string,
  content: string
): Promise<ApiResponse<{ messageId: string }>> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('session'));

  const result = await page.evaluate(
    async ({ spaceId, boardId, content }) => {
      const res = await fetch(`/api/spaces/${spaceId}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          boardId,
          content,
          type: 'text',
        }),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { spaceId, boardId, content }
  );

  return result;
}

/**
 * Add a reaction to a message
 */
export async function addReaction(
  page: Page,
  spaceId: string,
  boardId: string,
  messageId: string,
  emoji: string
): Promise<ApiResponse> {
  const result = await page.evaluate(
    async ({ spaceId, boardId, messageId, emoji }) => {
      const res = await fetch(`/api/spaces/${spaceId}/chat/${messageId}/react`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          boardId,
          emoji,
        }),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { spaceId, boardId, messageId, emoji }
  );

  return result;
}

/**
 * Pin a message
 */
export async function pinMessage(
  page: Page,
  spaceId: string,
  boardId: string,
  messageId: string
): Promise<ApiResponse> {
  const result = await page.evaluate(
    async ({ spaceId, boardId, messageId }) => {
      const res = await fetch(`/api/spaces/${spaceId}/chat/${messageId}/pin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ boardId }),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { spaceId, boardId, messageId }
  );

  return result;
}

// ============================================================================
// SPACE API HELPERS
// ============================================================================

/**
 * Join a space
 */
export async function joinSpace(
  page: Page,
  spaceId: string
): Promise<ApiResponse<{ joined: boolean }>> {
  const result = await page.evaluate(
    async ({ spaceId }) => {
      const res = await fetch('/api/spaces/join-v2', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ spaceId }),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { spaceId }
  );

  return result;
}

/**
 * Leave a space
 */
export async function leaveSpace(
  page: Page,
  spaceId: string
): Promise<ApiResponse> {
  const result = await page.evaluate(
    async ({ spaceId }) => {
      const res = await fetch(`/api/spaces/${spaceId}/leave`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { spaceId }
  );

  return result;
}

/**
 * Get space details
 */
export async function getSpace(
  page: Page,
  spaceId: string
): Promise<ApiResponse> {
  const result = await page.evaluate(
    async ({ spaceId }) => {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { spaceId }
  );

  return result;
}

/**
 * Browse spaces
 */
export async function browseSpaces(
  page: Page,
  options?: { limit?: number; territory?: string }
): Promise<ApiResponse<{ spaces: unknown[] }>> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.territory) params.set('territory', options.territory);

  const result = await page.evaluate(
    async ({ queryString }) => {
      const res = await fetch(`/api/spaces/browse-v2?${queryString}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { queryString: params.toString() }
  );

  return result;
}

/**
 * Search spaces
 */
export async function searchSpaces(
  page: Page,
  query: string
): Promise<ApiResponse<{ results: unknown[] }>> {
  const result = await page.evaluate(
    async ({ query }) => {
      const res = await fetch(`/api/spaces/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { query }
  );

  return result;
}

// ============================================================================
// PROFILE API HELPERS
// ============================================================================

/**
 * Get current user's profile
 */
export async function getProfile(page: Page): Promise<ApiResponse> {
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  });

  return result;
}

/**
 * Update profile
 */
export async function updateProfile(
  page: Page,
  updates: Record<string, unknown>
): Promise<ApiResponse> {
  const result = await page.evaluate(
    async ({ updates }) => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { updates }
  );

  return result;
}

// ============================================================================
// TOOL API HELPERS
// ============================================================================

/**
 * Create a new tool
 */
export async function createTool(
  page: Page,
  toolData: {
    name: string;
    description?: string;
    elements?: unknown[];
  }
): Promise<ApiResponse<{ toolId: string }>> {
  const result = await page.evaluate(
    async ({ toolData }) => {
      const res = await fetch('/api/tools', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(toolData),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { toolData }
  );

  return result;
}

/**
 * Deploy a tool to a space
 */
export async function deployTool(
  page: Page,
  toolId: string,
  spaceId: string,
  placement: 'sidebar' | 'inline' = 'sidebar'
): Promise<ApiResponse> {
  const result = await page.evaluate(
    async ({ toolId, spaceId, placement }) => {
      const res = await fetch(`/api/tools/${toolId}/deploy`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ spaceId, placement }),
      });

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { toolId, spaceId, placement }
  );

  return result;
}

// ============================================================================
// HEALTH CHECK HELPERS
// ============================================================================

/**
 * Check API health
 */
export async function checkHealth(
  page: Page,
  verbose = false
): Promise<ApiResponse<{ status: string; checks: Record<string, unknown> }>> {
  const result = await page.evaluate(
    async ({ verbose }) => {
      const url = verbose ? '/api/health?verbose=true' : '/api/health';
      const res = await fetch(url);

      const data = await res.json().catch(() => ({}));
      return {
        status: res.status,
        ok: res.ok,
        data,
      };
    },
    { verbose }
  );

  return result;
}

// ============================================================================
// PERFORMANCE METRICS HELPERS
// ============================================================================

/**
 * Measure API response time
 */
export async function measureApiLatency(
  page: Page,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<{ latency: number; status: number }> {
  const result = await page.evaluate(
    async ({ endpoint, method, body }) => {
      const start = performance.now();

      const options: RequestInit = {
        method,
        credentials: 'include',
      };

      if (body && method === 'POST') {
        options.headers = {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        };
        options.body = JSON.stringify(body);
      }

      const res = await fetch(endpoint, options);
      const latency = Math.round(performance.now() - start);

      return {
        latency,
        status: res.status,
      };
    },
    { endpoint, method, body }
  );

  return result;
}

/**
 * Collect multiple latency samples
 */
export async function collectLatencySamples(
  page: Page,
  endpoint: string,
  samples: number,
  delayMs = 100
): Promise<{
  samples: number[];
  avg: number;
  p95: number;
  min: number;
  max: number;
}> {
  const latencies: number[] = [];

  for (let i = 0; i < samples; i++) {
    const { latency } = await measureApiLatency(page, endpoint);
    latencies.push(latency);

    if (delayMs > 0 && i < samples - 1) {
      await page.waitForTimeout(delayMs);
    }
  }

  // Calculate stats
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p95 = sorted[p95Index] || sorted[sorted.length - 1];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  return { samples: latencies, avg, p95, min, max };
}
