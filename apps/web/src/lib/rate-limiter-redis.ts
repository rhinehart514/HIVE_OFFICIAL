/**
 * Redis-based Rate Limiter (Stub for Development)
 *
 * This module provides rate limiting functions that would use Redis in production.
 * In development, these are no-op stubs that always allow requests.
 */

import type { NextRequest } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Check rate limit using Redis (stub - always allows in dev)
 */
export async function _checkRedisRateLimit(
  _key: string,
  _limit: number,
  _windowMs: number
): Promise<RateLimitResult> {
  // Development stub - always allow
  return {
    allowed: true,
    remaining: 100,
    reset: Date.now() + 60000,
    limit: 100
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset)
  };
}

/**
 * Check IP-based rate limit
 */
export async function checkIpRateLimit(
  request: NextRequest,
  _limit?: number,
  _windowMs?: number
): Promise<RateLimitResult> {
  const _ip = request.headers.get('x-forwarded-for') || 'unknown';
  // Development stub - always allow
  return {
    allowed: true,
    remaining: 100,
    reset: Date.now() + 60000,
    limit: 100
  };
}

/**
 * Check user-based rate limit
 */
export async function checkUserRateLimit(
  _userId: string,
  _action: string,
  _limit?: number,
  _windowMs?: number
): Promise<RateLimitResult> {
  // Development stub - always allow
  return {
    allowed: true,
    remaining: 100,
    reset: Date.now() + 60000,
    limit: 100
  };
}
