"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { PrivacyService } from "@hive/core/domain";

/**
 * Base event schema - common fields for all analytics events
 */
const BaseEventSchema = z.object({
  eventId: z.string().min(1),
  sessionId: z.string().min(1),
  timestamp: z.string().datetime().or(z.date()),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Creation event schema (HiveLab, tool builder)
 */
const CreationEventSchema = BaseEventSchema.extend({
  category: z.literal("creation"),
  eventType: z.enum([
    "builder_session_start",
    "builder_session_end",
    "tool_created",
    "tool_updated",
    "tool_published",
    "element_added",
    "element_configured",
    "element_removed",
    "canvas_mode_changed",
    "device_mode_changed",
    "element_library_searched",
    "tool_instance_opened",
    "tool_instance_submitted",
  ]),
  toolId: z.string().optional(),
  elementId: z.string().optional(),
  spaceId: z.string().optional(),
});

/**
 * Feed event schema (posts, spaces, engagement)
 */
const FeedEventSchema = BaseEventSchema.extend({
  category: z.literal("feed"),
  eventType: z.enum([
    "post_created",
    "post_reacted",
    "post_viewed",
    "post_edited",
    "post_deleted",
    "space_joined",
    "space_left",
    "builder_action",
    "space_heartbeat",
    "space_feed_viewed",
  ]),
  postId: z.string().optional(),
  spaceId: z.string(),
});

/**
 * Onboarding event schema
 */
const OnboardingEventSchema = BaseEventSchema.extend({
  category: z.literal("onboarding"),
  stepName: z.enum([
    "welcome",
    "name",
    "academics",
    "handle",
    "photo",
    "builder",
    "legal",
  ]),
  stepIndex: z.number().int().min(0),
  isCompleted: z.boolean(),
  timeSpent: z.number().optional(),
  validationErrors: z.array(z.string()).optional(),
});

/**
 * Generic event schema for custom events
 */
const GenericEventSchema = BaseEventSchema.extend({
  category: z.literal("custom"),
  eventType: z.string().min(1).max(100),
  spaceId: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
});

/**
 * Union of all event types
 */
const AnalyticsEventSchema = z.discriminatedUnion("category", [
  CreationEventSchema,
  FeedEventSchema,
  OnboardingEventSchema,
  GenericEventSchema,
]);

/**
 * Request schema - accepts batched events
 */
const TrackRequestSchema = z.object({
  events: z.array(AnalyticsEventSchema).min(1).max(100),
  privacyPreferences: z.object({
    analyticsOptOut: z.boolean().optional(),
    anonymizeData: z.boolean().optional(),
  }).optional(),
});

type TrackRequest = z.infer<typeof TrackRequestSchema>;
type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

/**
 * POST /api/analytics/track
 *
 * Persist batched analytics events to Firestore.
 * - Validates event schema
 * - Applies privacy filtering
 * - Writes to activityEvents collection
 * - Max 100 events per request
 */
export const POST = withAuthValidationAndErrors(
  TrackRequestSchema,
  async (
    request,
    _context,
    body: TrackRequest,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    const { events, privacyPreferences } = body;

    // Check for opt-out
    if (privacyPreferences?.analyticsOptOut) {
      logger.info("Analytics opt-out, discarding events", {
        userId,
        eventCount: events.length,
        endpoint: "/api/analytics/track",
      });
      return respond.success({
        tracked: 0,
        discarded: events.length,
        reason: "opt_out",
      });
    }

    // Process events
    const processedEvents: Array<Record<string, unknown>> = [];
    const errors: Array<{ eventId: string; error: string }> = [];

    for (const event of events) {
      try {
        // Build base event data
        const baseEvent = {
          eventId: event.eventId,
          userId,
          campusId,
          sessionId: event.sessionId,
          timestamp: typeof event.timestamp === "string"
            ? event.timestamp
            : event.timestamp.toISOString(),
          category: event.category,
          metadata: event.metadata || {},
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add category-specific fields
        let eventData: Record<string, unknown> = baseEvent;

        if (event.category === "creation") {
          eventData = {
            ...eventData,
            type: event.eventType,
            toolId: event.toolId,
            elementId: event.elementId,
            spaceId: event.spaceId,
          };
        } else if (event.category === "feed") {
          eventData = {
            ...eventData,
            type: event.eventType,
            postId: event.postId,
            spaceId: event.spaceId,
          };
        } else if (event.category === "onboarding") {
          eventData = {
            ...eventData,
            type: `onboarding_${event.stepName}`,
            stepName: event.stepName,
            stepIndex: event.stepIndex,
            isCompleted: event.isCompleted,
            timeSpent: event.timeSpent,
            validationErrors: event.validationErrors,
          };
        } else if (event.category === "custom") {
          eventData = {
            ...eventData,
            type: event.eventType,
            spaceId: event.spaceId,
            resourceId: event.resourceId,
            resourceType: event.resourceType,
          };
        }

        // Apply privacy filtering (anonymize if requested)
        if (privacyPreferences?.anonymizeData) {
          const userIdHash = PrivacyService.hashUserId(userId);
          eventData.userId = undefined;
          eventData.userIdHash = userIdHash;
          eventData.anonymized = true;

          // Strip PII from metadata
          if (eventData.metadata && typeof eventData.metadata === "object") {
            const cleanMetadata = { ...eventData.metadata as Record<string, unknown> };
            delete cleanMetadata.email;
            delete cleanMetadata.fullName;
            delete cleanMetadata.ipAddress;
            delete cleanMetadata.phone;
            eventData.metadata = cleanMetadata;
          }
        }

        processedEvents.push(eventData);
      } catch (error) {
        errors.push({
          eventId: event.eventId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Batch write to Firestore
    if (processedEvents.length > 0) {
      const batch = dbAdmin.batch();
      const activityEventsRef = dbAdmin.collection("activityEvents");

      for (const eventData of processedEvents) {
        const docRef = activityEventsRef.doc();
        batch.set(docRef, eventData);
      }

      try {
        await batch.commit();
      } catch (error) {
        logger.error("Failed to write analytics events", {
          userId,
          eventCount: processedEvents.length,
          endpoint: "/api/analytics/track",
        }, error instanceof Error ? error : undefined);

        return respond.error("Failed to persist events", "INTERNAL_ERROR", { status: 500 });
      }
    }

    logger.info("Analytics events tracked", {
      userId,
      tracked: processedEvents.length,
      errors: errors.length,
      endpoint: "/api/analytics/track",
    });

    return respond.success({
      tracked: processedEvents.length,
      discarded: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
);
