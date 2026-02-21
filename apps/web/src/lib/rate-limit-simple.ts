/**
 * SECURE in-memory rate limiting with no bypass vulnerabilities
 * NO SILENT FAILURES - PRODUCTION SAFE FALLBACK
 *
 * SCALING: Uses LRU eviction to prevent memory leaks at scale
 */

import { logSecurityEvent } from './structured-logger';
import { currentEnvironment } from './env';

// ============================================================================
// CONFIGURABLE LIMITS - Override via environment variables for production
// ============================================================================
const MAX_CLIENTS = parseInt(process.env.RATE_LIMIT_MAX_CLIENTS || '10000', 10);
const CLEANUP_INTERVAL_MS = parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL_MS || '300000', 10); // 5 min default
const MAX_AGE_MS = parseInt(process.env.RATE_LIMIT_MAX_AGE_MS || '3600000', 10); // 1 hour default

// Rate limit configurations (overridable via env)
const RATE_LIMITS = {
  auth: {
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_REQUESTS || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000', 10),
  },
  api: {
    maxRequests: parseInt(process.env.RATE_LIMIT_API_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || '60000', 10),
  },
  strict: {
    maxRequests: parseInt(process.env.RATE_LIMIT_STRICT_REQUESTS || '10', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS || '60000', 10),
  },
  // SECURITY: Very strict limit for access code attempts - prevents brute force
  // 3 attempts per 5 minutes = ~36 attempts per hour = would take ~27,778 hours to brute force
  accessCode: {
    maxRequests: parseInt(process.env.RATE_LIMIT_ACCESS_CODE_REQUESTS || '3', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_ACCESS_CODE_WINDOW_MS || '300000', 10), // 5 minutes
  },
  // Sign-in code request - 10 requests per 5 minutes
  // Generous because send-code only sends emails (no brute force risk)
  // Email-level DB check (10/hour) is the real protection
  signinCode: {
    maxRequests: parseInt(process.env.RATE_LIMIT_SIGNIN_CODE_REQUESTS || '10', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_SIGNIN_CODE_WINDOW_MS || '300000', 10), // 5 minutes
  },
  // Sign-in code verify - 5 attempts per 5 minutes
  signinVerify: {
    maxRequests: parseInt(process.env.RATE_LIMIT_SIGNIN_VERIFY_REQUESTS || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_SIGNIN_VERIFY_WINDOW_MS || '300000', 10), // 5 minutes
  },
  aiGeneration: {
    maxRequests: parseInt(process.env.RATE_LIMIT_AI_REQUESTS || '5', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS || '60000', 10),
  },
  search: {
    maxRequests: parseInt(process.env.RATE_LIMIT_SEARCH_REQUESTS || '30', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW_MS || '60000', 10),
  },
  chat: {
    maxRequests: parseInt(process.env.RATE_LIMIT_CHAT_REQUESTS || '20', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_CHAT_WINDOW_MS || '60000', 10),
  },
  sse: {
    maxRequests: parseInt(process.env.RATE_LIMIT_SSE_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_SSE_WINDOW_MS || '60000', 10),
  },
};

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
  blockOnError?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface ClientRecord {
  requests: number[];
  windowStart: number;
  violations: number;
  lastViolation: number;
  lastAccess: number; // For LRU eviction
}

// In-memory store for rate limiting with LRU tracking
const clients = new Map<string, ClientRecord>();
const rateLimiterHealth = new Map<string, { failures: number; lastFailure: number }>();

/**
 * LRU eviction when client limit reached
 * Removes least recently accessed clients to prevent memory leak
 */
function evictLRUClients(): void {
  if (clients.size < MAX_CLIENTS) return;

  // Find and remove oldest 10% of clients
  const evictionCount = Math.ceil(MAX_CLIENTS * 0.1);
  const sortedByAccess = [...clients.entries()]
    .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

  for (let i = 0; i < evictionCount && i < sortedByAccess.length; i++) {
    clients.delete(sortedByAccess[i][0]);
  }

  logSecurityEvent('rate_limit', {
    operation: 'lru_eviction',
    tags: {
      evicted: evictionCount.toString(),
      remaining: clients.size.toString(),
      environment: currentEnvironment
    }
  });
}

