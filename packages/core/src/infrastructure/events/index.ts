/**
 * Domain Events Infrastructure
 *
 * Event publishing and handling infrastructure for DDD.
 */

export {
  DomainEventPublisher,
  getDomainEventPublisher,
  type IDomainEventHandler,
  type IEventSubscriber,
} from './domain-event-publisher';

export {
  LoggingEventHandler,
  createLoggingEventHandler,
  type IEventLogger,
} from './logging-event-handler';
