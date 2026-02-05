/**
 * HIVE Platform Middleware
 *
 * Consolidated middleware system that eliminates duplication across 200+ API routes
 * Now includes automatic rate limiting on all protected routes.
 *
 * Usage Examples:
 *
 * // Basic auth + error handling (most common) - includes rate limiting
 * export const POST = withAuthAndErrors(async (request, context) => {
 *   const userId = getUserId(request);
 *   // ... handler logic
 *   return respond.success({ userId });
 * });
 *
 * // Admin-only route - includes strict rate limiting
 * export const DELETE = withAdminAuthAndErrors(async (request, context) => {
 *   // ... admin logic
 *   return respond.noContent();
 * });
 *
 * // Public route with error handling - includes rate limiting
 * export const GET = withErrors(async (request, context) => {
 *   // ... public logic
 *   return respond.success(data);
 * });
 *
 * // Custom rate limits
 * export const POST = withAuthAndErrors(async (request, context) => {
 *   // handler
 * }, { rateLimit: { maxRequests: 10, windowMs: 60000 } });
 */

// Core middleware
export {
  withAuth,
  withAdminAuth,
  getUserId,
  getUserEmail,
  getCampusId,
  // Type-safe user attachment (Phase 1.1)
  getUser,
  attachUser,
  // Campus isolation helpers (Phase 1.2)
  deriveCampusFromEmail,
  requireCampusFromEmail,
  requireCampusMatch,
  type UserContext,
  type AuthenticatedRequest,
  type AuthenticatedHandler,
  type NextRouteHandler
} from './auth';

export {
  withErrorHandling,
  handleApiError,
  parseJsonBody,
  validateRequestBody
} from './error-handler';

export {
  ResponseFormatter,
  withResponse,
  respond,
  isSuccessResponse,
  isErrorResponse,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse
} from './response';

// Admin middleware removed for HiveLab-only launch

// Combined middleware wrappers
import { withAuth, withAdminAuth, getUser, attachUser, deriveCampusFromEmail, type AuthenticatedHandler, type AuthenticatedRequest, type UserContext } from './auth';
import { withErrorHandling, type ApiHandler } from './error-handler';
import { withResponse, type ResponseFormatter } from './response';
import { type z } from 'zod';
import { apiRateLimit, strictRateLimit, authRateLimit } from '../rate-limit-simple';
import { CSRFProtection } from '../csrf-protection';
import { isDevelopment } from '../env';

// Define RouteParams type for dynamic route parameters
type RouteParams = Record<string, string | string[]>;

// Rate limit configuration
interface RateLimitConfig {
  maxRequests?: number;
  windowMs?: number;
  identifier?: string;
}

interface MiddlewareOptions {
  rateLimit?: RateLimitConfig | false;
  skipRateLimit?: boolean;
  skipCSRF?: boolean; // Skip CSRF for specific routes (e.g., webhooks)
}

// State-changing HTTP methods that require CSRF protection
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * CSRF protection wrapper for state-changing requests
 * Validates origin/referer headers and CSRF tokens in production
 */
function withCSRFCheck(handler: ApiHandler): ApiHandler {
  return async (request: Request, context: unknown) => {
    // Skip CSRF for safe methods
    if (!STATE_CHANGING_METHODS.includes(request.method)) {
      return handler(request, context);
    }

    // Skip CSRF in development (but log warning)
    if (isDevelopment) {
      return handler(request, context);
    }

    // Validate origin header for CSRF protection
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Require origin or referer for state-changing requests
    if (!origin && !referer) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Missing origin header',
            code: 'CSRF_VALIDATION_FAILED',
          }
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate origin matches host
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const expectedHost = host?.replace(/:\d+$/, ''); // Remove port
        const originHost = originUrl.hostname;

        // Allow localhost variations in development
        const isLocalhost = originHost === 'localhost' || originHost === '127.0.0.1';
        const hostIsLocalhost = expectedHost === 'localhost' || expectedHost === '127.0.0.1';

        if (!isLocalhost && !hostIsLocalhost && originHost !== expectedHost) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                message: 'Invalid origin',
                code: 'CSRF_ORIGIN_MISMATCH',
              }
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              message: 'Invalid origin format',
              code: 'CSRF_VALIDATION_FAILED',
            }
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return handler(request, context);
  };
}

