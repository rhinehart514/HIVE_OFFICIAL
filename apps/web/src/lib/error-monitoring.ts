/**
 * Error Monitoring with Sentry Integration
 *
 * Production-ready error monitoring that:
 * - Uses Sentry when NEXT_PUBLIC_SENTRY_DSN is configured
 * - Falls back to console logging when Sentry is not available
 * - Maintains consistent API for all error tracking
 *
 * Environment variables:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN for error reporting
 * - SENTRY_ORG: Sentry organization slug (for source maps)
 * - SENTRY_PROJECT: Sentry project slug (for source maps)
 *
 * Install: pnpm add @sentry/nextjs
 */

import { currentEnvironment } from './env';

// ============================================================================
// TYPES
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ApiCallMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  error?: string;
}

interface SentryLike {
  captureException: (error: Error, options?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  init: (options: Record<string, unknown>) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENABLED = !!SENTRY_DSN;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

let sentryClient: SentryLike | null = null;
let initializationPromise: Promise<void> | null = null;

// ============================================================================
// SENTRY INITIALIZATION
// ============================================================================

/**
 * Lazily initialize Sentry SDK
 * Uses dynamic import to avoid bundle impact when Sentry is not configured
 */
async function getSentryClient(): Promise<SentryLike | null> {
  if (!SENTRY_ENABLED) return null;
  if (sentryClient) return sentryClient;

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        // Use eval to completely hide the import from webpack static analysis
        // This prevents build errors when @sentry/nextjs is not installed
        const moduleName = '@sentry/nextjs';
        const dynamicImport = new Function('moduleName', 'return import(moduleName)');
        const Sentry = await dynamicImport(moduleName);
        sentryClient = Sentry as unknown as SentryLike;
      } catch {
        console.warn('[Error Monitoring] @sentry/nextjs not installed, using console fallback');
        sentryClient = null;
      }
    })();
  }

  await initializationPromise;
  return sentryClient;
}

// ============================================================================
// CONSOLE FALLBACK
// ============================================================================

function consoleCapture(
  error: Error,
  context?: Record<string, unknown>,
  level: LogLevel = LogLevel.ERROR
): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';

  switch (level) {
    case LogLevel.DEBUG:
      console.warn(`[${timestamp}] [DEBUG]`, error.message, contextStr);
      break;
    case LogLevel.INFO:
      console.warn(`[${timestamp}] [INFO]`, error.message, contextStr);
      break;
    case LogLevel.WARN:
      console.warn(`[${timestamp}] [WARN]`, error.message, contextStr);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(`[${timestamp}] [${level.toUpperCase()}]`, error.message, error.stack, contextStr);
      break;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialize error monitoring
 * Call this in your app's entry point (e.g., _app.tsx or layout.tsx)
 */
export async function initErrorMonitoring(): Promise<void> {
  if (!SENTRY_ENABLED) {
    if (IS_DEVELOPMENT) {
      console.warn('[Error Monitoring] Development mode - using console fallback');
    }
    return;
  }

  const sentry = await getSentryClient();
  if (sentry) {
    console.warn(`[Error Monitoring] Sentry initialized for ${currentEnvironment}`);
  }
}

/**
 * Capture and report an error
 */
export async function captureError(
  error: Error | string,
  context?: Record<string, unknown>,
  level: LogLevel = LogLevel.ERROR
): Promise<void> {
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  // Always log in development
  if (IS_DEVELOPMENT) {
    consoleCapture(errorObj, context, level);
  }

  // Send to Sentry in production
  if (SENTRY_ENABLED) {
    const sentry = await getSentryClient();
    if (sentry) {
      // Add context as extras
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          sentry.setExtra(key, value);
        });
      }

      // Set severity level tag
      sentry.setTag('level', level);
      sentry.setTag('environment', currentEnvironment);

      // Capture the exception
      if (level === LogLevel.FATAL || level === LogLevel.ERROR) {
        sentry.captureException(errorObj);
      } else {
        sentry.captureMessage(errorObj.message, level);
      }
    }
  }

  // Also track internally
  trackError(errorObj, { ...context, level });
}

/**
 * Track API call metrics
 * Creates breadcrumbs for API calls to help debug issues
 */
export async function trackApiCall(metrics: ApiCallMetrics): Promise<void> {
  // Development logging
  if (IS_DEVELOPMENT) {
    const status = metrics.success ? 'OK' : 'FAIL';
    console.warn(
      `${status} [API] ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode} (${metrics.duration}ms)`
    );
  }

  // Add Sentry breadcrumb for API call
  if (SENTRY_ENABLED) {
    const sentry = await getSentryClient();
    if (sentry) {
      sentry.addBreadcrumb({
        category: 'api',
        message: `${metrics.method} ${metrics.endpoint}`,
        level: metrics.success ? 'info' : 'error',
        data: {
          statusCode: metrics.statusCode,
          duration: metrics.duration,
          success: metrics.success,
          error: metrics.error,
        },
      });
    }
  }
}

/**
 * Track an error for monitoring (internal use)
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  // In production without Sentry, still log to console
  if (!IS_DEVELOPMENT && !SENTRY_ENABLED) {
    consoleCapture(error, context);
  }
}

/**
 * Set user context for error tracking
 * Helps identify which user experienced an error
 */
export async function setUserContext(userId: string, email?: string): Promise<void> {
  if (IS_DEVELOPMENT) {
    console.warn('[Error Monitoring] User context set:', { userId, email: email || 'N/A' });
  }

  if (SENTRY_ENABLED) {
    const sentry = await getSentryClient();
    if (sentry) {
      sentry.setUser({
        id: userId,
        email: email,
      });
    }
  }
}

/**
 * Clear user context (on logout)
 */
export async function clearUserContext(): Promise<void> {
  if (IS_DEVELOPMENT) {
    console.warn('[Error Monitoring] User context cleared');
  }

  if (SENTRY_ENABLED) {
    const sentry = await getSentryClient();
    if (sentry) {
      sentry.setUser(null);
    }
  }
}

/**
 * Add a breadcrumb for debugging
 * Breadcrumbs help trace the sequence of events leading to an error
 */
export async function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (IS_DEVELOPMENT) {
    console.warn(`[Breadcrumb] [${category}] ${message}`, data || '');
  }

  if (SENTRY_ENABLED) {
    const sentry = await getSentryClient();
    if (sentry) {
      sentry.addBreadcrumb({
        category,
        message,
        data,
        level: 'info',
      });
    }
  }
}

/**
 * Set a tag for error filtering in Sentry
 */
export async function setTag(key: string, value: string): Promise<void> {
  if (SENTRY_ENABLED) {
    const sentry = await getSentryClient();
    if (sentry) {
      sentry.setTag(key, value);
    }
  }
}

/**
 * Get error monitoring health status
 */
export async function getErrorMonitoringHealth(): Promise<{
  enabled: boolean;
  initialized: boolean;
  dsn: string | null;
  environment: string;
}> {
  const sentry = await getSentryClient();

  return {
    enabled: SENTRY_ENABLED,
    initialized: sentry !== null,
    dsn: SENTRY_DSN ? '***configured***' : null,
    environment: currentEnvironment,
  };
}