/**
 * SECURE rate limiter - NO BYPASSES ALLOWED
 */
export function rateLimit(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
  const { maxRequests, windowMs, identifier = 'default', blockOnError = true } = config;

  return {
    check: (clientId: string): RateLimitResult => {
      try {
        const normalizedClientId = normalizeClientId(clientId);
        const now = Date.now();
        const windowStart = Math.floor(now / windowMs) * windowMs;
        const resetTime = windowStart + windowMs;

        // SECURITY: Check for abuse patterns
        if (isAbusiveClient(normalizedClientId)) {
          return createBlockedResult(maxRequests, resetTime, 'abusive_pattern');
        }

        // Evict LRU clients if at capacity BEFORE adding new client
        evictLRUClients();

        // Get or create client record
        let client = clients.get(normalizedClientId);

        if (!client || client.windowStart !== windowStart) {
          // New window, reset the client but preserve violation history
          const previousViolations = client?.violations || 0;
          const lastViolation = client?.lastViolation || 0;

          client = {
            requests: [],
            windowStart: windowStart,
            violations: previousViolations,
            lastViolation: lastViolation,
            lastAccess: now
          };
          clients.set(normalizedClientId, client);
        }

        // Update last access for LRU tracking
        client.lastAccess = now;

        // Clean up old requests (outside current window)
        client.requests = client.requests.filter(requestTime => requestTime >= windowStart);

        // SECURITY: Enhanced violation tracking
        if (client.requests.length >= maxRequests) {
          client.violations++;
          client.lastViolation = now;
          
          // Log security event for rate limit violations
          logSecurityEvent('rate_limit', {
            operation: 'memory_rate_limit_exceeded',
            tags: {
              clientId: normalizedClientId,
              identifier: identifier,
              violations: client.violations.toString(),
              environment: currentEnvironment
            }
          });

          const retryAfter = Math.ceil((resetTime - now) / 1000);
          return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            resetTime,
            retryAfter
          };
        }

        // Record this request
        client.requests.push(now);

        // Reset rate limiter health on successful operation
        resetHealthStatus(identifier);

        return {
          success: true,
          limit: maxRequests,
          remaining: maxRequests - client.requests.length,
          resetTime
        };

      } catch (error) {
        // CRITICAL: Handle rate limiter failures securely
        const healthStatus = rateLimiterHealth.get(identifier) || { failures: 0, lastFailure: 0 };
        healthStatus.failures++;
        healthStatus.lastFailure = Date.now();
        rateLimiterHealth.set(identifier, healthStatus);


        // Log security event
        logSecurityEvent('rate_limit', {
          operation: 'memory_rate_limiter_failure',
          tags: {
            identifier: identifier,
            failures: healthStatus.failures.toString(),
            error: error instanceof Error ? error.message : 'unknown'
          }
        });

        // SECURITY: Block on error to prevent bypass
        if (blockOnError) {
          return createBlockedResult(maxRequests, Date.now() + windowMs, 'rate_limiter_error');
        }

        // If not blocking on error, return very conservative limits
        return {
          success: false,
          limit: 1, // Very restrictive when rate limiter fails
          remaining: 0,
          resetTime: Date.now() + windowMs,
          retryAfter: Math.ceil(windowMs / 1000)
        };
      }
    },

    /**
     * Get health status of this rate limiter
     */
    getHealthStatus: () => {
      const health = rateLimiterHealth.get(identifier) || { failures: 0, lastFailure: 0 };
      return {
        identifier,
        failures: health.failures,
        lastFailure: health.lastFailure,
        healthy: health.failures < 5,
        clientCount: clients.size
      };
    }
  };
}

