/**
 * Domain Event Publisher
 *
 * Handles dispatching domain events from aggregates to registered handlers.
 * Follows the mediator pattern for decoupled event handling.
 */

import type { DomainEvent } from '../../domain/shared/base/DomainEvent.base';
import type { AggregateRoot } from '../../domain/shared/base/AggregateRoot.base';

/**
 * Event handler interface
 */
export interface IDomainEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle a domain event
   */
  handle(event: T): Promise<void>;

  /**
   * Returns the event types this handler can process
   */
  handlesEvents(): string[];
}

/**
 * Event subscriber interface for subscribing to specific event types
 */
export interface IEventSubscriber {
  /**
   * Subscribe to an event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void;

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}

/**
 * Domain Event Publisher
 *
 * Singleton service that dispatches domain events to registered handlers.
 */
export class DomainEventPublisher implements IEventSubscriber {
  private static instance: DomainEventPublisher;
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();
  private globalHandlers: Array<IDomainEventHandler> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DomainEventPublisher {
    if (!DomainEventPublisher.instance) {
      DomainEventPublisher.instance = new DomainEventPublisher();
    }
    return DomainEventPublisher.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    DomainEventPublisher.instance = new DomainEventPublisher();
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as (event: DomainEvent) => Promise<void>);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Unsubscribe from a specific event type
   */
  unsubscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Register a global event handler
   */
  registerHandler(handler: IDomainEventHandler): void {
    this.globalHandlers.push(handler);
  }

  /**
   * Unregister a global event handler
   */
  unregisterHandler(handler: IDomainEventHandler): void {
    const index = this.globalHandlers.indexOf(handler);
    if (index > -1) {
      this.globalHandlers.splice(index, 1);
    }
  }

  /**
   * Publish a single domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.getEventName();

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(eventName) || [];
    await Promise.all(typeHandlers.map(handler => handler(event)));

    // Call global handlers that handle this event type
    const globalPromises = this.globalHandlers
      .filter(h => h.handlesEvents().includes(eventName) || h.handlesEvents().includes('*'))
      .map(h => h.handle(event));
    await Promise.all(globalPromises);
  }

  /**
   * Publish all domain events from an aggregate and clear them
   */
  async publishEventsFromAggregate<TProps>(aggregate: AggregateRoot<TProps>): Promise<void> {
    const events = [...aggregate.domainEvents];
    aggregate.clearEvents();

    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Publish events from multiple aggregates
   */
  async publishEventsFromAggregates<TProps>(aggregates: AggregateRoot<TProps>[]): Promise<void> {
    for (const aggregate of aggregates) {
      await this.publishEventsFromAggregate(aggregate);
    }
  }
}

/**
 * Get the domain event publisher singleton
 */
export function getDomainEventPublisher(): DomainEventPublisher {
  return DomainEventPublisher.getInstance();
}
