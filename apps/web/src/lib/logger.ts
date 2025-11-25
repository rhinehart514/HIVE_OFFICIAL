/**
 * Unified Logger for HIVE Platform
 *
 * Provides structured logging with support for:
 * - Different log levels (debug, info, warn, error)
 * - Contextual metadata
 * - Server and client environments
 * - Production-safe logging (no sensitive data leakage)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext, error?: Error) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isServer = typeof window === 'undefined';

/**
 * Format log message with timestamp and level
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
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

    error(message: string, context?: LogContext, error?: Error) {
      const sanitizedContext = sanitizeContext(context);
      console.error(formatLog('error', message, sanitizedContext));

      if (error) {
        console.error('Stack trace:', error.stack);
      }

      // Send to server for monitoring
      sendToServer('error', message, sanitizedContext, error);
    },
  };
}

// Export singleton logger instance
export const logger = createLogger();

/**
 * Log security-related events
 * Used by rate limiting, input validation, and security monitoring
 */
export function logSecurityEvent(
  eventType: 'rate_limit' | 'validation_failure' | 'suspicious_activity' | 'blocked_request',
  details: {
    ip?: string;
    userId?: string;
    endpoint?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const context: LogContext = {
    action: 'security_event',
    component: 'security',
    ...details,
    metadata: {
      eventType,
      ...details.metadata,
    },
  };

  // Always log security events (even in production)
  if (eventType === 'blocked_request' || eventType === 'suspicious_activity') {
    logger.warn(`Security event: ${eventType}`, context);
  } else {
    logger.info(`Security event: ${eventType}`, context);
  }
}

// Export types for consumers
export type { Logger, LogContext, LogLevel };
