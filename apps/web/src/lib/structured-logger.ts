/**
 * Structured Logger - Re-exports from unified logger
 *
 * This file exists for backwards compatibility.
 * New code should import directly from '@/lib/logger'
 */

import { logger, logSecurityEvent } from './logger';
export { logger, logSecurityEvent };
export type { Logger, LogContext, LogLevel } from './logger';

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      logger.info(message, { ...data, requestId, userId }),
    warn: (message: string, data?: Record<string, unknown>) =>
      logger.warn(message, { ...data, requestId, userId }),
    error: (message: string, data?: Record<string, unknown>) =>
      logger.error(message, { ...data, requestId, userId }),
    debug: (message: string, data?: Record<string, unknown>) =>
      logger.debug(message, { ...data, requestId, userId }),
  };
}

/**
 * Log API call metrics
 */
export async function logApiCall(
  method: string,
  path: string,
  options: {
    requestId?: string;
    userId?: string;
    statusCode?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  logger.info(`API ${method} ${path}`, {
    method,
    path,
    ...options,
  });
}

/**
 * Log performance metrics
 */
export async function logPerformance(
  operation: string,
  options: {
    duration: number;
    success: boolean;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  logger.info(`Performance: ${operation}`, {
    operation,
    ...options,
  });
}
