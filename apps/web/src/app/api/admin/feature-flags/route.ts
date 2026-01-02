import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import { verifyAdminRequest } from "@/lib/admin-auth";

/**
 * GET /api/admin/feature-flags
 * Fetch all feature flags for admin management
 */
export async function GET(request: Request) {
  try {
    const adminResult = await verifyAdminRequest(request);
    if (!adminResult.success) {
      return NextResponse.json(
        { success: false, error: adminResult.error },
        { status: 401 }
      );
    }

    const flagsSnapshot = await dbAdmin.collection("featureFlags").get();
    const flags = flagsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      flags,
      total: flags.length,
    });
  } catch (error) {
    logger.error("Failed to fetch feature flags", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/feature-flags
 * Create a new feature flag
 */
export async function POST(request: Request) {
  try {
    const adminResult = await verifyAdminRequest(request);
    if (!adminResult.success) {
      return NextResponse.json(
        { success: false, error: adminResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, description, category, enabled, rollout } = body;

    if (!id || !name || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id, name, category" },
        { status: 400 }
      );
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
        createdBy: adminResult.admin.userId,
        updatedAt: now,
        updatedBy: adminResult.admin.userId,
        version: 1,
      },
    };

    await dbAdmin.collection("featureFlags").doc(id).set(flagData);

    logger.info("Feature flag created", {
      flagId: id,
      adminId: adminResult.admin.userId,
    });

    return NextResponse.json({
      success: true,
      flag: { id, ...flagData },
    });
  } catch (error) {
    logger.error("Failed to create feature flag", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: "Failed to create feature flag" },
      { status: 500 }
    );
  }
}
