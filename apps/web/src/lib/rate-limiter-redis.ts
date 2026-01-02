/**
 * Redis-based Distributed Rate Limiter
 *
 * Uses Upstash Redis for distributed rate limiting across multiple instances.
 * Falls back to in-memory rate limiting if Redis is not configured.
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
 *
 * Install: pnpm add @upstash/redis @upstash/ratelimit
 */

import type { NextRequest } from 'next/server';
import { logSecurityEvent } from './structured-logger';
import { currentEnvironment } from './env';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
  source: 'redis' | 'memory' | 'fallback';
}

interface RedisClient {
  eval: <T>(script: string, keys: string[], args: (string | number)[]) => Promise<T>;
  get: (key: string) => Promise<string | null>;
  setex: (key: string, seconds: number, value: string) => Promise<'OK'>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = !!(REDIS_URL && REDIS_TOKEN);

// Default rate limits (configurable via environment)
const DEFAULT_LIMITS = {
  ip: {
    limit: parseInt(process.env.REDIS_RATE_LIMIT_IP || '100', 10),
    windowMs: parseInt(process.env.REDIS_RATE_LIMIT_IP_WINDOW_MS || '60000', 10),
  },
  user: {
    limit: parseInt(process.env.REDIS_RATE_LIMIT_USER || '200', 10),
    windowMs: parseInt(process.env.REDIS_RATE_LIMIT_USER_WINDOW_MS || '60000', 10),
  },
  api: {
    limit: parseInt(process.env.REDIS_RATE_LIMIT_API || '100', 10),
    windowMs: parseInt(process.env.REDIS_RATE_LIMIT_API_WINDOW_MS || '60000', 10),
  },
};

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>();
const MAX_MEMORY_ENTRIES = 10000;

// ============================================================================
// REDIS CLIENT (Upstash REST API)
// ============================================================================

let redisClient: RedisClient | null = null;

async function getRedisClient(): Promise<RedisClient | null> {
  if (!REDIS_ENABLED) return null;
  if (redisClient) return redisClient;

  try {
    // Dynamic import to avoid build errors if package not installed
    // @ts-expect-error - Module might not be installed, handled at runtime
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: REDIS_URL!,
      token: REDIS_TOKEN!,
    }) as unknown as RedisClient;

    logSecurityEvent('rate_limit', {
      operation: 'redis_connected',
      tags: { environment: currentEnvironment }
    });

    return redisClient;
  } catch (error) {
    logSecurityEvent('rate_limit', {
      operation: 'redis_connection_failed',
      tags: {
        error: error instanceof Error ? error.message : 'unknown',
        environment: currentEnvironment
      }
    });
    return null;
  }
}

// ============================================================================
// SLIDING WINDOW RATE LIMITER (Redis)
// ============================================================================

/**
 * Lua script for sliding window rate limiting
 * Atomic operation to check and increment counter
 */
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Remove old entries outside the window
local windowStart = now - window
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- Count current requests in window
local count = redis.call('ZCARD', key)

if count < limit then
  -- Add new request
  redis.call('ZADD', key, now, now .. '-' .. math.random())
  redis.call('PEXPIRE', key, window)
  return {1, limit - count - 1, now + window}
else
  -- Rate limited
  return {0, 0, now + window}
