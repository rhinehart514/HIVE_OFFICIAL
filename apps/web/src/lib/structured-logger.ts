/**
 * Structured Logger - Re-exports from unified logger
 *
 * This file exists for backwards compatibility.
 * New code should import directly from '@/lib/logger'
 */

export { logger, logSecurityEvent } from './logger';
export type { Logger, LogContext, LogLevel } from './logger';
