// @ts-nocheck
// TODO: Fix type issues
/**
 * HIVE Platform Middleware
 *
 * Consolidated middleware system that eliminates duplication across 200+ API routes
 *
 * Usage Examples:
 *
 * // Basic auth + error handling (most common)
 * export const POST = withAuthAndErrors(async (request, context) => {
 *   const userId = getUserId(request);
 *   // ... handler logic
 *   return respond.success({ userId });
 * });
 *
 * // Admin-only route
 * export const DELETE = withAdminAuthAndErrors(async (request, context) => {
 *   // ... admin logic
 *   return respond.noContent();
 * });
 *
 * // Public route with error handling
 * export const GET = withErrors(async (request, context) => {
 *   // ... public logic
 *   return respond.success(data);
 * });
 */

// Core middleware
export {
  withAuth,
  withAdminAuth,
  getUserId,
  getUserEmail,
  getCampusId,
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
import { withAuth, withAdminAuth, type AuthenticatedHandler } from './auth';
import { withErrorHandling, type ApiHandler } from './error-handler';
import { withResponse, type ResponseFormatter } from './response';
import { type z } from 'zod';

// Define RouteParams type for dynamic route parameters
type RouteParams = Record<string, string | string[]>;

/**
 * Most common pattern: Auth + Error Handling + Response Formatting
 * Replaces 15+ lines of boilerplate in most protected routes
 */
export function withAuthAndErrors<T = RouteParams>(
  handler: (
    request: Request,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>
): ApiHandler {
  return withErrorHandling(
    withAuth(
      withResponse(handler as (req: Request, ctx: unknown, respond: typeof ResponseFormatter) => Promise<Response>)
    )
  );
}

/**
 * Admin routes pattern: Admin Auth + Error Handling + Response Formatting
 */
export function withAdminAuthAndErrors<T = RouteParams>(
  handler: (
    request: Request,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>
): ApiHandler {
  return withErrorHandling(
    withAdminAuth(
      withResponse(handler as (req: Request, ctx: unknown, respond: typeof ResponseFormatter) => Promise<Response>)
    )
  );
}

/**
 * Public routes pattern: Error Handling + Response Formatting only
 */
export function withErrors<T>(
  handler: (
    request: Request,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>
): ApiHandler {
  return withErrorHandling(
    withResponse(handler)
  );
}

/**
 * Optional auth pattern: Attempts auth but doesn't fail if missing
 * Useful for endpoints that behave differently for authenticated vs public users
 *
 * Usage: Request will have auth info attached if available, but won't 401 if missing
 */
export function withOptionalAuth<T = RouteParams>(
  handler: (
    request: Request,
    context: T,
    respond: typeof ResponseFormatter
  ) => Promise<Response>
): ApiHandler {
  return withErrorHandling(async (request, context) => {
    // Try to attach auth info without failing
    try {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { authAdmin } = await import('@/lib/firebase-admin');
        const decodedToken = await authAdmin.verifyIdToken(token);

        // Attach auth info to request
        (request as any).user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          campusId: (decodedToken as any).campusId || 'ub-buffalo'
        };
      }
    } catch {
      // Auth failed or missing - continue without auth
      // This is intentional for optional auth
    }

    return withResponse(handler as (req: Request, ctx: unknown, respond: typeof ResponseFormatter) => Promise<Response>)(request, context);
  });
}

/**
 * Validation middleware for POST/PUT routes
 * Combines JSON parsing + Zod validation + error handling
 */
export function withValidation<TSchema, TContext>(
  schema: z.ZodSchema<TSchema>,
  handler: (
    request: Request,
    context: TContext,
    body: TSchema,
    respond: typeof ResponseFormatter
  ) => Promise<Response>
): ApiHandler {
  return withErrorHandling(async (request, context) => {
    const { validateRequestBody } = await import('./error-handler');
    const body = await validateRequestBody(request, schema);
    return withResponse(
      async (req, ctx, respond) => handler(req, ctx as TContext, body, respond)
    )(request, context);
  });
}

/**
 * Full stack middleware: Auth + Validation + Error Handling + Response
 * For protected routes that need request validation
 */
export function withAuthValidationAndErrors<TSchema, TContext>(
  schema: z.ZodSchema<TSchema>,
  handler: (
    request: Request,
    context: TContext,
    body: TSchema,
    respond: typeof ResponseFormatter
  ) => Promise<Response>
): ApiHandler {
  return withAuthAndErrors(async (request, context, respond) => {
    const { validateRequestBody } = await import('./error-handler');
    const body = await validateRequestBody(request, schema);
    return handler(request, context as TContext, body, respond);
  });
}