end
`;

async function checkRedisRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (!redis) {
    // Fall back to in-memory
    return checkMemoryRateLimit(key, limit, windowMs);
  }

  try {
    const now = Date.now();
    const result = await redis.eval<[number, number, number]>(
      SLIDING_WINDOW_SCRIPT,
      [`ratelimit:${key}`],
      [windowMs, limit, now]
    );

    const [allowed, remaining, reset] = result;

    return {
      allowed: allowed === 1,
      remaining,
      reset,
      limit,
      source: 'redis'
    };
  } catch (error) {
    logSecurityEvent('rate_limit', {
      operation: 'redis_eval_failed',
      tags: {
        key,
        error: error instanceof Error ? error.message : 'unknown',
        environment: currentEnvironment
      }
    });

    // Fall back to in-memory on Redis error
    return checkMemoryRateLimit(key, limit, windowMs);
  }
}

// ============================================================================
// IN-MEMORY FALLBACK RATE LIMITER
// ============================================================================

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowMs;

  // Evict old entries if at capacity
  if (memoryStore.size >= MAX_MEMORY_ENTRIES) {
    const oldest = [...memoryStore.entries()]
      .sort((a, b) => a[1].resetAt - b[1].resetAt)
      .slice(0, Math.ceil(MAX_MEMORY_ENTRIES * 0.1));

    for (const [k] of oldest) {
      memoryStore.delete(k);
    }
  }

  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      reset: resetAt,
      limit,
      source: 'memory'
    };
  }

  if (entry.count < limit) {
    // Increment counter
    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      reset: entry.resetAt,
      limit,
      source: 'memory'
    };
  }

  // Rate limited
  return {
    allowed: false,
    remaining: 0,
    reset: entry.resetAt,
    limit,
    source: 'memory'
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    'X-RateLimit-Source': result.source
  };
}

/**
 * Check IP-based rate limit
 */
export async function checkIpRateLimit(
  request: NextRequest,
  limit?: number,
  windowMs?: number
): Promise<RateLimitResult> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  // Normalize IP for consistent keying
  const normalizedIp = ip.replace(/[^a-zA-Z0-9.:]/g, '_').substring(0, 45);

  return checkRedisRateLimit(
    `ip:${normalizedIp}`,
    limit ?? DEFAULT_LIMITS.ip.limit,
    windowMs ?? DEFAULT_LIMITS.ip.windowMs
  );
}

/**
 * Check user-based rate limit
 */
export async function checkUserRateLimit(
  userId: string,
  action: string,
  limit?: number,
  windowMs?: number
): Promise<RateLimitResult> {
  // Normalize user ID for consistent keying
  const normalizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const normalizedAction = action.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);

  return checkRedisRateLimit(
    `user:${normalizedUserId}:${normalizedAction}`,
    limit ?? DEFAULT_LIMITS.user.limit,
    windowMs ?? DEFAULT_LIMITS.user.windowMs
  );
}

/**
 * Check API endpoint rate limit
 */
export async function checkApiRateLimit(
  identifier: string,
  limit?: number,
  windowMs?: number
): Promise<RateLimitResult> {
  const normalizedId = identifier.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

  return checkRedisRateLimit(
    `api:${normalizedId}`,
    limit ?? DEFAULT_LIMITS.api.limit,
    windowMs ?? DEFAULT_LIMITS.api.windowMs
  );
}

/**
 * Combined rate limit check (IP + User if authenticated)
 */
export async function checkCombinedRateLimit(
  request: NextRequest,
  userId?: string,
  action: string = 'api',
  limits?: { ip?: number; user?: number; windowMs?: number }
): Promise<RateLimitResult & { ipResult?: RateLimitResult; userResult?: RateLimitResult }> {
  const windowMs = limits?.windowMs ?? DEFAULT_LIMITS.api.windowMs;

  // Check IP limit first
  const ipResult = await checkIpRateLimit(
    request,
    limits?.ip ?? DEFAULT_LIMITS.ip.limit,
    windowMs
  );

  // If IP rate limited, return immediately
  if (!ipResult.allowed) {
    return { ...ipResult, ipResult };
  }

  // If user is authenticated, also check user limit
  if (userId) {
    const userResult = await checkUserRateLimit(
      userId,
      action,
      limits?.user ?? DEFAULT_LIMITS.user.limit,
      windowMs
    );

    if (!userResult.allowed) {
      return { ...userResult, ipResult, userResult };
    }

    // Return combined result (most restrictive)
    return {
      allowed: true,
      remaining: Math.min(ipResult.remaining, userResult.remaining),
      reset: Math.min(ipResult.reset, userResult.reset),
      limit: Math.min(ipResult.limit, userResult.limit),
      source: ipResult.source === 'redis' || userResult.source === 'redis' ? 'redis' : 'memory',
      ipResult,
      userResult
    };
  }

  return { ...ipResult, ipResult };
}

/**
 * Get Redis rate limiter health status
 */
export async function getRedisRateLimiterHealth(): Promise<{
  enabled: boolean;
  connected: boolean;
  memoryEntries: number;
  maxMemoryEntries: number;
}> {
  const redis = await getRedisClient();

  return {
    enabled: REDIS_ENABLED,
    connected: redis !== null,
    memoryEntries: memoryStore.size,
    maxMemoryEntries: MAX_MEMORY_ENTRIES
  };
}

/**
 * Cleanup in-memory store (for testing)
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}
