import * as admin from 'firebase-admin';
import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthValidationAndErrors, withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { logger } from '@/lib/structured-logger';
import { createPlacementDocument, buildPlacementCompositeId } from "@/lib/tool-placement";
import { validateToolForPublish } from "@/lib/tool-validation";
import { notifyToolDeployed } from '@/lib/tool-notifications';
import { withCache } from '../../../../../lib/cache-headers';

// Schema for tool deployment requests
// Accepts either spaceId (legacy) or targetId/targetType (new modal format)
const DeployToolSchema = z.object({
  spaceId: z.string().optional(),
  targetId: z.string().optional(),
  targetType: z.enum(['space', 'profile', 'campus']).optional(),
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

    // Campus deployments — submit tool to campus directory
    if (targetType === 'campus') {
      try {
        if (!campusId) {
          return respond.error("Campus context required for deployment", "INVALID_INPUT", { status: 400 });
        }

        const toolDoc = await db.collection("tools").doc(toolId).get();
        if (!toolDoc.exists) {
          return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
        }
        const toolData = toolDoc.data();

        const isOwner = toolData?.ownerId === userId || toolData?.createdBy === userId;
        if (!isOwner) {
          return respond.error("You can only deploy your own tools to campus", "FORBIDDEN", { status: 403 });
        }

        const deploymentId = `campus_${campusId}_${toolId}`;

        // Extract slug — from config or generate from tool name
        const slug: string = (configuration?.slug as string) ||
          (toolData?.name as string || 'tool').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
        const category: string = (configuration?.category as string) || 'utility';

        // Check slug uniqueness in campus_tools
        const slugCheck = await db
          .collection("campuses")
          .doc(campusId)
          .collection("campus_tools")
          .where("slug", "==", slug)
          .where("isActive", "==", true)
          .limit(1)
          .get();

        if (!slugCheck.empty) {
          return respond.error("A tool with this slug already exists on campus", "CONFLICT", { status: 409 });
        }

        // Write campus tool document
        await db
          .collection("campuses")
          .doc(campusId)
          .collection("campus_tools")
          .doc(deploymentId)
          .set({
            toolId,
            slug,
            category,
            badge: 'community',
            status: 'pending_review',
            placedBy: userId,
            placedAt: admin.firestore.FieldValue.serverTimestamp(),
            campusId,
            toolName: toolData?.name || 'Untitled',
            toolDescription: toolData?.description || '',
            usageStats: { weeklyUsers: 0, totalUses: 0 },
            version: toolData?.version || 1,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Update tool doc with campus deployment reference
        await db.collection("tools").doc(toolId).update({
          campusDeployment: { slug, status: 'pending_review', deploymentId },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return respond.success({ deploymentId, slug });
      } catch (error) {
        logger.error('Deploy campus error', error instanceof Error ? error : new Error(String(error)));
        return respond.error(
          `Campus deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          "UNKNOWN_ERROR",
          { status: 500 }
        );
      }
    }

    if (!spaceId) {
      return respond.error("spaceId or targetId is required for space deployments", "INVALID_INPUT", { status: 400 });
    }

    // Verify user has admin access to the space
    // Check spaceMembers collection first — campusId filter omitted (index exempted; userId+spaceId scopes query)
    const membershipSnapshot = await db
      .collection("spaceMembers")
      .where("userId", "==", userId)
      .where("spaceId", "==", spaceId)
      .where("status", "==", "active")
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
      return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const toolData = toolDoc.data();
    if (toolData?.campusId !== campusId) {
      return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }

    // Quality gate: validate tool composition before deployment
    const validation = validateToolForPublish(toolData as Record<string, unknown>);
    if (!validation.valid) {
      return respond.error("Tool failed validation", "VALIDATION_ERROR", { status: 400 });
    }

    // Auto-publish draft tools when deploying (deployment implies intent to publish)
    if (toolData?.status === "draft") {
      await db.collection("tools").doc(toolId).update({
        status: "published",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Check if tool is already deployed to this space — campusId filter omitted (index exempted; toolId+spaceId scopes query)
    const existingDeploymentQuery = await db
      .collection("tool_deployments")
      .where("toolId", "==", toolId)
      .where("spaceId", "==", spaceId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!existingDeploymentQuery.empty) {
      return respond.error("Tool is already deployed to this space", "CONFLICT", { status: 409 });
    }

    // Check space's tool deployment limits
    const spaceDoc = await db
      .collection("spaces")
      .doc(spaceId)
      .get();

    const spaceData = spaceDoc.data();
    if (spaceData?.campusId !== campusId) {
      return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }
    const maxTools = spaceData?.limits?.maxTools || 20;

    const activeDeploymentsQuery = await db
      .collection("tool_deployments")
      .where("spaceId", "==", spaceId)
      .where("isActive", "==", true)
      .get();

    if (activeDeploymentsQuery.size >= maxTools) {
      return respond.error(`Space has reached the maximum of ${maxTools} deployed tools`, "LIMIT_REACHED", { status: 409 });
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

    // Emit deployment event to Inngest for durable notification delivery
    try {
      const { inngest } = await import('@/lib/inngest/client');

      // Gather member IDs for notification targeting
      const [deployerDoc, membersByStatus, membersByIsActive] = await Promise.all([
        db.collection('users').doc(userId).get(),
        db
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('status', '==', 'active')
          .get(),
        db
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('isActive', '==', true)
          .get(),
      ]);

      const memberIds = new Set<string>();
      for (const doc of [...membersByStatus.docs, ...membersByIsActive.docs]) {
        const memberId = doc.data()?.userId as string | undefined;
        if (memberId) {
          memberIds.add(memberId);
        }
      }

      if (memberIds.size > 0) {
        const deployerName =
          (deployerDoc.data()?.displayName as string | undefined) ||
          (deployerDoc.data()?.fullName as string | undefined) ||
          'Someone';

        await inngest.send({
          name: 'tool/deployed',
          data: {
            toolId,
            toolName: (toolData?.name as string | undefined) || 'Untitled Tool',
            spaceId,
            spaceName: (spaceData?.name as string | undefined) || 'a space',
            deployedByUserId: userId,
            deployedByName: deployerName,
            campusId: campusId!,
            memberIds: Array.from(memberIds),
          },
        });
      }
    } catch (notifyError) {
      // Fall back to direct notification if Inngest unavailable
      try {
        const [deployerDoc, membersByStatus, membersByIsActive] = await Promise.all([
          db.collection('users').doc(userId).get(),
          db.collection('spaceMembers').where('spaceId', '==', spaceId).where('status', '==', 'active').get(),
          db.collection('spaceMembers').where('spaceId', '==', spaceId).where('isActive', '==', true).get(),
        ]);
        const memberIds = new Set<string>();
        for (const doc of [...membersByStatus.docs, ...membersByIsActive.docs]) {
          const memberId = doc.data()?.userId as string | undefined;
          if (memberId) memberIds.add(memberId);
        }
        if (memberIds.size > 0) {
          const deployerName = (deployerDoc.data()?.displayName as string | undefined) || (deployerDoc.data()?.fullName as string | undefined) || 'Someone';
          await notifyToolDeployed({
            memberIds: Array.from(memberIds),
            deployedByUserId: userId,
            deployedByName: deployerName,
            toolId,
            toolName: (toolData?.name as string | undefined) || 'Untitled Tool',
            spaceId,
            spaceName: (spaceData?.name as string | undefined) || 'a space',
          });
        }
      } catch (fallbackError) {
        logger.warn('Failed to send deployment notifications', {
          toolId, spaceId,
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        });
      }
    }

    // Track generation outcome — mark as deployed
    const generationOutcomeId = toolData?.generationOutcomeId as string | undefined;
    if (generationOutcomeId) {
      import('@/lib/goose-server').then(({ updateGenerationOutcome }) => {
        updateGenerationOutcome(generationOutcomeId, { 'outcome.deployed': true }).catch(() => {});
      }).catch(() => {});
    }

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

  // Verify user has admin access to the space — campusId filter omitted (index exempted; userId+spaceId scopes query)
  const membershipSnapshot = await db
    .collection("spaceMembers")
    .where("userId", "==", userId)
    .where("spaceId", "==", spaceId)
    .where("status", "==", "active")
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

    // Archive user states — campusId filter omitted (index exempted; toolId+spaceId scopes query)
    const stateDocsQuery = await db
      .collection("tool_states")
      .where("toolId", "==", toolId)
      .where("spaceId", "==", spaceId)
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

const _GET = withAuthAndErrors(async (
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

  // Verify user has access to the space — campusId filter omitted (index exempted; userId+spaceId scopes query)
  const membershipSnapshot = await db
    .collection("spaceMembers")
    .where("userId", "==", userId)
    .where("spaceId", "==", spaceId)
    .where("status", "==", "active")
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

export const GET = withCache(_GET, 'SHORT');
