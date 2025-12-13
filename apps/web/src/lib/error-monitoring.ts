/**
 * Error Monitoring Stub
 * Placeholder for error monitoring/tracking functionality
 */

/**
 * Log levels for error tracking
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Capture and report an error
 */
export function captureError(
  error: Error | string,
  context?: Record<string, unknown>,
  level: LogLevel = LogLevel.ERROR
): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${level.toUpperCase()}]`, errorObj.message, context);
  }

  // In production, this would send to an error monitoring service
  // For now, just log it
  trackError(errorObj, { ...context, level });
}

export interface ApiCallMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  error?: string;
}

/**
 * Track API call metrics
 * In production, this would send data to an error monitoring service
 */
export function trackApiCall(metrics: ApiCallMetrics): void {
  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    const emoji = metrics.success ? '✅' : '❌';
    console.log(
      `${emoji} [API] ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode} (${metrics.duration}ms)`
    );
  }
}

/**
 * Track an error for monitoring
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  console.error('[Error Monitoring]', error.message, context);
}

/**
 * Initialize error monitoring (no-op in development)
 */
export function initErrorMonitoring(): void {
  console.log('[Error Monitoring] Initialized (development mode)');
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string): void {
  console.log('[Error Monitoring] User context set:', { userId, email });
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  console.log('[Error Monitoring] User context cleared');
}
