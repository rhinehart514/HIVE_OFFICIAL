/**
 * Space Domain Events
 *
 * Domain events capture important state changes in the Space aggregate.
 * These can be used for:
 * - Audit logging
 * - Notifications
 * - Cross-aggregate communication
 * - Analytics
 */

import { DomainEvent } from '../../shared/base/DomainEvent.base';

/**
 * Emitted when a new space is created
 */
export class SpaceCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly spaceName: string,
    public readonly slug: string,
    public readonly category: string,
    public readonly createdBy: string,
    public readonly campusId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceCreated';
  }
}

/**
 * Emitted when a user joins a space
 */
export class SpaceMemberJoinedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly spaceName: string,
    public readonly role: string,
    public readonly joinMethod: string,
    public readonly isReactivation: boolean
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceMemberJoined';
  }
}

/**
 * Emitted when a user leaves a space
 */
export class SpaceMemberLeftEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly spaceName: string,
    public readonly previousRole: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceMemberLeft';
  }
}

/**
 * Emitted when space basic info is updated (name, description, visibility, settings)
 */
export class SpaceUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly updates: string[], // List of changed fields
    public readonly updatedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceUpdated';
  }
}

/**
 * Emitted when a new tab is created in the space
 */
export class TabCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly tabId: string,
    public readonly tabName: string,
    public readonly tabType: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'TabCreated';
  }
}

/**
 * Emitted when a tab is updated (name, order, visibility)
 */
export class TabUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly tabId: string,
    public readonly updates: string[] // List of changed fields
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'TabUpdated';
  }
}

/**
 * Emitted when a tab is removed from the space
 */
export class TabRemovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly tabId: string,
    public readonly tabName: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'TabRemoved';
  }
}

/**
 * Emitted when tabs are reordered
 */
export class TabsReorderedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly newOrder: string[] // Ordered tab IDs
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'TabsReordered';
  }
}

/**
 * Emitted when a new widget is created in the space
 */
export class WidgetCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly widgetId: string,
    public readonly widgetType: string,
    public readonly widgetTitle: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'WidgetCreated';
  }
}

/**
 * Emitted when a widget is updated (title, config, order, visibility, enabled)
 */
export class WidgetUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly widgetId: string,
    public readonly updates: string[] // List of changed fields
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'WidgetUpdated';
  }
}

/**
 * Emitted when a widget is removed from the space
 */
export class WidgetRemovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly widgetId: string,
    public readonly widgetTitle: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'WidgetRemoved';
  }
}

/**
 * Emitted when a widget is attached to a tab
 */
export class WidgetAttachedToTabEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly widgetId: string,
    public readonly tabId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'WidgetAttachedToTab';
  }
}

/**
 * Emitted when a widget is detached from a tab
 */
export class WidgetDetachedFromTabEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly widgetId: string,
    public readonly tabId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'WidgetDetachedFromTab';
  }
}
