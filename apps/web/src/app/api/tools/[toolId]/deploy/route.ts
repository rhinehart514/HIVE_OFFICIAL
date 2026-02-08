import { NextRequest as _NextRequest, NextResponse } from 'next/server';
import { getFirestore as _getFirestore, FieldValue as _FieldValue } from "firebase-admin/firestore";
import * as admin from 'firebase-admin';
import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthValidationAndErrors, withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { ApiResponseHelper, HttpStatus } from "@/lib/api-response-types";
import { logger } from '@/lib/logger';
import { createPlacementDocument, buildPlacementCompositeId } from "@/lib/tool-placement";
import { validateToolForPublish } from "@/lib/tool-validation";

// Schema for tool deployment requests
// Accepts either spaceId (legacy) or targetId/targetType (new modal format)
const DeployToolSchema = z.object({
  spaceId: z.string().optional(),
  targetId: z.string().optional(),
  targetType: z.enum(['space', 'profile']).optional(),
  surface: z.string().optional(),
  configuration: z.record(z.any()).default({}),
  permissions: z.record(z.any()).default({}),
  settings: z.record(z.any()).optional(),
  privacy: z.string().optional(),
}).refine(
  (data) => data.spaceId || data.targetId,
  { message: "Either spaceId or targetId is required" }
);

