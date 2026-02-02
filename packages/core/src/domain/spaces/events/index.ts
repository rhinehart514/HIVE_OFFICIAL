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

// ============================================================
// PlacedTool Events (HiveLab → Spaces Integration)
// ============================================================

/**
 * Emitted when a HiveLab tool is placed into a space
 */
export class ToolPlacedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placementId: string,
    public readonly toolId: string,
    public readonly placement: string,
    public readonly placedBy: string | null,
    public readonly source: 'system' | 'leader' | 'member'
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'ToolPlaced';
  }
}

/**
 * Emitted when a placed tool is updated (config, visibility, order)
 */
export class PlacedToolUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placementId: string,
    public readonly updates: string[]
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'PlacedToolUpdated';
  }
}

/**
 * Emitted when a placed tool is removed from a space
 */
export class ToolRemovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placementId: string,
    public readonly toolId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'ToolRemoved';
  }
}

/**
 * Emitted when a placed tool is activated
 */
export class PlacedToolActivatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placementId: string,
    public readonly toolId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'PlacedToolActivated';
  }
}

/**
 * Emitted when a placed tool is deactivated
 */
export class PlacedToolDeactivatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placementId: string,
    public readonly toolId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'PlacedToolDeactivated';
  }
}

/**
 * Emitted when placed tools are reordered within a placement location
 */
export class PlacedToolsReorderedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placement: string,
    public readonly newOrder: string[]
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'PlacedToolsReordered';
  }
}

/**
 * Emitted when a placed tool's runtime state is updated
 * This is separate from PlacedToolUpdatedEvent which handles config/visibility changes.
 * State updates track runtime data like poll results, calendar data, etc.
 */
export class PlacedToolStateUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly placementId: string,
    public readonly toolId: string,
    public readonly stateKeys: string[]
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'PlacedToolStateUpdated';
  }
}

// ============================================================
// Board Events (Chat Channels)
// ============================================================

/**
 * Emitted when a new board (channel) is created in a space
 */
export class BoardCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly boardId: string,
    public readonly boardName: string,
    public readonly boardType: 'general' | 'topic' | 'event',
    public readonly createdBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'BoardCreated';
  }
}

/**
 * Emitted when a board is updated (name, description, permissions)
 */
export class BoardUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly boardId: string,
    public readonly updates: string[]
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'BoardUpdated';
  }
}

/**
 * Emitted when a board is archived
 */
export class BoardArchivedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly boardId: string,
    public readonly boardName: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'BoardArchived';
  }
}

/**
 * Emitted when a board is deleted
 */
export class BoardDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly boardId: string,
    public readonly boardName: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'BoardDeleted';
  }
}

// ============================================================
// ChatMessage Events
// ============================================================

/**
 * Emitted when a message is sent in a board
 */
export class MessageSentEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly messageId: string,
    public readonly boardId: string,
    public readonly authorId: string,
    public readonly messageType: 'text' | 'inline_component' | 'system',
    public readonly hasInlineComponent: boolean
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'MessageSent';
  }
}

/**
 * Emitted when a message is edited
 */
export class MessageEditedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly messageId: string,
    public readonly boardId: string,
    public readonly editedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'MessageEdited';
  }
}

/**
 * Emitted when a message is deleted
 */
export class MessageDeletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly messageId: string,
    public readonly boardId: string,
    public readonly deletedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'MessageDeleted';
  }
}

/**
 * Emitted when a message is pinned
 */
export class MessagePinnedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly messageId: string,
    public readonly boardId: string,
    public readonly pinnedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'MessagePinned';
  }
}

/**
 * Emitted when a reaction is added to a message
 */
export class ReactionAddedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly messageId: string,
    public readonly boardId: string,
    public readonly emoji: string,
    public readonly userId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'ReactionAdded';
  }
}

// ============================================================
// Inline Component Events
// ============================================================

/**
 * Emitted when a user submits participation to an inline component
 * Used for real-time sync of component state across all clients
 */
export class ParticipationSubmittedEvent extends DomainEvent {
  constructor(
    aggregateId: string, // spaceId
    public readonly componentId: string,
    public readonly userId: string,
    public readonly newAggregations: {
      optionCounts?: Record<string, number>;
      rsvpCounts?: { yes: number; no: number; maybe: number };
      totalResponses: number;
    }
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'ParticipationSubmitted';
  }
}

/**
 * Emitted when an inline component is closed
 */
export class InlineComponentClosedEvent extends DomainEvent {
  constructor(
    aggregateId: string, // spaceId
    public readonly componentId: string,
    public readonly closedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'InlineComponentClosed';
  }
}

// ============================================================
// Space Status Events (Stealth Mode)
// ============================================================

/**
 * Space publishing status
 * - stealth: Space is being set up, only visible to leaders
 * - live: Space is publicly visible and active
 * - rejected: Leader request was rejected, space may be deleted
 */
export type SpacePublishStatus = 'stealth' | 'live' | 'rejected';

/**
 * Emitted when a space's publish status changes
 */
export class SpaceStatusChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly previousStatus: SpacePublishStatus,
    public readonly newStatus: SpacePublishStatus,
    public readonly changedBy: string,
    public readonly reason?: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceStatusChanged';
  }
}

/**
 * Emitted when a space goes live (stealth → live)
 */
export class SpaceWentLiveEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly spaceName: string,
    public readonly launchedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceWentLive';
  }
}

/**
 * Emitted when a space's lifecycle state changes (ADR-007)
 * Tracks transitions in the unified state machine
 */
export class SpaceLifecycleChangedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly previousState: string,
    public readonly newState: string,
    public readonly timestamp: Date
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'SpaceLifecycleChanged';
  }
}
