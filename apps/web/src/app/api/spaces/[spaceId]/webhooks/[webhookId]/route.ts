"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthValidationAndErrors,
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import {
  Webhook,
  isValidEventType,
  type WebhookEventType,
  type WebhookProps,
} from "@hive/core/domain";

/**
 * Schema for updating a webhook
 */
const UpdateWebhookSchema = z.object({
  url: z.string().url().startsWith("https://").optional(),
  events: z.array(z.string()).min(1).max(20).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["active", "paused"]).optional(),
});

/**
 * Convert Firestore document to Webhook entity
 */
function docToWebhook(doc: FirebaseFirestore.DocumentSnapshot): Webhook {
  const data = doc.data()!;
  const props: WebhookProps = {
    url: data.url,
    spaceId: data.spaceId,
    campusId: data.campusId,
    events: data.events || [],
    status: data.status || "active",
    signingSecret: data.signingSecret,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    description: data.description,
    failureCount: data.failureCount || 0,
    lastSuccessAt: data.lastSuccessAt?.toDate(),
    lastFailureAt: data.lastFailureAt?.toDate(),
    lastFailureMessage: data.lastFailureMessage,
  };
  return Webhook.reconstitute(props, doc.id);
}

/**
 * Validate events
 */
function validateEvents(events: string[]): { valid: boolean; invalid: string[] } {
  const invalid = events.filter((e) => !isValidEventType(e));
  return { valid: invalid.length === 0, invalid };
}

/**
 * GET /api/spaces/[spaceId]/webhooks/[webhookId]
 *
 * Get a specific webhook (leaders only)
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; webhookId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId, webhookId } = await params;

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, "admin");
  if (!permCheck.hasPermission) {
    const code = permCheck.code === "NOT_FOUND" ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    const status = permCheck.code === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const webhookDoc = await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("webhooks")
      .doc(webhookId)
      .get();

    if (!webhookDoc.exists) {
      return respond.error("Webhook not found", "RESOURCE_NOT_FOUND", {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const webhookData = webhookDoc.data()!;
    if (webhookData.campusId !== campusId) {
      return respond.error("Webhook not found", "RESOURCE_NOT_FOUND", {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const webhook = docToWebhook(webhookDoc);

    // Get recent delivery logs
    const deliveryLogsSnapshot = await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("webhooks")
      .doc(webhookId)
      .collection("deliveryLogs")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    const deliveryLogs = deliveryLogsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        eventType: data.eventType,
        eventId: data.eventId,
        timestamp: data.timestamp?.toDate()?.toISOString(),
        success: data.success,
        statusCode: data.statusCode,
        error: data.error,
        attemptCount: data.attemptCount,
        durationMs: data.durationMs,
      };
    });

    return respond.success({
      webhook: webhook.toSafeObject(),
      deliveryLogs,
    });
  } catch (error) {
    logger.error("Failed to get webhook", {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      webhookId,
      userId,
      endpoint: "/api/spaces/[spaceId]/webhooks/[webhookId]",
    });
    return respond.error("Failed to get webhook", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * PATCH /api/spaces/[spaceId]/webhooks/[webhookId]
 *
 * Update a webhook (leaders only)
 */