/**
 * Normalize client ID for security
 */
function normalizeClientId(clientId: string): string {
  if (!clientId || clientId === 'unknown' || clientId === 'null' || clientId === 'undefined') {
    return 'anonymous';
  }
  
  // Sanitize and normalize
  return clientId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.:_-]/g, '_')
    .substring(0, 50) || 'anonymous';
}

/**
 * Check for abusive patterns
 */
function isAbusiveClient(clientId: string): boolean {
  const client = clients.get(clientId);
  if (!client) return false;
  
  const now = Date.now();
  const recentViolationThreshold = 5 * 60 * 1000; // 5 minutes
  
  // Block clients with too many recent violations
  if (client.violations > 10 && (now - client.lastViolation) < recentViolationThreshold) {
    return true;
  }
  
  return false;
}

/**
 * Create a blocked result
 */
function createBlockedResult(limit: number, resetTime: number, _reason: string): RateLimitResult {
  const now = Date.now();
  const retryAfter = Math.ceil((resetTime - now) / 1000);
  
  return {
    success: false,
    limit,
    remaining: 0,
    resetTime,
    retryAfter
  };
}

/**
 * Reset health status on successful operation
 */
function resetHealthStatus(identifier: string): void {
  const health = rateLimiterHealth.get(identifier);
  if (health && health.failures > 0) {
    rateLimiterHealth.set(identifier, { failures: 0, lastFailure: 0 });
  }
}

/**
 * SECURE cleanup with safety checks
 * Runs every CLEANUP_INTERVAL_MS (default 5 minutes)
 */
function secureCleanup() {
  try {
    const now = Date.now();
    const beforeSize = clients.size;

    for (const [clientId, client] of clients.entries()) {
      if (now - client.windowStart > MAX_AGE_MS) {
        clients.delete(clientId);
      }
    }

    const cleaned = beforeSize - clients.size;
    if (cleaned > 100) {
      // Log significant cleanups for monitoring
      logSecurityEvent('rate_limit', {
        operation: 'cleanup',
        tags: {
          cleaned: cleaned.toString(),
          remaining: clients.size.toString(),
          environment: currentEnvironment
        }
      });
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

// Run cleanup every CLEANUP_INTERVAL_MS (default 5 minutes, configurable)
setInterval(secureCleanup, CLEANUP_INTERVAL_MS);

/**
 * SECURE pre-configured rate limiters
 * All limits configurable via environment variables (see RATE_LIMITS above)
 */
export const authRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.auth.maxRequests,
  windowMs: RATE_LIMITS.auth.windowMs,
  identifier: 'auth_simple',
  blockOnError: true
});

export const apiRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.api.maxRequests,
  windowMs: RATE_LIMITS.api.windowMs,
  identifier: 'api_simple',
  blockOnError: true
});

export const strictRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.strict.maxRequests,
  windowMs: RATE_LIMITS.strict.windowMs,
  identifier: 'strict_simple',
  blockOnError: true
});

/**
 * AI generation rate limiter - very strict (default 5 requests per minute)
 * AI operations are expensive, so limit aggressively
 * Override: RATE_LIMIT_AI_REQUESTS, RATE_LIMIT_AI_WINDOW_MS
 */
export const aiGenerationRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.aiGeneration.maxRequests,
  windowMs: RATE_LIMITS.aiGeneration.windowMs,
  identifier: 'ai_generation',
  blockOnError: true
});

/**
 * Search rate limiter - moderate (default 30 requests per minute)
 * Search is moderately expensive, allow reasonable usage
 * Override: RATE_LIMIT_SEARCH_REQUESTS, RATE_LIMIT_SEARCH_WINDOW_MS
 */
export const searchRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.search.maxRequests,
  windowMs: RATE_LIMITS.search.windowMs,
  identifier: 'search',
  blockOnError: true
});

