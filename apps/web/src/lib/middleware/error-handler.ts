import type { NextResponse } from 'next/server';
import type { z } from 'zod';

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * API Handler type
 */
export type ApiHandler = (
  request: Request,
  context: unknown
) => Promise<Response>;

/**
 * Wraps an API handler with error handling
 */
export function withErrorHandling(
  handler: ApiHandler
): ApiHandler {
  return async (request: Request, context: unknown) => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      console.error('[API Error]', error);

      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = (error as { status?: number })?.status || 500;

      return NextResponse.json(
        { error: message },
        { status }
      );
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
  console.error('[API Error]', error);

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
