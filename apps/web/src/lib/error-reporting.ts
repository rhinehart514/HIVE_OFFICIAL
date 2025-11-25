/**
 * Error Reporting Service
 *
 * Provides a unified interface for reporting errors to external services.
 * In development, errors are logged to console. In production, this could
 * be integrated with services like Sentry, LogRocket, or Datadog.
 */

import { logger } from './logger';

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  context?: string;
  retryCount?: number;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Error reporting service that handles sending errors to external services
 */
export const errorReporting = {
  /**
   * Report an error to the error tracking service
   */
  async reportError(report: ErrorReport): Promise<void> {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development, just log to console
    if (isDevelopment) {
      logger.error('Error Report', {
        errorId: report.errorId,
        message: report.message,
        context: report.context,
        retryCount: report.retryCount,
        url: report.url,
      });
      return;
    }

    // In production, you would send to external service (Sentry, etc.)
    // For now, we log to the structured logger which can be picked up by observability tools
    try {
      logger.error('Production Error Report', {
        errorId: report.errorId,
        message: report.message,
        stack: report.stack,
        componentStack: report.componentStack,
        context: report.context,
        retryCount: report.retryCount,
        userAgent: report.userAgent,
        url: report.url,
        timestamp: new Date().toISOString(),
        ...report.metadata,
      });

      // TODO: Integrate with external error tracking service
      // Example for Sentry:
      // if (typeof Sentry !== 'undefined') {
      //   Sentry.captureException(new Error(report.message), {
      //     extra: report,
      //     tags: { errorId: report.errorId, context: report.context }
      //   });
      // }
    } catch (sendError) {
      // Silently fail in production to avoid cascading errors
      console.error('Failed to send error report:', sendError);
    }
  },

  /**
   * Set user context for error reports
   */
  setUserContext(user: { id?: string; email?: string; campusId?: string }): void {
    // In production, this would set user context in error tracking service
    // Example for Sentry:
    // Sentry.setUser({ id: user.id, email: user.email });
    logger.info('Error reporting user context set', { userId: user.id, campusId: user.campusId });
  },

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    // In production, this would clear user context
    // Example for Sentry:
    // Sentry.setUser(null);
    logger.info('Error reporting user context cleared');
  },
};

export default errorReporting;
