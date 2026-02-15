/**
 * Cache-Control header utilities for API routes.
 * Wraps a GET handler to automatically add Cache-Control headers to successful responses.
 */
import { type NextRequest } from 'next/server';

export const CACHE_TIERS = {
  /** User-specific mutable data — never cache */
  PRIVATE: 'private, no-store',
  /** Semi-dynamic shared data — 60s edge cache */
  SHORT: 'public, s-maxage=60, stale-while-revalidate=300',
  /** Rarely changing reference data — 1h edge cache */
  LONG: 'public, s-maxage=3600, stale-while-revalidate=86400',
} as const;

export type CacheTier = keyof typeof CACHE_TIERS;

/**
 * Wrap a GET handler to add Cache-Control headers to all 2xx responses.
 */
export function withCache(
  handler: (request: NextRequest, context: any) => Promise<Response> | Response,
  tier: CacheTier = 'SHORT'
) {
  return async (request: NextRequest, context: any): Promise<Response> => {
    const response = await handler(request, context);
    
    // Only add cache headers to successful responses that don't already have them
    if (response.status >= 200 && response.status < 400 && !response.headers.has('Cache-Control')) {
      // Clone response to add header (Response headers may be immutable)
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Cache-Control', CACHE_TIERS[tier]);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
    
    return response;
  };
}
