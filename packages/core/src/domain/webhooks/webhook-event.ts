/**
 * Webhook Event Payload Types
 *
 * Defines the payload structure for each webhook event type.
 * All payloads include common fields plus type-specific data.
 *
 * @version 1.0.0
 */

import type { WebhookEventType } from "./event-types";

/**
 * Common fields present in all webhook event payloads
 */
export interface WebhookEventBase {
  /** Unique event ID for deduplication */
  id: string;
  /** The event type */
  type: WebhookEventType;
  /** ISO 8601 timestamp when the event occurred */
  timestamp: string;
  /** Space ID where the event occurred */
  spaceId: string;
  /** Campus ID for multi-tenant isolation */
  campusId: string;
  /** Optional correlation ID for batch operations */
  batchId?: string;
  /** API version for backward compatibility */
  apiVersion: "1.0";
}

/**
 * Member joined event payload
 */
export interface MemberJoinedPayload extends WebhookEventBase {
  type: "space.member.joined";
  data: {
    userId: string;
    role: "member" | "moderator" | "admin" | "owner" | "guest";
    joinMethod: "invite" | "approval" | "direct" | "link";
    invitedBy?: string;
  };
}

/**
 * Member removed event payload
 */
export interface MemberRemovedPayload extends WebhookEventBase {
  type: "space.member.removed";
  data: {
    userId: string;
    removedBy: string;
    reason?: string;
    wasVoluntary: boolean;
  };
}

/**
 * Member role changed event payload
 */
export interface MemberRoleChangedPayload extends WebhookEventBase {
  type: "space.member.role_changed";
  data: {
    userId: string;
    previousRole: string;
    newRole: string;
    changedBy: string;
  };
}

/**
 * Member suspended event payload
 */
export interface MemberSuspendedPayload extends WebhookEventBase {
  type: "space.member.suspended";
  data: {
    userId: string;
    suspendedBy: string;
    reason?: string;
    expiresAt?: string;
  };
}

/**
 * Member unsuspended event payload
 */
export interface MemberUnsuspendedPayload extends WebhookEventBase {
  type: "space.member.unsuspended";
  data: {
    userId: string;
    unsuspendedBy: string;
  };
}

/**
 * Event created payload
 */
export interface EventCreatedPayload extends WebhookEventBase {
  type: "space.event.created";
  data: {
    eventId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location?: string;
    createdBy: string;
    maxAttendees?: number;
  };
}

/**
 * Event updated payload
 */
export interface EventUpdatedPayload extends WebhookEventBase {
  type: "space.event.updated";
  data: {
    eventId: string;
    changes: Record<string, { old: unknown; new: unknown }>;
    updatedBy: string;
  };
}

/**
 * Event cancelled payload
 */
export interface EventCancelledPayload extends WebhookEventBase {
  type: "space.event.cancelled";
  data: {
    eventId: string;
    cancelledBy: string;
    reason?: string;
  };
}

/**
 * Event RSVP payload
 */
export interface EventRsvpPayload extends WebhookEventBase {
  type: "space.event.rsvp";
  data: {
    eventId: string;
    userId: string;
    status: "attending" | "maybe" | "declined";
    currentAttendees: number;
    maxAttendees?: number;
  };
}

/**
 * Event RSVP cancelled payload
 */
export interface EventRsvpCancelledPayload extends WebhookEventBase {
  type: "space.event.rsvp_cancelled";
  data: {
    eventId: string;
    userId: string;
    currentAttendees: number;
  };
}

/**
 * Post created payload
 */
export interface PostCreatedPayload extends WebhookEventBase {
  type: "space.post.created";
  data: {
    postId: string;
    authorId: string;
    contentPreview: string;
    postType: string;
    hasMedia: boolean;
  };
}

/**
 * Post updated payload
 */
export interface PostUpdatedPayload extends WebhookEventBase {
  type: "space.post.updated";
  data: {
    postId: string;
    updatedBy: string;
    contentPreview: string;
  };
}

/**
 * Post deleted payload
 */
export interface PostDeletedPayload extends WebhookEventBase {
  type: "space.post.deleted";
  data: {
    postId: string;
    deletedBy: string;
    reason?: string;
  };
}

/**
 * Comment created payload
 */
export interface CommentCreatedPayload extends WebhookEventBase {
  type: "space.comment.created";
  data: {
    commentId: string;
    postId: string;
    authorId: string;
    contentPreview: string;
  };
}

/**
 * Space created payload
 */
export interface SpaceCreatedPayload extends WebhookEventBase {
  type: "space.created";
  data: {
    name: string;
    handle: string;
    isPublic: boolean;
    createdBy: string;
    category?: string;
  };
}

/**
 * Space updated payload
 */
export interface SpaceUpdatedPayload extends WebhookEventBase {
  type: "space.updated";
  data: {
    changes: Record<string, { old: unknown; new: unknown }>;
    updatedBy: string;
  };
}

/**
 * Space went live payload
 */
export interface SpaceWentLivePayload extends WebhookEventBase {
  type: "space.went_live";
  data: {
    name: string;
    handle: string;
    memberCount: number;
    launchedBy: string;
  };
}

/**
 * Space archived payload
 */
export interface SpaceArchivedPayload extends WebhookEventBase {
  type: "space.archived";
  data: {
    archivedBy: string;
    reason?: string;
    memberCount: number;
  };
}

/**
 * Tool deployed payload
 */
export interface ToolDeployedPayload extends WebhookEventBase {
  type: "tool.deployed";
  data: {
    toolId: string;
    toolName: string;
    deployedBy: string;
    version: string;
  };
}

/**
 * Tool submitted payload
 */
export interface ToolSubmittedPayload extends WebhookEventBase {
  type: "tool.submitted";
  data: {
    toolId: string;
    userId: string;
    submissionData: Record<string, unknown>;
  };
}

/**
 * Tool usage payload
 */
export interface ToolUsagePayload extends WebhookEventBase {
  type: "tool.usage";
  data: {
    toolId: string;
    userId?: string;
    action: string;
    sessionId?: string;
  };
}

/**
 * Union type of all webhook event payloads
 */
export type WebhookEventPayload =
  | MemberJoinedPayload
  | MemberRemovedPayload
  | MemberRoleChangedPayload
  | MemberSuspendedPayload
  | MemberUnsuspendedPayload
  | EventCreatedPayload
  | EventUpdatedPayload
  | EventCancelledPayload
  | EventRsvpPayload
  | EventRsvpCancelledPayload
  | PostCreatedPayload
  | PostUpdatedPayload
  | PostDeletedPayload
  | CommentCreatedPayload
  | SpaceCreatedPayload
  | SpaceUpdatedPayload
  | SpaceWentLivePayload
  | SpaceArchivedPayload
  | ToolDeployedPayload
  | ToolSubmittedPayload
  | ToolUsagePayload;

/**
 * Create a new webhook event with required base fields
 */
export function createWebhookEvent<T extends WebhookEventPayload>(
  type: T["type"],
  spaceId: string,
  campusId: string,
  data: T["data"],
  options?: { batchId?: string }
): T {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    spaceId,
    campusId,
    apiVersion: "1.0",
    batchId: options?.batchId,
    data,
  } as T;
}
