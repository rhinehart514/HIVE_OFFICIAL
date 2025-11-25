/**
 * API Error Handler
 *
 * Provides structured error handling for API routes:
 * - Custom error types for different scenarios
 * - Consistent error response formatting
 * - Production-safe error messages
 */

import { type NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Rate Limit Error - 429
 */
export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown, request?: NextRequest): NextResponse {
  const requestId = request?.headers.get('x-request-id') || `req_${Date.now()}`;

  // Known API errors
  if (error instanceof ApiError) {
    logger.warn(`API Error: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      endpoint: request?.nextUrl?.pathname,
      metadata: { requestId },
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Unknown errors - log full details server-side, return generic message
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error(`Unhandled API Error: ${err.message}`, {
    endpoint: request?.nextUrl?.pathname,
    metadata: { requestId },
  }, err);

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'An unexpected error occurred' : err.message;

  return NextResponse.json(
    {
      error: message,
      code: 'INTERNAL_ERROR',
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Wrap async route handler with error handling
 */
export function withErrorHandler<T>(
  handler: (request: NextRequest) => Promise<T>
): (request: NextRequest) => Promise<T | NextResponse> {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}