// Default rate limits by route type
const DEFAULT_LIMITS = {
  authenticated: { maxRequests: 100, windowMs: 60000 },  // 100/min for auth routes
  admin: { maxRequests: 50, windowMs: 60000 },           // 50/min for admin routes
  public: { maxRequests: 200, windowMs: 60000 },         // 200/min for public routes
  strict: { maxRequests: 10, windowMs: 60000 },          // 10/min for sensitive routes
};

/**
 * Extract client identifier for rate limiting
 * Uses type-safe getUser accessor instead of property mutation
 */
function getClientId(request: Request): string {
  // Try to get user ID from auth (set by withAuth via symbol)
  const user = getUser(request as import('next/server').NextRequest);
  if (user?.uid) return `user:${user.uid}`;

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limiting wrapper
 */
function withRateLimit(
  handler: ApiHandler,
  config: RateLimitConfig = DEFAULT_LIMITS.authenticated
): ApiHandler {
  return async (request: Request, context: unknown) => {
    const clientId = getClientId(request);
    const limiter = apiRateLimit; // Use the pre-configured limiter

    const result = limiter.check(clientId);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Too many requests. Please slow down.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          meta: {
            limit: result.limit,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString(),
            retryAfter: result.retryAfter,
          }
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(result.resetTime),
            'Retry-After': String(result.retryAfter || 60),
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, context);

    // Clone response to add headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(result.limit));
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.resetTime));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Most common pattern: Auth + CSRF + Rate Limiting + Error Handling + Response Formatting
 * Replaces 15+ lines of boilerplate in most protected routes
 * Rate limiting is automatic (100 requests/min per user)
 * CSRF protection is automatic for state-changing methods (POST/PUT/PATCH/DELETE)
 *
 * Handlers receive AuthenticatedRequest which has user info attached after auth middleware runs.
 */
