/**
 * Structured Logger - Re-exports from unified logger
 *
 * This file exists for backwards compatibility.
 * New code should import directly from '@/lib/logger'
 */

import {
  logger,
  logSecurityEvent,
  createApiRequestLogger,
  wrapError,
  extractErrorContext,
} from './logger';
export {
  logger,
  logSecurityEvent,
  createApiRequestLogger,
  wrapError,
  extractErrorContext,
};
export type {
  Logger,
  LogContext,
  LogLevel,
  SecurityEventType,
  SecurityEventDetails,
  ApiRequestLogger,
} from './logger';

/**
 * Create a request-scoped logger
 */
export function createRequestLogger(requestId: string, userId?: string, campusId?: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      logger.info(message, { ...data, requestId, userId, campusId }),
    warn: (message: string, data?: Record<string, unknown>) =>
      logger.warn(message, { ...data, requestId, userId, campusId }),
    error: (message: string, data?: Record<string, unknown>) =>
      logger.error(message, { ...data, requestId, userId, campusId }),
    debug: (message: string, data?: Record<string, unknown>) =>
      logger.debug(message, { ...data, requestId, userId, campusId }),
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
    campusId?: string;
    statusCode?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const level = options.statusCode && options.statusCode >= 400 ? 'warn' : 'info';
  const slowRequest = options.duration && options.duration > 1000;

  logger[level](`API ${method} ${path}`, {
    method,
    path,
    action: 'api_call',
    ...options,
    ...(slowRequest && { slowRequest: true }),
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
    campusId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const level = options.success ? 'info' : 'warn';
  const slowOperation = options.duration > 1000;

  logger[level](`Performance: ${operation}`, {
    operation,
    action: 'performance',
    ...options,
    ...(slowOperation && { slowOperation: true }),
  });
}

/**
 * Log database operation metrics
 */
export async function logDbOperation(
  operation: string,
  collection: string,
  options: {
    duration: number;
    success: boolean;
    userId?: string;
    documentId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const level = options.success ? 'debug' : 'warn';

  logger[level](`DB ${operation} on ${collection}`, {
    operation,
    collection,
    action: 'db_operation',
    ...options,
  });
}
