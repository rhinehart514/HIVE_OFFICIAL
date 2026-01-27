/**
 * Webhook Event Types Registry
 *
 * Defines all webhook event types that can be subscribed to.
 * Events follow a namespace.action pattern for clarity.
 *
 * @version 1.0.0
 */

/**
 * Space member events
 */
export const SPACE_MEMBER_EVENTS = {
  JOINED: "space.member.joined",
  REMOVED: "space.member.removed",
  ROLE_CHANGED: "space.member.role_changed",
  SUSPENDED: "space.member.suspended",
  UNSUSPENDED: "space.member.unsuspended",
} as const;

/**
 * Space event events (calendar/meetings)
 */
export const SPACE_EVENT_EVENTS = {
  EVENT_CREATED: "space.event.created",
  EVENT_UPDATED: "space.event.updated",
  EVENT_CANCELLED: "space.event.cancelled",
  EVENT_RSVP: "space.event.rsvp",
  EVENT_RSVP_CANCELLED: "space.event.rsvp_cancelled",
} as const;

/**
 * Space content events
 */
export const SPACE_CONTENT_EVENTS = {
  POST_CREATED: "space.post.created",
  POST_UPDATED: "space.post.updated",
  POST_DELETED: "space.post.deleted",
  COMMENT_CREATED: "space.comment.created",
} as const;

/**
 * Space lifecycle events
 */
export const SPACE_LIFECYCLE_EVENTS = {
  SPACE_CREATED: "space.created",
  SPACE_UPDATED: "space.updated",
  SPACE_WENT_LIVE: "space.went_live",
  SPACE_ARCHIVED: "space.archived",
} as const;

/**
 * Tool events
 */
export const TOOL_EVENTS = {
  DEPLOYED: "tool.deployed",
  SUBMITTED: "tool.submitted",
  USAGE: "tool.usage",
} as const;

/**
 * All webhook event types combined
 */
export const WEBHOOK_EVENT_TYPES = {
  ...SPACE_MEMBER_EVENTS,
  ...SPACE_EVENT_EVENTS,
  ...SPACE_CONTENT_EVENTS,
  ...SPACE_LIFECYCLE_EVENTS,
  ...TOOL_EVENTS,
} as const;

/**
 * Type for all webhook event type values
 */
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES];

/**
 * Event type categories for grouping in UI
 */
export const WEBHOOK_EVENT_CATEGORIES = {
  members: {
    label: "Member Events",
    description: "Triggered when members join, leave, or change roles",
    events: Object.values(SPACE_MEMBER_EVENTS),
  },
  events: {
    label: "Event Events",
    description: "Triggered for calendar events and RSVPs",
    events: Object.values(SPACE_EVENT_EVENTS),
  },
  content: {
    label: "Content Events",
    description: "Triggered when posts or comments are created",
    events: Object.values(SPACE_CONTENT_EVENTS),
  },
  lifecycle: {
    label: "Space Lifecycle",
    description: "Triggered for space-level changes",
    events: Object.values(SPACE_LIFECYCLE_EVENTS),
  },
  tools: {
    label: "Tool Events",
    description: "Triggered for tool deployments and usage",
    events: Object.values(TOOL_EVENTS),
  },
} as const;

/**
 * Get human-readable label for an event type
 */
export function getEventTypeLabel(eventType: WebhookEventType): string {
  const labels: Record<WebhookEventType, string> = {
    "space.member.joined": "Member Joined",
    "space.member.removed": "Member Removed",
    "space.member.role_changed": "Member Role Changed",
    "space.member.suspended": "Member Suspended",
    "space.member.unsuspended": "Member Unsuspended",
    "space.event.created": "Event Created",
    "space.event.updated": "Event Updated",
    "space.event.cancelled": "Event Cancelled",
    "space.event.rsvp": "Event RSVP",
    "space.event.rsvp_cancelled": "Event RSVP Cancelled",
    "space.post.created": "Post Created",
    "space.post.updated": "Post Updated",
    "space.post.deleted": "Post Deleted",
    "space.comment.created": "Comment Created",
    "space.created": "Space Created",
    "space.updated": "Space Updated",
    "space.went_live": "Space Went Live",
    "space.archived": "Space Archived",
    "tool.deployed": "Tool Deployed",
    "tool.submitted": "Tool Submitted",
    "tool.usage": "Tool Usage",
  };

  return labels[eventType] || eventType;
}

/**
 * Validate if a string is a valid webhook event type
 */
export function isValidEventType(value: string): value is WebhookEventType {
  return Object.values(WEBHOOK_EVENT_TYPES).includes(value as WebhookEventType);
}

/**
 * Get all valid event types as an array
 */
export function getAllEventTypes(): WebhookEventType[] {
  return Object.values(WEBHOOK_EVENT_TYPES);
}