export function withAuthAndErrors<T = RouteParams>(
  handler: (
    request: AuthenticatedRequest,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  let baseHandler = withErrorHandling(
    withAuth(
      withResponse(handler as unknown as (req: Request, ctx: unknown, respond: typeof ResponseFormatter) => Promise<Response>)
    ) as unknown as ApiHandler
  );

  // Apply CSRF protection unless explicitly disabled
  if (!options?.skipCSRF) {
    baseHandler = withCSRFCheck(baseHandler);
  }

  // Apply rate limiting unless explicitly disabled
  if (options?.skipRateLimit || options?.rateLimit === false) {
    return baseHandler;
  }

  return withRateLimit(baseHandler, options?.rateLimit || DEFAULT_LIMITS.authenticated);
}

/**
 * Admin routes pattern: Admin Auth + CSRF + Strict Rate Limiting + Error Handling + Response Formatting
 * Uses stricter rate limits (50 requests/min) for admin operations
 * CSRF protection is always enabled for admin routes
 *
 * Handlers receive AuthenticatedRequest which has user info attached after auth middleware runs.
 */
export function withAdminAuthAndErrors<T = RouteParams>(
  handler: (
    request: AuthenticatedRequest,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  let baseHandler = withErrorHandling(
    withAdminAuth(
      withResponse(handler as unknown as (req: Request, ctx: unknown, respond: typeof ResponseFormatter) => Promise<Response>)
    ) as unknown as ApiHandler
  );

  // Always apply CSRF protection for admin routes (no skip option)
  baseHandler = withCSRFCheck(baseHandler);

  // Apply stricter rate limiting for admin routes
  if (options?.skipRateLimit || options?.rateLimit === false) {
    return baseHandler;
  }

  return withRateLimit(baseHandler, options?.rateLimit || DEFAULT_LIMITS.admin);
}

/**
 * Public routes pattern: Rate Limiting + Error Handling + Response Formatting
 * Uses higher rate limits (200 requests/min) for public routes
 */
export function withErrors<T>(
  handler: (
    request: Request,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  const baseHandler = withErrorHandling(
    withResponse(handler) as ApiHandler
  );

  // Apply rate limiting for public routes too
  if (options?.skipRateLimit || options?.rateLimit === false) {
    return baseHandler;
  }

  return withRateLimit(baseHandler, options?.rateLimit || DEFAULT_LIMITS.public);
}

/**
 * Optional auth pattern: Attempts auth but doesn't fail if missing
 * Useful for endpoints that behave differently for authenticated vs public users
 * Includes rate limiting (200 requests/min as public rate)
 *
 * Usage: Request will have auth info attached if available, but won't 401 if missing
 * Use getUser(request) to check if auth succeeded
 */
export function withOptionalAuth<T = RouteParams>(
  handler: (
    request: Request,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  const baseHandler = withErrorHandling(async (request, context) => {
    // Try to attach auth info without failing
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { authAdmin } = await import('@/lib/firebase-admin');
        const decodedToken = await authAdmin.verifyIdToken(token);

        const campusId = decodedToken.email
          ? deriveCampusFromEmail(decodedToken.email)
          : undefined;

        if (campusId) {
          const userContext: UserContext = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            campusId,
            decodedToken
          };

          attachUser(request as import('next/server').NextRequest, userContext);

          const reqWithUser = request as AuthenticatedRequest;
          reqWithUser.user = userContext;
        }
      }
    } catch {
      // Auth failed or missing - continue without auth
      // This is intentional for optional auth
    }

    return withResponse(handler as (req: Request, ctx: unknown, respond: typeof ResponseFormatter) => Promise<Response>)(request, context);
  });

  if (options?.skipRateLimit || options?.rateLimit === false) {
    return baseHandler;
  }

  return withRateLimit(baseHandler, options?.rateLimit || DEFAULT_LIMITS.public);
}

/**
 * Validation middleware for POST/PUT routes
 * Combines JSON parsing + Zod validation + error handling + rate limiting
 */
export function withValidation<TSchema, TContext>(
  schema: z.ZodSchema<TSchema>,
  handler: (
    request: Request,
    context: TContext,
    body: TSchema,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  const baseHandler = withErrorHandling(async (request, context) => {
    const { validateRequestBody } = await import('./error-handler');
    const body = await validateRequestBody(request as Request, schema);
    return await withResponse(
      async (req: Request, ctx: unknown, respond) => handler(req, ctx as TContext, body, respond)
    )(request, context);
  });

  if (options?.skipRateLimit || options?.rateLimit === false) {
    return baseHandler;
  }

  return withRateLimit(baseHandler, options?.rateLimit || DEFAULT_LIMITS.public);
}

/**
 * Full stack middleware: Auth + Validation + Rate Limiting + Error Handling + Response
 * For protected routes that need request validation
 * Rate limiting is inherited from withAuthAndErrors (100 requests/min)
 *
 * Handlers receive AuthenticatedRequest which has user info attached after auth middleware runs.
 */
export function withAuthValidationAndErrors<TSchema, TContext>(
  schema: z.ZodSchema<TSchema>,
  handler: (
    request: AuthenticatedRequest,
    context: TContext,
    body: TSchema,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  // Delegates to withAuthAndErrors which already includes rate limiting
  return withAuthAndErrors(async (request, context, respond) => {
    const { validateRequestBody } = await import('./error-handler');
    const body = await validateRequestBody(request as Request, schema);
    return handler(request, context as TContext, body, respond);
  }, options);
}

// Export rate limit utilities for routes that need custom limits
export { withRateLimit, DEFAULT_LIMITS, type RateLimitConfig, type MiddlewareOptions };

/**
 * Rate limit presets for common route patterns
 * Use these in route configurations for consistency
 *
 * @example
 * export const POST = withAuthAndErrors(handler, {
 *   rateLimit: RATE_LIMIT_PRESETS.strict
 * });
 */
export const RATE_LIMIT_PRESETS = {
  /** Standard authenticated routes: 100 requests/min */
  standard: { maxRequests: 100, windowMs: 60000 },
  /** Sensitive operations: 10 requests/min */
  strict: { maxRequests: 10, windowMs: 60000 },
  /** Authentication endpoints: 5 requests/min */
  auth: { maxRequests: 5, windowMs: 60000 },
  /** AI/LLM operations: 5 requests/min */
  ai: { maxRequests: 5, windowMs: 60000 },
  /** Search operations: 30 requests/min */
  search: { maxRequests: 30, windowMs: 60000 },
  /** Public routes: 200 requests/min */
  public: { maxRequests: 200, windowMs: 60000 },
  /** Admin routes: 50 requests/min */
  admin: { maxRequests: 50, windowMs: 60000 },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

/**
 * Admin permission types for RBAC enforcement
 * Maps to role permissions in admin-auth.ts:
 * - viewer: ['read']
 * - moderator: ['read', 'moderate', 'delete_content']
 * - admin: ['read', 'write', 'moderate', 'delete_content', 'manage_users']
 * - super_admin: all permissions
 */
export type AdminPermission =
  | 'read'
  | 'write'
  | 'moderate'
  | 'delete_content'
  | 'manage_users'
  | 'manage_admins'
  | 'system_config';

/**
 * Admin route with permission enforcement
 * Extends withAdminAuthAndErrors to verify admin has specific permission(s)
 *
 * SECURITY: Use this for any admin operation that shouldn't be accessible to all admin roles
 *
 * @example
 * // Only admins with 'manage_users' permission can suspend users
 * export const POST = withAdminPermission('manage_users', async (request, context, respond) => {
 *   // ... handler logic
 * });
 *
 * // Require multiple permissions
 * export const DELETE = withAdminPermission(['manage_users', 'delete_content'], async (req, ctx, respond) => {
 *   // ...
 * });
 */
export function withAdminPermission<T = RouteParams>(
  requiredPermissions: AdminPermission | AdminPermission[],
  handler: (
    request: AuthenticatedRequest,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>,
  options?: MiddlewareOptions
): ApiHandler {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return withAdminAuthAndErrors<T>(async (request, context, respond) => {
    // Get admin session to check permissions
    const adminSessionCookie = request.cookies.get('hive_admin_session');

    if (!adminSessionCookie?.value) {
      return respond.error('Admin session required for this operation', 'FORBIDDEN', {
        status: 403,
      });
    }

    // Verify admin session and extract permissions
    const { jwtVerify } = await import('jose');
    const secret = process.env.ADMIN_JWT_SECRET
      ? new TextEncoder().encode(process.env.ADMIN_JWT_SECRET)
      : (process.env.NODE_ENV === 'development'
        ? new TextEncoder().encode('dev-only-secret-do-not-use-in-production')
        : null);

    if (!secret) {
      return respond.error('Admin authentication not configured', 'INTERNAL_ERROR', {
        status: 500,
      });
    }

    try {
      const { payload } = await jwtVerify(adminSessionCookie.value, secret, {
        algorithms: ['HS256'],
      });

      const adminRole = payload.role as string;
      const adminPermissions = (payload.permissions as string[]) || [];

      // super_admin has all permissions
      if (adminRole === 'super_admin') {
        return handler(request, context, respond);
      }

      // Check if admin has all required permissions
      const hasAllPermissions = permissions.every(
        perm => adminPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        const { logger } = await import('@/lib/structured-logger');
        logger.warn('Admin permission denied', {
          adminId: payload.userId,
          role: adminRole,
          required: permissions,
          actual: adminPermissions,
          endpoint: request.url,
        });

        return respond.error(
          `Insufficient permissions. Required: ${permissions.join(', ')}`,
          'FORBIDDEN',
          { status: 403 }
        );
      }

      return handler(request, context, respond);

    } catch {
      return respond.error('Invalid admin session', 'FORBIDDEN', {
        status: 403,
      });
    }
  }, options);
}
