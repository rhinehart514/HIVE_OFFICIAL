import { NextResponse } from 'next/server';
import { logger, extractErrorContext } from '../structured-logger';
import type { z } from 'zod';

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * API Handler type
 */
export type ApiHandler = (
  request: Request,
  context: unknown
) => Promise<Response>;

/**
 * Extract user context from request for error logging
 */
function extractRequestContext(request: Request): {
  method: string;
  path: string;
  userId?: string;
  requestId: string;
} {
  const url = new URL(request.url);
  const requestId = request.headers.get('x-request-id') ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Try to extract userId from various sources (set by auth middleware)
  const requestWithUser = request as Request & { user?: { uid?: string } };
  const userId = requestWithUser.user?.uid;

  return {
    method: request.method,
    path: url.pathname,
    requestId,
    ...(userId && { userId }),
  };
}

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandling(
  handler: ApiHandler
): ApiHandler {
  return async (request: Request, context: unknown) => {
    const startTime = Date.now();
    const requestContext = extractRequestContext(request);

    try {
      return await handler(request, context);
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorInfo = extractErrorContext(error);

      logger.error(`API error: ${errorInfo.message}`, {
        ...requestContext,
        duration,
        action: 'api_error',
        component: 'error-handler',
        errorCode: errorInfo.code,
        errorContext: errorInfo.context,
      });

      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = (error as { status?: number })?.status || 500;
      const code = (error as { code?: string })?.code || 'INTERNAL_ERROR';

      const response = NextResponse.json(
        {
          error: message,
          code,
          requestId: requestContext.requestId,
        },
        { status }
      );

      // Add request ID header for tracing
      response.headers.set('X-Request-ID', requestContext.requestId);

      return response;
    }
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
  error: unknown,
  defaultMessage = 'Internal server error'
): NextResponse<ApiErrorResponse> {
  logger.error('API error', { component: 'error-handler' }, error instanceof Error ? error : undefined);

  if (error instanceof Error) {
    const status = (error as { status?: number })?.status || 500;
    return NextResponse.json(
      { error: error.message || defaultMessage },
      { status }
    );
  }

  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseJsonBody<T = unknown>(
  request: Request
): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400 });
  }
}

/**
 * Validate request body against a Zod schema
 * Parses the request JSON body and validates it against the provided schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { status: 400 });
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw Object.assign(new Error(`Validation failed: ${errors}`), { status: 400 });
  }

  return result.data;
}

/**
 * Validate that required fields exist in a body object
 * @deprecated Use validateRequestBody with a Zod schema instead
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: unknown,
  requiredFields: (keyof T)[]
): body is T {
  if (!body || typeof body !== 'object') {
    throw Object.assign(new Error('Request body is required'), { status: 400 });
  }

  for (const field of requiredFields) {
    if (!(field in body)) {
      throw Object.assign(
        new Error(`Missing required field: ${String(field)}`),
        { status: 400 }
      );
    }
  }

  return true;
}