export const POST = withAuthValidationAndErrors(
  DeployToolSchema,
  async (
    request,
    { params }: { params: Promise<{ toolId: string }> },
    validatedData,
    respond
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { toolId } = await params;
    const db = dbAdmin;

    // Support both legacy spaceId and new targetId format
    const spaceId = validatedData.spaceId || validatedData.targetId;
    const configuration = validatedData.configuration || {};
    const permissions = validatedData.permissions || {};
    const targetType = validatedData.targetType || 'space';

    // Profile deployments are handled differently
    if (targetType === 'profile') {
      try {
        // Validate required context
        if (!campusId) {
          return respond.error("Campus context required for deployment", "INVALID_INPUT", { status: 400 });
        }

        // For profile deployments, we update the tool and create a placement document
        const toolDoc = await db.collection("tools").doc(toolId).get();
        if (!toolDoc.exists) {
          return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
        }
        const toolData = toolDoc.data();

        // Check ownership - support both ownerId and createdBy for backwards compat
        const isOwner = toolData?.ownerId === userId || toolData?.createdBy === userId;
        if (!isOwner) {
          return respond.error("You can only deploy your own tools to your profile", "FORBIDDEN", { status: 403 });
        }

        const deploymentId = `profile_${toolId}`;
        const placementId = `${deploymentId}_${toolId}`;

        // Check if already deployed to profile (by doc ID, no query needed)
        const existingPlacement = await db
          .collection("users")
          .doc(userId)
          .collection("placed_tools")
          .doc(placementId)
          .get();

        if (existingPlacement.exists) {
          return respond.error("Tool is already deployed to your profile", "UNKNOWN_ERROR", { status: 409 });
        }

        // Update tool to show on profile
        await db.collection("tools").doc(toolId).update({
          showOnProfile: true,
          status: 'published',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create placement document in user's placed_tools subcollection
        await createPlacementDocument({
          deployedTo: 'profile',
          targetId: userId,
          toolId,
          deploymentId,
          placedBy: userId,
          campusId: campusId,
          placement: 'sidebar',
          visibility: 'all',
          configOverrides: configuration,
          // Include tool metadata for profile display
          name: toolData.name,
          description: toolData.description,
          icon: toolData.icon,
        });

        return respond.success({
          deploymentId,
          deployment: { targetType: 'profile', toolId },
        });
      } catch (error) {
        logger.error('Deploy profile error', error instanceof Error ? error : new Error(String(error)));
        return respond.error(
          `Profile deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          "UNKNOWN_ERROR",
          { status: 500 }
        );
      }
    }

    if (!spaceId) {
      return respond.error("spaceId or targetId is required for space deployments", "INVALID_INPUT", { status: 400 });
    }

    // Verify user has admin access to the space
    // Check spaceMembers collection first
    const membershipSnapshot = await db
      .collection("spaceMembers")
      .where("userId", "==", userId)
      .where("spaceId", "==", spaceId)
      .where("status", "==", "active")
      .where("campusId", "==", campusId)
      .limit(1)
      .get();

    let hasPermission = false;
    if (!membershipSnapshot.empty) {
      const memberData = membershipSnapshot.docs[0].data();
      if (['admin', 'owner', 'leader', 'builder', 'moderator'].includes(memberData?.role)) {
        hasPermission = true;
      }
    }

    // Fallback: Check if user is the space owner or in leaders array
    if (!hasPermission) {
      const spaceDocCheck = await db.collection("spaces").doc(spaceId).get();
      if (spaceDocCheck.exists) {
        const spaceDataCheck = spaceDocCheck.data();
        // Check if user is the creator/owner
        if (spaceDataCheck?.createdBy === userId || spaceDataCheck?.ownerId === userId) {
          hasPermission = true;
        }
        // Check if user is in leaders array
        if (spaceDataCheck?.leaders?.includes(userId)) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return respond.error("Admin access required to deploy tools", "FORBIDDEN", { status: 403 });
    }

    // Verify tool exists and can be deployed
    const toolDoc = await db
      .collection("tools")
      .doc(toolId)
      .get();

    if (!toolDoc.exists) {
      return NextResponse.json(ApiResponseHelper.error("Tool not found", "RESOURCE_NOT_FOUND"), { status: HttpStatus.NOT_FOUND });
    }

    const toolData = toolDoc.data();
    if (toolData?.campusId !== campusId) {
      return NextResponse.json(ApiResponseHelper.error("Access denied for this campus", "FORBIDDEN"), { status: HttpStatus.FORBIDDEN });
    }

    // Quality gate: validate tool composition before deployment
    const validation = validateToolForPublish(toolData as Record<string, unknown>);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Tool failed validation', validationErrors: validation.errors },
        { status: 400 }
      );
    }

    // Auto-publish draft tools when deploying (deployment implies intent to publish)
    if (toolData?.status === "draft") {
      await db.collection("tools").doc(toolId).update({
        status: "published",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Check if tool is already deployed to this space
    const existingDeploymentQuery = await db
      .collection("tool_deployments")
      .where("toolId", "==", toolId)
      .where("spaceId", "==", spaceId)
      .where("campusId", "==", campusId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!existingDeploymentQuery.empty) {
      return NextResponse.json(ApiResponseHelper.error("Tool is already deployed to this space", "UNKNOWN_ERROR"), { status: 409 });
    }

    // Check space's tool deployment limits
    const spaceDoc = await db
      .collection("spaces")
      .doc(spaceId)
      .get();

    const spaceData = spaceDoc.data();
    if (spaceData?.campusId !== campusId) {
      return NextResponse.json(ApiResponseHelper.error("Access denied for this campus", "FORBIDDEN"), { status: HttpStatus.FORBIDDEN });
    }
    const maxTools = spaceData?.limits?.maxTools || 20;

    const activeDeploymentsQuery = await db
      .collection("tool_deployments")
      .where("spaceId", "==", spaceId)
      .where("isActive", "==", true)
      .get();

    if (activeDeploymentsQuery.size >= maxTools) {
      return NextResponse.json(
        { error: `Space has reached the maximum of ${maxTools} deployed tools` },
        { status: 409 }
      );
    }

    // Create deployment document
    const deploymentId = `${toolId}_${spaceId}`;
    const deploymentData = {
      id: deploymentId,
      toolId,
      spaceId,
      campusId: campusId,
      deployedBy: userId,
      deployedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      configuration: {
        ...toolData.defaultConfiguration,
        ...configuration,
      },
      permissions: {
        canUse: ["member", "admin"], // Default permissions
        canConfigure: ["admin"],
        canViewAnalytics: ["admin"],
        ...permissions,
      },
      metadata: {
        toolVersion: toolData.version,
        toolName: toolData.name,
        toolDescription: toolData.description,
        deploymentVersion: "1.0.0",
      },
      analytics: {
        totalUses: 0,
        uniqueUsers: 0,
        lastUsed: null,
        averageRating: 0,
        totalRatings: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save deployment
    await db
      .collection("tool_deployments")
      .doc(deploymentId)
      .set(deploymentData);

    // CRITICAL: Also write to placed_tools subcollection so Space page can find it
    // The Space tools API reads from spaces/{spaceId}/placed_tools
    await createPlacementDocument({
      deployedTo: 'space',
      targetId: spaceId,
      toolId,
      deploymentId,
      placedBy: userId,
      campusId: campusId,
      placement: 'sidebar',
      visibility: 'all',
      configOverrides: configuration,
    });

    // Update tool's deployment analytics
    await db
      .collection("tools")
      .doc(toolId)
      .update({
        deploymentCount: admin.firestore.FieldValue.increment(1),
        lastDeployed: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Update space's tool count
    await db
      .collection("spaces")
      .doc(spaceId)
      .update({
        toolCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Create initial analytics document
    await db
      .collection("tool_analytics")
      .doc(deploymentId)
      .set({
        toolId,
        spaceId,
        deploymentId,
        usageCount: 0,
        uniqueUsers: [],
        activeUsers: [],
        dailyUsage: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    return respond.success({
      deploymentId,
      deployment: {
        ...deploymentData,
        deployedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  }
);

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const spaceId = searchParams.get("spaceId");

  if (!spaceId) {
    return respond.error("spaceId parameter is required", "INVALID_INPUT", { status: 400 });
  }

  const db = dbAdmin;

  // Verify user has admin access to the space (using flat spaceMembers collection)
  const membershipSnapshot = await db
    .collection("spaceMembers")
    .where("userId", "==", userId)
    .where("spaceId", "==", spaceId)
    .where("status", "==", "active")
    .where("campusId", "==", campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return respond.error("Access denied to this space", "FORBIDDEN", { status: 403 });
  }

  const memberData = membershipSnapshot.docs[0].data();
  if (!['admin', 'owner', 'leader', 'builder', 'moderator'].includes(memberData?.role)) {
    return respond.error("Admin access required to undeploy tools", "FORBIDDEN", { status: 403 });
  }

    const deploymentId = `${toolId}_${spaceId}`;

    // Check if deployment exists
    const deploymentDoc = await db
      .collection("tool_deployments")
      .doc(deploymentId)
      .get();

    if (!deploymentDoc.exists) {
      return respond.error("Tool deployment not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Deactivate deployment (soft delete to preserve analytics)
    await db
      .collection("tool_deployments")
      .doc(deploymentId)
      .update({
        isActive: false,
        undeployedBy: userId,
        undeployedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Also remove from placed_tools so Space page stops showing it
    const placementId = buildPlacementCompositeId(deploymentId, toolId);
    await db
      .collection("spaces")
      .doc(spaceId)
      .collection("placed_tools")
      .doc(placementId)
      .delete();

    // Update tool's deployment count
    await db
      .collection("tools")
      .doc(toolId)
      .update({
        deploymentCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Update space's tool count
    await db
      .collection("spaces")
      .doc(spaceId)
      .update({
        toolCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Archive user states (move to archived collection for data preservation)
    const stateDocsQuery = await db
      .collection("tool_states")
      .where("toolId", "==", toolId)
      .where("spaceId", "==", spaceId)
      .where("campusId", "==", campusId)
      .get();

    const batch = dbAdmin.batch();
    stateDocsQuery.docs.forEach(doc => {
      // Copy to archived collection
      batch.set(
        dbAdmin.collection("tool_states_archived").doc(doc.id),
        {
          ...doc.data(),
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          archivedBy: userId,
        }
      );
      
      // Delete from active collection
      batch.delete(doc.ref);
    });

    await batch.commit();

    return respond.success({
      undeployedAt: new Date().toISOString(),
      archivedStates: stateDocsQuery.size
    });
});

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const spaceId = searchParams.get("spaceId");

  if (!spaceId) {
    return respond.error("spaceId parameter is required", "INVALID_INPUT", { status: 400 });
  }

  const db = dbAdmin;

  // Verify user has access to the space (using flat spaceMembers collection)
  const membershipSnapshot = await db
    .collection("spaceMembers")
    .where("userId", "==", userId)
    .where("spaceId", "==", spaceId)
    .where("status", "==", "active")
    .where("campusId", "==", campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return respond.error("Access denied to this space", "FORBIDDEN", { status: 403 });
  }

    const deploymentId = `${toolId}_${spaceId}`;

    // Get deployment details
    const deploymentDoc = await db
      .collection("tool_deployments")
      .doc(deploymentId)
      .get();

    if (!deploymentDoc.exists) {
      return respond.error("Tool deployment not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const deploymentData = deploymentDoc.data();

    // Get analytics if user has permission
    const memberDoc = membershipSnapshot.docs[0];
    const memberData = memberDoc?.data();
    let analytics = null;

    if (memberData?.role === "admin" || deploymentData?.permissions?.canViewAnalytics?.includes(memberData?.role)) {
      const analyticsDoc = await db
        .collection("tool_analytics")
        .doc(deploymentId)
        .get();
      
      if (analyticsDoc.exists) {
        analytics = analyticsDoc.data();
      }
    }

    return respond.success({
      deployment: deploymentData,
      analytics
    });
});
