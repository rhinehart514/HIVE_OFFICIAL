import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withCache } from '../../../../../lib/cache-headers';

interface RouteContext {
  params: Promise<{ flagId: string }>;
}

/**
 * GET /api/admin/feature-flags/[flagId]
 * Get a specific feature flag
 */
async function _GET(request: Request, context: RouteContext) {
  try {
    const adminResult = await verifyAdminRequest(request);
    if (!adminResult.success) {
      return NextResponse.json(
        { success: false, error: adminResult.error },
        { status: 401 }
      );
    }

    const { flagId } = await context.params;
    const flagDoc = await dbAdmin.collection("featureFlags").doc(flagId).get();

    if (!flagDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Feature flag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flag: { id: flagDoc.id, ...flagDoc.data() },
    });
  } catch (error) {
    logger.error("Failed to fetch feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch feature flag" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feature-flags/[flagId]
 * Update a feature flag
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const adminResult = await verifyAdminRequest(request);
    if (!adminResult.success) {
      return NextResponse.json(
        { success: false, error: adminResult.error },
        { status: 401 }
      );
    }

    const { flagId } = await context.params;
    const body = await request.json();

    const flagRef = dbAdmin.collection("featureFlags").doc(flagId);
    const flagDoc = await flagRef.get();

    if (!flagDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Feature flag not found" },
        { status: 404 }
      );
    }

    const currentData = flagDoc.data();
    const now = new Date().toISOString();

    // Only allow updating certain fields
    const updates: Record<string, unknown> = {
      "metadata.updatedAt": now,
      "metadata.updatedBy": adminResult.admin.userId,
      "metadata.version": (currentData?.metadata?.version || 0) + 1,
    };

    if (typeof body.enabled === "boolean") {
      updates.enabled = body.enabled;
    }
    if (body.name) {
      updates.name = body.name;
    }
    if (body.description !== undefined) {
      updates.description = body.description;
    }
    if (body.rollout) {
      updates.rollout = body.rollout;
    }
    if (body.conditions) {
      updates.conditions = body.conditions;
    }

    await flagRef.update(updates);

    logger.info("Feature flag updated", {
      flagId,
      adminId: adminResult.admin.userId,
      changes: Object.keys(updates).filter((k) => !k.startsWith("metadata")),
    });

    // Fetch updated flag
    const updatedDoc = await flagRef.get();

    return NextResponse.json({
      success: true,
      flag: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error) {
    logger.error("Failed to update feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feature-flags/[flagId]
 * Delete a feature flag
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const adminResult = await verifyAdminRequest(request);
    if (!adminResult.success) {
      return NextResponse.json(
        { success: false, error: adminResult.error },
        { status: 401 }
      );
    }

    const { flagId } = await context.params;
    const flagRef = dbAdmin.collection("featureFlags").doc(flagId);
    const flagDoc = await flagRef.get();

    if (!flagDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Feature flag not found" },
        { status: 404 }
      );
    }

    await flagRef.delete();

    logger.info("Feature flag deleted", {
      flagId,
      adminId: adminResult.admin.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Feature flag deleted",
    });
  } catch (error) {
    logger.error("Failed to delete feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to delete feature flag" },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'PRIVATE');
