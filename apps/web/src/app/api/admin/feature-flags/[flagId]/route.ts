import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { withAdminAuthAndErrors, getUserId } from "@/lib/middleware";
import { withCache } from '../../../../../lib/cache-headers';

interface RouteContext {
  params: Promise<{ flagId: string }>;
}

/**
 * GET /api/admin/feature-flags/[flagId]
 * Get a specific feature flag
 */
const _GET = withAdminAuthAndErrors<RouteContext>(async (_request, context, respond) => {
  const { flagId } = await context.params;
  const flagDoc = await dbAdmin.collection("featureFlags").doc(flagId).get();

  if (!flagDoc.exists) {
    return respond.error("Feature flag not found", "NOT_FOUND", { status: 404 });
  }

  return respond.success({ flag: { id: flagDoc.id, ...flagDoc.data() } });
});

/**
 * PATCH /api/admin/feature-flags/[flagId]
 * Update a feature flag
 */
export const PATCH = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request);
  const { flagId } = await context.params;
  const body = await (request as Request).json();

  const flagRef = dbAdmin.collection("featureFlags").doc(flagId);
  const flagDoc = await flagRef.get();

  if (!flagDoc.exists) {
    return respond.error("Feature flag not found", "NOT_FOUND", { status: 404 });
  }

  const currentData = flagDoc.data();
  const now = new Date().toISOString();

  // Only allow updating certain fields
  const updates: Record<string, unknown> = {
    "metadata.updatedAt": now,
    "metadata.updatedBy": adminId,
    "metadata.version": (currentData?.metadata?.version || 0) + 1,
  };

  if (typeof body.enabled === "boolean") updates.enabled = body.enabled;
  if (body.name) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.rollout) updates.rollout = body.rollout;
  if (body.conditions) updates.conditions = body.conditions;

  await flagRef.update(updates);

  logger.info("Feature flag updated", {
    flagId,
    adminId,
    changes: Object.keys(updates).filter((k) => !k.startsWith("metadata")),
  });

  const updatedDoc = await flagRef.get();
  return respond.success({ flag: { id: updatedDoc.id, ...updatedDoc.data() } });
});

/**
 * DELETE /api/admin/feature-flags/[flagId]
 * Delete a feature flag
 */
export const DELETE = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request);
  const { flagId } = await context.params;

  const flagRef = dbAdmin.collection("featureFlags").doc(flagId);
  const flagDoc = await flagRef.get();

  if (!flagDoc.exists) {
    return respond.error("Feature flag not found", "NOT_FOUND", { status: 404 });
  }

  await flagRef.delete();

  logger.info("Feature flag deleted", { flagId, adminId });

  return respond.success({ message: "Feature flag deleted" });
});

export const GET = withCache(_GET, 'PRIVATE');
