/**
 * Secure Rate Limiter
 *
 * Production-ready rate limiter with Redis support for multi-instance scaling.
 * Falls back to in-memory rate limiting if Redis is not configured.
 *
 * SCALING: Uses Upstash Redis when configured, in-memory otherwise.
 */

import type { NextRequest } from 'next/server';
import {
  checkIpRateLimit,
  checkUserRateLimit,
  getRateLimitHeaders,
  getRedisRateLimiterHealth,
  type RateLimitResult as RedisRateLimitResult,
} from './rate-limiter-redis';
import {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  aiGenerationRateLimit,
  searchRateLimit,
  chatRateLimit,
  accessCodeRateLimit,
  signinCodeRateLimit,
  signinVerifyRateLimit,
} from './rate-limit-simple';
import { logSecurityEvent } from './logger';

// Rate limit preset configurations (limits and windows)
const RATE_LIMIT_CONFIGS = {
  auth: { limit: 5, windowMs: 60000 },
  authStrict: { limit: 10, windowMs: 60000 },
  apiGeneral: { limit: 100, windowMs: 60000 },
  api: { limit: 100, windowMs: 60000 },
  strict: { limit: 10, windowMs: 60000 },
  aiGeneration: { limit: 5, windowMs: 60000 },
  search: { limit: 30, windowMs: 60000 },
  chat: { limit: 20, windowMs: 60000 },
  accessCode: { limit: 3, windowMs: 300000 },
  signinCode: { limit: 5, windowMs: 300000 },
  signinVerify: { limit: 5, windowMs: 300000 },
} as const;

// In-memory rate limiters mapped to presets (fallback)
const MEMORY_RATE_LIMITERS = {
  auth: authRateLimit,
  authStrict: strictRateLimit,
  apiGeneral: apiRateLimit,
  api: apiRateLimit,
  strict: strictRateLimit,
  aiGeneration: aiGenerationRateLimit,
  search: searchRateLimit,
  chat: chatRateLimit,
  accessCode: accessCodeRateLimit,
  signinCode: signinCodeRateLimit,
  signinVerify: signinVerifyRateLimit,
} as const;

type RateLimitPreset = keyof typeof RATE_LIMIT_CONFIGS;

interface RateLimitResponse {
  allowed: boolean;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Extract secure client ID from request
 */
export function getSecureClientId(request: NextRequest): string {
  // Try various header sources for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Priority: Cloudflare > X-Real-IP > X-Forwarded-For > fallback
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  if (forwardedFor) {
    // Take the first IP (client IP) from the chain
    const firstIp = forwardedFor.split(',')[0];
    return firstIp?.trim() || 'anonymous';
  }

  return 'anonymous';
}

/**
 * Transform Redis result to standard response format
 */
function transformRedisResult(result: RedisRateLimitResult): RateLimitResponse {
  if (!result.allowed) {
    return {
      allowed: false,
      error: 'Rate limit exceeded. Please try again later.',
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
      },
    };
  }

  return {
    allowed: true,
    headers: getRateLimitHeaders(result),
  };
}

/**
 * Check in-memory rate limit (fallback)
 */
function checkMemoryRateLimit(
  preset: RateLimitPreset,
  clientId: string
): RateLimitResponse {
  const limiter = MEMORY_RATE_LIMITERS[preset] || apiRateLimit;
  const result = limiter.check(clientId);

  if (!result.success) {
    return {
      allowed: false,
      error: 'Rate limit exceeded. Please try again later.',
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
        'X-RateLimit-Source': 'memory',
      },
    };
  }

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetTime),
      'X-RateLimit-Source': 'memory',
    },
  };
}

/**
 * Enforce rate limiting with preset configuration
 *
 * Uses Redis when configured for distributed rate limiting across instances.
 * Falls back to in-memory limiting for single-instance or development.
 *
 * @param preset - The rate limit preset to use
 * @param request - The Next.js request object
 * @param userId - Optional user ID for user-specific limits
 * @returns Rate limit result
 */
export async function enforceRateLimit(
  preset: RateLimitPreset | string,
  request: NextRequest,
  userId?: string
): Promise<RateLimitResponse> {
  const validPreset = (preset as RateLimitPreset) in RATE_LIMIT_CONFIGS
    ? (preset as RateLimitPreset)
    : 'api';

  const config = RATE_LIMIT_CONFIGS[validPreset];
  const clientId = getSecureClientId(request);

  try {
    // Try Redis-backed rate limiter first
    const ipResult = await checkIpRateLimit(request, config.limit, config.windowMs);

    // If using Redis and user is authenticated, also check user-specific limit
    if (ipResult.source === 'redis' && userId) {
      const userResult = await checkUserRateLimit(
        userId,
        validPreset,
        config.limit,
        config.windowMs
      );

      // If user limit exceeded, return that result
      if (!userResult.allowed) {
        return transformRedisResult(userResult);
      }
    }

    // Redis worked, return the result
    return transformRedisResult(ipResult);
  } catch (error) {
    // Redis failed - log security event and fall back to in-memory
    logSecurityEvent('rate_limit', {
      operation: 'redis_fallback',
      reason: `Redis rate limiter failed, falling back to in-memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ip: clientId,
      endpoint: request.url,
      metadata: {
        preset: validPreset,
        limit: config.limit,
        windowMs: config.windowMs,
      },
    });
    return checkMemoryRateLimit(validPreset, clientId);
  }
}

/**
 * Check rate limit without blocking (for monitoring)
 */
export function checkRateLimit(
  preset: RateLimitPreset | string,
  clientId: string
): { allowed: boolean; remaining: number } {
  const validPreset = (preset as RateLimitPreset) in MEMORY_RATE_LIMITERS
    ? (preset as RateLimitPreset)
    : 'api';

  const limiter = MEMORY_RATE_LIMITERS[validPreset];
  const result = limiter.check(clientId);

  return {
    allowed: result.success,
    remaining: result.remaining,
  };
}

/**
 * Get rate limiter health status (for health check endpoint)
 */
export async function getRateLimiterHealthStatus(): Promise<{
  redis: {
    enabled: boolean;
    connected: boolean;
    memoryEntries: number;
  };
  memory: {
    healthy: boolean;
  };
}> {
  const redisHealth = await getRedisRateLimiterHealth();

  return {
    redis: {
      enabled: redisHealth.enabled,
      connected: redisHealth.connected,
      memoryEntries: redisHealth.memoryEntries,
    },
    memory: {
      healthy: true, // In-memory is always "healthy" as a fallback
    },
  };
}
