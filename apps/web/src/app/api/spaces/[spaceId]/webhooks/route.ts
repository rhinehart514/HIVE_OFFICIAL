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
  getAllEventTypes,
  type WebhookEventType,
  type WebhookProps,
} from "@hive/core/domain";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * Schema for creating a new webhook
 */
const CreateWebhookSchema = z.object({
  url: z.string().url().startsWith("https://", { message: "URL must use HTTPS" }),
  events: z.array(z.string()).min(1, "At least one event type is required").max(20),
  description: z.string().max(500).optional(),
});

/**
 * Validate that all events are valid webhook event types
 */
function validateEvents(events: string[]): { valid: boolean; invalid: string[] } {
  const invalid = events.filter((e) => !isValidEventType(e));
  return { valid: invalid.length === 0, invalid };
}

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
 * GET /api/spaces/[spaceId]/webhooks
 *
 * List all webhooks for a space (leaders only)
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, "admin");
  if (!permCheck.hasPermission) {
    const code = permCheck.code === "NOT_FOUND" ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    const status = permCheck.code === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const webhooksSnapshot = await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("webhooks")
      .where("campusId", "==", campusId)
      .orderBy("createdAt", "desc")
      .get();

    const webhooks = webhooksSnapshot.docs.map((doc) => {
      const webhook = docToWebhook(doc);
      return webhook.toSafeObject();
    });

    logger.info("Webhooks listed", {
      spaceId,
      userId,
      count: webhooks.length,
      endpoint: "/api/spaces/[spaceId]/webhooks",
    });

    return respond.success({
      webhooks,
      availableEvents: getAllEventTypes(),
    });
  } catch (error) {
    logger.error("Failed to list webhooks", {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: "/api/spaces/[spaceId]/webhooks",
    });
    return respond.error("Failed to list webhooks", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST /api/spaces/[spaceId]/webhooks
 *
 * Create a new webhook (leaders only)
 */
export const POST = withAuthValidationAndErrors(
  CreateWebhookSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body: z.infer<typeof CreateWebhookSchema>,
    respond
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    // Check leader permission
    const permCheck = await checkSpacePermission(spaceId, userId, "admin");
    if (!permCheck.hasPermission) {
      const code = permCheck.code === "NOT_FOUND" ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      const status = permCheck.code === "NOT_FOUND" ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      return respond.error(permCheck.error ?? "Permission denied", code, { status });
    }

    // Validate events
    const eventValidation = validateEvents(body.events);
    if (!eventValidation.valid) {
      return respond.error(
        `Invalid event types: ${eventValidation.invalid.join(", ")}`,
        "VALIDATION_ERROR",
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    try {
      // Check existing webhook count (limit: 10)
      const existingSnapshot = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("webhooks")
        .where("campusId", "==", campusId)
        .count()
        .get();

      const maxWebhooks = 10;
      if (existingSnapshot.data().count >= maxWebhooks) {
        return respond.error(
          `Maximum webhooks per space reached (${maxWebhooks})`,
          "LIMIT_EXCEEDED",
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      // Check for duplicate URL
      const duplicateSnapshot = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("webhooks")
        .where("url", "==", body.url)
        .where("campusId", "==", campusId)
        .where("status", "!=", "disabled")
        .limit(1)
        .get();

      if (!duplicateSnapshot.empty) {
        return respond.error(
          "A webhook with this URL already exists for this space",
          "DUPLICATE",
          { status: HttpStatus.CONFLICT }
        );
      }

      // Create webhook entity
      const webhookResult = Webhook.create({
        url: body.url,
        spaceId,
        campusId,
        events: body.events as WebhookEventType[],
        createdBy: userId,
        description: body.description,
      });

      if (webhookResult.isFailure) {
        return respond.error(
          webhookResult.error || "Failed to create webhook",
          "VALIDATION_ERROR",
          { status: HttpStatus.BAD_REQUEST }
        );
      }

      const webhook = webhookResult.getValue();
      const webhookData = webhook.toObject();

      // Save to Firestore
      const webhookRef = dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("webhooks")
        .doc(webhook.id);

      await webhookRef.set({
        ...webhookData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Log activity
      await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("activity")
        .add({
          type: "webhook_created",
          performedBy: userId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            webhookId: webhook.id,
            url: body.url,
            events: body.events,
          },
        });

      logger.info("Webhook created", {
        spaceId,
        userId,
        webhookId: webhook.id,
        events: body.events,
        endpoint: "/api/spaces/[spaceId]/webhooks",
      });

      return respond.success({
        webhook: webhook.toSafeObject(),
        signingSecret: webhook.signingSecret, // Only returned on creation
      });
    } catch (error) {
      logger.error("Failed to create webhook", {
        error: error instanceof Error ? error.message : String(error),
        spaceId,
        userId,
        endpoint: "/api/spaces/[spaceId]/webhooks",
      });
      return respond.error("Failed to create webhook", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export const GET = withCache(_GET, 'SHORT');
