import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { withAdminAuthAndErrors, getUserId } from "@/lib/middleware";
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/admin/feature-flags
 * Fetch all feature flags for admin management
 */
const _GET = withAdminAuthAndErrors(async (_request, _context, respond) => {
  const flagsSnapshot = await dbAdmin.collection("featureFlags").get();
  const flags = flagsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return respond.success({ flags, total: flags.length });
});

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request);

  const body = await (request as Request).json();
  const { id, name, description, category, enabled, rollout } = body;

  if (!id || !name || !category) {
    return respond.error("Missing required fields: id, name, category", "INVALID_INPUT", { status: 400 });
  }

  const now = new Date().toISOString();
  const flagData = {
    name,
    description: description || "",
    category,
    enabled: enabled ?? false,
    rollout: rollout || { type: "all" },
    metadata: {
      createdAt: now,
      createdBy: adminId,
      updatedAt: now,
      updatedBy: adminId,
      version: 1,
    },
  };

  await dbAdmin.collection("featureFlags").doc(id).set(flagData);

  logger.info("Feature flag created", { flagId: id, adminId });

  return respond.success({ flag: { id, ...flagData } });
});

export const GET = withCache(_GET, 'PRIVATE');