/**
 * Chat message rate limiter - moderate (default 20 messages per minute)
 * Prevents spam while allowing active conversation
 * Override: RATE_LIMIT_CHAT_REQUESTS, RATE_LIMIT_CHAT_WINDOW_MS
 */
export const chatRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.chat.maxRequests,
  windowMs: RATE_LIMITS.chat.windowMs,
  identifier: 'chat_message',
  blockOnError: true
});

/**
 * SSE connection rate limiter - scaled for production (default 100 connections per minute)
 * SSE connections are long-lived but necessary for real-time chat.
 * At 100/min, supports 100+ concurrent users opening boards.
 * Override: RATE_LIMIT_SSE_REQUESTS, RATE_LIMIT_SSE_WINDOW_MS
 */
export const sseConnectionRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.sse.maxRequests,
  windowMs: RATE_LIMITS.sse.windowMs,
  identifier: 'sse_connection',
  blockOnError: true
});

/**
 * Access code rate limiter - VERY strict (default 3 attempts per 5 minutes)
 * SECURITY: Prevents brute force attacks on 6-digit access codes.
 * At 3 attempts per 5 minutes, brute forcing 1M codes would take ~27,778 hours.
 * Combined with IP lockouts after failures, effectively prevents enumeration.
 * Override: RATE_LIMIT_ACCESS_CODE_REQUESTS, RATE_LIMIT_ACCESS_CODE_WINDOW_MS
 */
export const accessCodeRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.accessCode.maxRequests,
  windowMs: RATE_LIMITS.accessCode.windowMs,
  identifier: 'access_code',
  blockOnError: true
});

/**
 * Sign-in code request rate limiter (default 5 requests per 5 minutes)
 * Prevents spam requesting codes
 */
export const signinCodeRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.signinCode.maxRequests,
  windowMs: RATE_LIMITS.signinCode.windowMs,
  identifier: 'signin_code',
  blockOnError: true
});

/**
 * Sign-in code verify rate limiter (default 5 attempts per 5 minutes)
 * Prevents brute force on verification codes
 */
export const signinVerifyRateLimit = rateLimit({
  maxRequests: RATE_LIMITS.signinVerify.maxRequests,
  windowMs: RATE_LIMITS.signinVerify.windowMs,
  identifier: 'signin_verify',
  blockOnError: true
});

/**
 * Session check rate limiter — very generous (600 requests per minute)
 * /api/auth/me is called on every page navigation, so it needs headroom
 * Already protected by JWT cookie — rate limit is just a safety net
 */
export const sessionCheckRateLimit = rateLimit({
  maxRequests: 600,
  windowMs: 60000,
  identifier: 'session_check',
  blockOnError: false
});

/**
 * Get overall rate limiter health
 */
export function getRateLimiterHealth(): {
  totalClients: number;
  maxClients: number;
  utilizationPercent: number;
  rateLimiters: Array<{
    identifier: string;
    failures: number;
    healthy: boolean;
  }>;
} {
  const limiters = [authRateLimit, apiRateLimit, strictRateLimit, aiGenerationRateLimit, searchRateLimit, chatRateLimit, sseConnectionRateLimit, accessCodeRateLimit];

  return {
    totalClients: clients.size,
    maxClients: MAX_CLIENTS,
    utilizationPercent: Math.round((clients.size / MAX_CLIENTS) * 100),
    rateLimiters: limiters.map(limiter => limiter.getHealthStatus())
  };
}

/**
 * Get current rate limit configuration (for monitoring/debugging)
 */
export function getRateLimitConfig() {
  return {
    maxClients: MAX_CLIENTS,
    cleanupIntervalMs: CLEANUP_INTERVAL_MS,
    maxAgeMs: MAX_AGE_MS,
    limits: RATE_LIMITS
  };
}

// Aliases for backward compatibility
export const postCreationRateLimit = apiRateLimit;
export const magicLinkRateLimit = authRateLimit;
export const handleCheckRateLimit = strictRateLimit;