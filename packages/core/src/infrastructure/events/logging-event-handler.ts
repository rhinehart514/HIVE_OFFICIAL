/**
 * Logging Event Handler
 *
 * Default handler that logs all domain events for audit purposes.
 */

import type { DomainEvent } from '../../domain/shared/base/DomainEvent.base';
import type { IDomainEventHandler } from './domain-event-publisher';

/**
 * Logger interface to avoid coupling to specific logging implementation
 */
export interface IEventLogger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Default console logger
 */
const defaultLogger: IEventLogger = {
  info: (message, context) => console.info(`[DomainEvent] ${message}`, context),
  error: (message, context) => console.error(`[DomainEvent] ${message}`, context),
};

/**
 * Logging Event Handler
 *
 * Logs all domain events for audit and debugging purposes.
 */
export class LoggingEventHandler implements IDomainEventHandler {
  constructor(private logger: IEventLogger = defaultLogger) {}

  /**
   * Handle any domain event by logging it
   */
  async handle(event: DomainEvent): Promise<void> {
    this.logger.info(`Domain event: ${event.getEventName()}`, {
      eventName: event.getEventName(),
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      eventData: this.serializeEvent(event),
    });
  }

  /**
   * This handler processes all events
   */
  handlesEvents(): string[] {
    return ['*']; // Wildcard - handles all events
  }

  /**
   * Serialize event for logging (extracts public properties)
   */
  private serializeEvent(event: DomainEvent): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};
    for (const key of Object.keys(event)) {
      if (!key.startsWith('_')) {
        serialized[key] = (event as unknown as Record<string, unknown>)[key];
      }
    }
    return serialized;
  }
}

/**
 * Create a logging handler with custom logger
 */
export function createLoggingEventHandler(logger?: IEventLogger): LoggingEventHandler {
  return new LoggingEventHandler(logger);
}
