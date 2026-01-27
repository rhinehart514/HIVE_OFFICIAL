/**
 * Webhooks Domain Export
 *
 * Domain layer for webhook subscriptions and event delivery.
 * Webhooks enable external systems to receive real-time notifications
 * about events occurring within spaces.
 *
 * @version 1.0.0
 */

// Entity (Aggregate Root)
export { Webhook } from "./webhook.entity";
export type {
  WebhookProps,
  CreateWebhookProps,
  WebhookStatus,
} from "./webhook.entity";

// Event Types
export {
  WEBHOOK_EVENT_TYPES,
  SPACE_MEMBER_EVENTS,
  SPACE_EVENT_EVENTS,
  SPACE_CONTENT_EVENTS,
  SPACE_LIFECYCLE_EVENTS,
  TOOL_EVENTS,
  WEBHOOK_EVENT_CATEGORIES,
  getEventTypeLabel,
  isValidEventType,
  getAllEventTypes,
} from "./event-types";
export type { WebhookEventType } from "./event-types";

// Event Payloads
export { createWebhookEvent } from "./webhook-event";
export type {
  WebhookEventBase,
  WebhookEventPayload,
  MemberJoinedPayload,
  MemberRemovedPayload,
  MemberRoleChangedPayload,
  MemberSuspendedPayload,
  MemberUnsuspendedPayload,
  EventCreatedPayload,
  EventUpdatedPayload,
  EventCancelledPayload,
  EventRsvpPayload,
  EventRsvpCancelledPayload,
  PostCreatedPayload,
  PostUpdatedPayload,
  PostDeletedPayload,
  CommentCreatedPayload,
  SpaceCreatedPayload,
  SpaceUpdatedPayload,
  SpaceWentLivePayload,
  SpaceArchivedPayload,
  ToolDeployedPayload,
  ToolSubmittedPayload,
  ToolUsagePayload,
} from "./webhook-event";
