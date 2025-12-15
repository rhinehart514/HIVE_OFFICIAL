/**
 * Secure Rate Limiter
 *
 * Wraps the simple rate limiter with the enforceRateLimit API
 * that existing code expects.
 */

// Using Request type for broader compatibility with both Next.js API routes and Edge functions
import {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  aiGenerationRateLimit,
  searchRateLimit,
  chatRateLimit,
} from './rate-limit-simple';

// Rate limit presets mapped to simple rate limiters
const RATE_LIMIT_PRESETS = {
  auth: authRateLimit,
  authStrict: strictRateLimit,
  apiGeneral: apiRateLimit,
  api: apiRateLimit,
  strict: strictRateLimit,
  aiGeneration: aiGenerationRateLimit,
  search: searchRateLimit,
  chat: chatRateLimit,
} as const;

type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

interface RateLimitResponse {
  allowed: boolean;
  error?: string;
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Extract secure client ID from request
 */
export function getSecureClientId(request: Request): string {
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
 * Enforce rate limiting with preset configuration
 *
 * @param preset - The rate limit preset to use
 * @param request - The Next.js request object
 * @returns Rate limit result
 */
export async function enforceRateLimit(
  preset: RateLimitPreset | string,
  request: Request
): Promise<RateLimitResponse> {
  const clientId = getSecureClientId(request);
  const limiter = RATE_LIMIT_PRESETS[preset as RateLimitPreset] || apiRateLimit;

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
      },
    };
  }

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetTime),
    },
  };
}

/**
 * Check rate limit without blocking (for monitoring)
 */
export function checkRateLimit(
  preset: RateLimitPreset | string,
  clientId: string
): { allowed: boolean; remaining: number } {
  const limiter = RATE_LIMIT_PRESETS[preset as RateLimitPreset] || apiRateLimit;
  const result = limiter.check(clientId);

  return {
    allowed: result.success,
    remaining: result.remaining,
  };
}
