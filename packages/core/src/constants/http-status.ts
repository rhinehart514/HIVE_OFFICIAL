/**
 * HTTP Status Codes
 *
 * Standard HTTP status codes to avoid magic numbers across API routes.
 * Use these constants instead of hardcoded numbers.
 *
 * @example
 * import { HTTP } from '@hive/core/constants';
 * return new Response(JSON.stringify(data), { status: HTTP.OK });
 */

export const HTTP = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HTTP)[keyof typeof HTTP];

/**
 * Helper to check if a status code indicates success (2xx)
 */
export function isSuccessStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

/**
 * Helper to check if a status code indicates a client error (4xx)
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/**
 * Helper to check if a status code indicates a server error (5xx)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}
