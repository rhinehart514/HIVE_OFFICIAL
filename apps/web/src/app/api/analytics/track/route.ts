import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { logger } from "@/lib/logger";
import {
  withOptionalAuth,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";

/**
 * POST /api/analytics/track
 *
 * Fire-and-forget analytics endpoint.
 *
 * Accepts two payload shapes:
 *
 * 1. Simple (from useAnalytics hook):
 *    { name: string, properties?: Record<string, unknown> }
 *
 * 2. Batched (from structured analytics pipeline):
 *    { events: Array<{ eventId, sessionId, timestamp, category, ... }>,
 *      privacyPreferences?: { analyticsOptOut?: boolean } }
 *
 * This endpoint uses optional auth — it works for both unauthenticated
 * (onboarding) and authenticated users. It should NEVER return an error
 * to the client; analytics must not block UX.
 */
export const POST = withOptionalAuth(
  async (request, _context, respond) => {
    try {
      const body = await (request as Request).json().catch(() => null);

      if (!body || typeof body !== "object") {
        // Invalid body — return 200 anyway, analytics is fire-and-forget
        return respond.success({ tracked: 0 });
      }

      // Extract user context if available (optional auth)
      let userId: string | null = null;
      let campusId: string | null = null;
      try {
        userId = getUserId(request as AuthenticatedRequest);
        campusId = getCampusId(request as AuthenticatedRequest);
      } catch {
        // Not authenticated — that's fine for analytics
      }

      // Detect payload shape
      const isSimpleFormat = typeof body.name === "string";
      const isBatchFormat = Array.isArray(body.events);

      if (isSimpleFormat) {
        // Simple format: { name, properties }
        const eventData = {
          type: body.name,
          properties: body.properties || {},
          userId: userId || "anonymous",
          campusId: campusId || null,
          source: "client",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Fire and forget — don't await
        dbAdmin
          .collection("activityEvents")
          .add(eventData)
          .catch((err: unknown) => {
            logger.warn("Failed to write simple analytics event", {
              type: body.name,
              error: err instanceof Error ? err.message : String(err),
            });
          });

        return respond.success({ tracked: 1 });
      }

      if (isBatchFormat) {
        // Batched format: { events: [...], privacyPreferences? }
        const events = body.events as Array<Record<string, unknown>>;

        if (body.privacyPreferences?.analyticsOptOut) {
          return respond.success({
            tracked: 0,
            discarded: events.length,
            reason: "opt_out",
          });
        }

        const processedEvents: Array<Record<string, unknown>> = [];

        for (const event of events.slice(0, 100)) {
          try {
            processedEvents.push({
              eventId: event.eventId || undefined,
              userId: userId || "anonymous",
              campusId: campusId || null,
              sessionId: event.sessionId || undefined,
              timestamp:
                typeof event.timestamp === "string"
                  ? event.timestamp
                  : new Date().toISOString(),
              category: event.category || "custom",
              type: event.eventType || event.type || "unknown",
              metadata: event.metadata || {},
              properties: event.properties || {},
              source: "client_batch",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } catch {
            // Skip malformed events
          }
        }

        if (processedEvents.length > 0) {
          // Fire and forget
          const batch = dbAdmin.batch();
          const ref = dbAdmin.collection("activityEvents");
          for (const eventData of processedEvents) {
            batch.set(ref.doc(), eventData);
          }
          batch.commit().catch((err: unknown) => {
            logger.warn("Failed to write batched analytics events", {
              count: processedEvents.length,
              error: err instanceof Error ? err.message : String(err),
            });
          });
        }

        return respond.success({
          tracked: processedEvents.length,
        });
      }

      // Unknown format — still return 200
      logger.warn("Unknown analytics payload format", {
        keys: Object.keys(body).slice(0, 10),
      });
      return respond.success({ tracked: 0 });
    } catch (error) {
      // Analytics should never fail. Log and return 200.
      logger.warn("Analytics track error (swallowed)", {
        error: error instanceof Error ? error.message : String(error),
      });
      return respond.success({ tracked: 0 });
    }
  },
  { skipCSRF: true, rateLimit: { maxRequests: 200, windowMs: 60000 } }
);