export const PATCH = withAuthValidationAndErrors(
  UpdateWebhookSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string; webhookId: string }> },
    body: z.infer<typeof UpdateWebhookSchema>,
    respond
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId, webhookId } = await params;

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, "admin");
    if (!permCheck.hasPermission) {
      const code = permCheck.code === "NOT_FOUND" ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      const status = permCheck.code === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      return respond.error(permCheck.error ?? "Permission denied", code, { status });
    }

    try {
      const webhookRef = dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("webhooks")
        .doc(webhookId);

      const webhookDoc = await webhookRef.get();

      if (!webhookDoc.exists) {
        return respond.error("Webhook not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const webhookData = webhookDoc.data()!;
      if (webhookData.campusId !== campusId) {
        return respond.error("Webhook not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const webhook = docToWebhook(webhookDoc);

      // Apply updates
      const updates: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (body.url !== undefined) {
        const urlResult = webhook.updateUrl(body.url);
        if (urlResult.isFailure) {
          return respond.error(
            urlResult.error || "Invalid URL",
            "VALIDATION_ERROR",
            { status: HttpStatus.BAD_REQUEST }
          );
        }
        updates.url = body.url;
        // Reset failure count on URL change
        updates.failureCount = 0;
        updates.lastFailureAt = null;
        updates.lastFailureMessage = null;
      }

      if (body.events !== undefined) {
        const eventValidation = validateEvents(body.events);
        if (!eventValidation.valid) {
          return respond.error(
            `Invalid event types: ${eventValidation.invalid.join(", ")}`,
            "VALIDATION_ERROR",
            { status: HttpStatus.BAD_REQUEST }
          );
        }
        const eventsResult = webhook.updateEvents(body.events as WebhookEventType[]);
        if (eventsResult.isFailure) {
          return respond.error(
            eventsResult.error || "Invalid events",
            "VALIDATION_ERROR",
            { status: HttpStatus.BAD_REQUEST }
          );
        }
        updates.events = body.events;
      }

      if (body.description !== undefined) {
        webhook.updateDescription(body.description || undefined);
        updates.description = body.description;
      }

      if (body.status !== undefined) {
        if (body.status === "paused") {
          webhook.pause();
        } else {
          const resumeResult = webhook.resume();
          if (resumeResult.isFailure) {
            return respond.error(
              resumeResult.error || "Cannot resume webhook",
              "VALIDATION_ERROR",
              { status: HttpStatus.BAD_REQUEST }
            );
          }
        }
        updates.status = body.status;
      }

      await webhookRef.update(updates);

      // Log activity
      await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("activity")
        .add({
          type: "webhook_updated",
          performedBy: userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            webhookId,
            changes: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined),
          },
        });

      logger.info("Webhook updated", {
        spaceId,
        webhookId,
        userId,
        changes: Object.keys(updates),
        endpoint: "/api/spaces/[spaceId]/webhooks/[webhookId]",
      });

      // Fetch updated webhook
      const updatedDoc = await webhookRef.get();
      const updatedWebhook = docToWebhook(updatedDoc);

      return respond.success({
        webhook: updatedWebhook.toSafeObject(),
      });
    } catch (error) {
      logger.error("Failed to update webhook", {
        error: error instanceof Error ? error.message : String(error),
        spaceId,
        webhookId,
        userId,
        endpoint: "/api/spaces/[spaceId]/webhooks/[webhookId]",
      });
      return respond.error("Failed to update webhook", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

/**
 * DELETE /api/spaces/[spaceId]/webhooks/[webhookId]
 *
 * Delete a webhook (leaders only)
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string; webhookId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId, webhookId } = await params;

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, "admin");
  if (!permCheck.hasPermission) {
    const code = permCheck.code === "NOT_FOUND" ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    const status = permCheck.code === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const webhookRef = dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("webhooks")
      .doc(webhookId);

    const webhookDoc = await webhookRef.get();

    if (!webhookDoc.exists) {
      return respond.error("Webhook not found", "RESOURCE_NOT_FOUND", {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const webhookData = webhookDoc.data()!;
    if (webhookData.campusId !== campusId) {
      return respond.error("Webhook not found", "RESOURCE_NOT_FOUND", {
        status: HttpStatus.NOT_FOUND,
      });
    }

    // Delete webhook and its delivery logs
    const batch = dbAdmin.batch();

    // Delete delivery logs
    const logsSnapshot = await webhookRef.collection("deliveryLogs").get();
    for (const doc of logsSnapshot.docs) {
      batch.delete(doc.ref);
    }

    // Delete webhook
    batch.delete(webhookRef);

    await batch.commit();

    // Log activity
    await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("activity")
      .add({
        type: "webhook_deleted",
        performedBy: userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: {
          webhookId,
          url: webhookData.url,
        },
      });

    logger.info("Webhook deleted", {
      spaceId,
      webhookId,
      userId,
      endpoint: "/api/spaces/[spaceId]/webhooks/[webhookId]",
    });

    return respond.success({
      message: "Webhook deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete webhook", {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      webhookId,
      userId,
      endpoint: "/api/spaces/[spaceId]/webhooks/[webhookId]",
    });
    return respond.error("Failed to delete webhook", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});
