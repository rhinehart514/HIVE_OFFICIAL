/**
 * Unified Logger for HIVE Platform
 *
 * Provides structured logging with support for:
 * - Different log levels (debug, info, warn, error)
 * - Contextual metadata
 * - Server and client environments
 * - Production-safe logging (no sensitive data leakage)
 * - Request timing and performance tracking
 * - Structured JSON output for log aggregation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  campusId?: string;
  endpoint?: string;
  requestId?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  /** Error logger - accepts context and/or error object. If second arg is Error, it's treated as the error. */
  error: (message: string, contextOrError?: LogContext | Error, error?: Error) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

/**
 * Format log as structured JSON for production, human-readable for development
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();

  // In production, output structured JSON for log aggregators
  if (!isDevelopment && isServer) {
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  // In development, output human-readable format
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (context && Object.keys(context).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(context)}`;
  }

  return `${prefix} ${message}`;
}

/**
 * Sanitize context to remove sensitive data in production
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context || isDevelopment) return context;

  const sanitized = { ...context };

  // Remove potentially sensitive fields in production
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
    if (sanitized.metadata && field in sanitized.metadata) {
      delete sanitized.metadata[field];
    }
  }

  return sanitized;
}

/**
 * Send log to server in production (for client-side logs)
 */
async function sendToServer(level: LogLevel, message: string, context?: LogContext, error?: Error): Promise<void> {
  // Only send errors to server in production
  if (isDevelopment || isServer || level !== 'error') return;

  try {
    await fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        context: sanitizeContext(context),
        error: error ? { message: error.message, stack: error.stack } : undefined,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    });
  } catch {
    // Silently fail - we don't want logging to break the app
  }
}

/**
 * Create the logger instance
 */
function createLogger(): Logger {
  return {
    debug(message: string, context?: LogContext) {
      if (isDevelopment) {
        console.warn(formatLog('debug', message, sanitizeContext(context)));
      }
    },

    info(message: string, context?: LogContext) {
      if (isDevelopment) {
        console.warn(formatLog('info', message, sanitizeContext(context)));
      }
    },

    warn(message: string, context?: LogContext) {
      console.warn(formatLog('warn', message, sanitizeContext(context)));
    },

    error(message: string, contextOrError?: LogContext | Error, error?: Error) {
      // Handle case where second arg is an Error object
      let context: LogContext | undefined;
      let errorObj: Error | undefined = error;

      if (contextOrError instanceof Error) {
        errorObj = contextOrError;
        context = undefined;
      } else {
        context = contextOrError;
      }

      const sanitizedContext = sanitizeContext(context);
      console.error(formatLog('error', message, sanitizedContext));

      if (errorObj) {
        console.error('Stack trace:', errorObj.stack);
      }

      // Send to server for monitoring
      sendToServer('error', message, sanitizedContext, errorObj);
    },
  };
}

// Export singleton logger instance
export const logger = createLogger();

/**
 * Security event types for authentication and access control
 */
export type SecurityEventType =
  | 'rate_limit'
  | 'validation_failure'
  | 'suspicious_activity'
  | 'blocked_request'
  | 'admin_access'
  | 'invalid_token'
  | 'unauthorized_access'
  | 'bypass_attempt'
  | 'auth'
  | 'session_expired'
  | 'csrf_failure';

/**
 * Security event details interface
 */
export interface SecurityEventDetails {
  ip?: string;
  userId?: string;
  endpoint?: string;
  reason?: string;
  path?: string;
  operation?: string;
  userAgent?: string;
  requestId?: string;
  tags?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

/**
 * Log security-related events
 * Used by rate limiting, input validation, auth, and security monitoring
 */
export function logSecurityEvent(
  eventType: SecurityEventType,
  details: SecurityEventDetails
): void {
  const context: LogContext = {
    action: 'security_event',
    component: 'security',
    ...details,
    metadata: {
      eventType,
      ...details.tags,
      ...details.metadata,
    },
  };

  // Always log security events (even in production)
  if (eventType === 'blocked_request' || eventType === 'suspicious_activity' || eventType === 'admin_access') {
    logger.warn(`Security event: ${eventType}`, context);
  } else {
    logger.info(`Security event: ${eventType}`, context);
  }
}

/**
 * API Request Logger - Creates a logger with automatic request context
 * Use this at the start of API routes for consistent request logging
 */
export interface ApiRequestLogger {
  /** Log the start of an API request */
  start: (message?: string, extra?: Record<string, unknown>) => void;
  /** Log the successful end of an API request with timing */
  end: (message?: string, extra?: Record<string, unknown>) => void;
  /** Log an error during request processing */
  fail: (error: Error | string, extra?: Record<string, unknown>) => void;
  /** Log info during request processing */
  info: (message: string, extra?: Record<string, unknown>) => void;
  /** Log warning during request processing */
  warn: (message: string, extra?: Record<string, unknown>) => void;
  /** Get current request duration in ms */
  getDuration: () => number;
}

/**
 * Create a logger for an API request with automatic timing and context
 */
export function createApiRequestLogger(
  method: string,
  path: string,
  options: {
    requestId?: string;
    userId?: string;
    campusId?: string;
  } = {}
): ApiRequestLogger {
  const startTime = Date.now();
  const { requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, userId, campusId } = options;

  const baseContext: LogContext = {
    method,
    path,
    requestId,
    ...(userId && { userId }),
    ...(campusId && { campusId }),
  };

  return {
    start(message = 'Request started', extra = {}) {
      logger.info(message, { ...baseContext, ...extra, action: 'request_start' });
    },

    end(message = 'Request completed', extra = {}) {
      const duration = Date.now() - startTime;
      logger.info(message, {
        ...baseContext,
        ...extra,
        duration,
        action: 'request_end',
      });
    },

    fail(error: Error | string, extra = {}) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error(`Request failed: ${errorMessage}`, {
        ...baseContext,
        ...extra,
        duration,
        action: 'request_error',
        errorMessage,
        ...(errorStack && isDevelopment && { errorStack }),
      });
    },

    info(message: string, extra = {}) {
      logger.info(message, { ...baseContext, ...extra });
    },

    warn(message: string, extra = {}) {
      logger.warn(message, { ...baseContext, ...extra });
    },

    getDuration() {
      return Date.now() - startTime;
    },
  };
}

/**
 * Wrap an error with context for better debugging
 * Use this when catching errors to preserve context
 */
export function wrapError(
  error: unknown,
  context: {
    action: string;
    userId?: string;
    resourceId?: string;
    extra?: Record<string, unknown>;
  }
): Error {
  const originalError = error instanceof Error ? error : new Error(String(error));
  const wrappedMessage = `[${context.action}] ${originalError.message}`;

  const wrappedError = new Error(wrappedMessage);
  wrappedError.stack = originalError.stack;
  (wrappedError as Error & { context: typeof context }).context = context;

  return wrappedError;
}

/**
 * Extract error context for logging
 */
export function extractErrorContext(error: unknown): {
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, unknown>;
} {
  if (error instanceof Error) {
    const errorWithContext = error as Error & {
      code?: string;
      context?: Record<string, unknown>;
    };
    return {
      message: error.message,
      code: errorWithContext.code,
      stack: isDevelopment ? error.stack : undefined,
      context: errorWithContext.context,
    };
  }

  return {
    message: String(error),
  };
}

// Export types for consumers
export type { Logger, LogContext, LogLevel };
