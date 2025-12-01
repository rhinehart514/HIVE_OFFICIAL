"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { buildPlacementCompositeId, createPlacementDocument } from "@/lib/tool-placement";
import { logger } from "@/lib/structured-logger";
import { HttpStatus } from "@/lib/api-response-types";
import { getServerSpaceRepository } from "@hive/core/server";

const GetSpaceToolsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  category: z
    .enum(["productivity", "academic", "social", "utility", "entertainment", "other"])
    .optional(),
  status: z.enum(["active", "inactive", "all"]).default("active"),
  sortBy: z
    .enum(["deployments", "rating", "recent", "alphabetical"])
    .default("deployments"),
});

const CreateSpaceToolSchema = z.object({
  toolId: z.string().min(1),
  configuration: z.record(z.any()).optional(),
  isShared: z.boolean().default(true),
  permissions: z
    .object({
      canEdit: z.array(z.string()).default([]),
      canView: z.array(z.string()).default([]),
      isPublic: z.boolean().default(true),
    })
    .optional(),
});

async function validateSpaceAndMembership(spaceId: string, userId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== CURRENT_CAMPUS_ID) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    if (!space.isPublic) {
      return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
    }
    return { ok: true as const, space, membership: { role: 'guest' } };
  }

  return { ok: true as const, space, membership: membershipSnapshot.docs[0].data() };
}

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  try {
    const { spaceId } = await params;
    const userId = getUserId(request as AuthenticatedRequest);
    const validation = await validateSpaceAndMembership(spaceId, userId);
    if (!validation.ok) {
      const code =
        validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
      return respond.error(validation.message, code, { status: validation.status });
    }

    const queryParams = GetSpaceToolsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );

    const placementsSnapshot = await dbAdmin
      .collection("spaces")
      .doc(spaceId)
      .collection("placed_tools")
      .get();

    const tools: Array<Record<string, unknown>> = [];

    if (!placementsSnapshot.empty) {
      for (const placementDoc of placementsSnapshot.docs) {
        const placementData = placementDoc.data();
        if (
          queryParams.status !== "all" &&
          placementData.status !== queryParams.status
        ) {
          continue;
        }

        const toolDoc = await dbAdmin.collection("tools").doc(placementData.toolId).get();
        if (!toolDoc.exists) continue;
        const toolData = toolDoc.data();
        if (!toolData) continue;
        if (toolData.campusId && toolData.campusId !== CURRENT_CAMPUS_ID) continue;
        if (queryParams.category && toolData.category !== queryParams.category) continue;

        tools.push({
          deploymentId: buildPlacementCompositeId(`space:${spaceId}`, placementDoc.id),
          toolId: placementData.toolId,
          name: toolData.name,
          description: toolData.description,
          category: toolData.category,
          version: placementData.version || toolData.currentVersion || "1.0.0",
          status: placementData.status,
          configuration: placementData.config || {},
          permissions: placementData.permissions || {},
          isShared: placementData.isShared ?? true,
          deployer: {
            id: placementData.createdBy || "",
            name: "",
            avatar: null,
          },
          deployedAt: placementData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastUsed: placementData.lastUsedAt?.toDate?.()?.toISOString() || null,
          usageCount: placementData.usageCount || 0,
          originalTool: {
            averageRating: toolData.averageRating || 0,
            ratingCount: toolData.ratingCount || 0,
            totalDeployments: toolData.deploymentCount || 0,
            isVerified: toolData.isVerified || false,
            creatorId: toolData.creatorId,
          },
        });
      }
    }

    if (tools.length === 0) {
      // Check deployedTools collection (primary deployment location)
      const deploymentsSnapshot = await dbAdmin
        .collection("deployedTools")
        .where("targetId", "==", spaceId)
        .where("targetType", "==", "space")
        .where("campusId", "==", CURRENT_CAMPUS_ID)
        .get();

      for (const deploymentDoc of deploymentsSnapshot.docs) {
        const deploymentData = deploymentDoc.data();
        if (queryParams.status !== "all" && deploymentData.status !== queryParams.status) {
          continue;
        }

        const toolDoc = await dbAdmin.collection("tools").doc(deploymentData.toolId).get();
        if (!toolDoc.exists) continue;
        const toolData = toolDoc.data();
        if (!toolData) continue;
        if (toolData.campusId && toolData.campusId !== CURRENT_CAMPUS_ID) continue;
        if (queryParams.category && toolData.category !== queryParams.category) continue;

        tools.push({
          deploymentId: deploymentDoc.id,
          toolId: deploymentData.toolId,
          name: deploymentData.metadata?.toolName || toolData.name,
          description: toolData.description,
          category: toolData.category,
          version: deploymentData.metadata?.toolVersion || toolData.currentVersion || "1.0.0",
          status: deploymentData.status,
          configuration: deploymentData.config || {},
          permissions: deploymentData.permissions || {
            canEdit: [],
            canView: [],
            isPublic: true,
          },
          isShared: deploymentData.settings?.allowSharing ?? true,
          deployer: {
            id: deploymentData.deployedBy || deploymentData.creatorId || "",
            name: "",
            avatar: null,
          },
          deployedAt: deploymentData.deployedAt || new Date().toISOString(),
          lastUsed: null,
          usageCount: deploymentData.usageCount || 0,
          originalTool: {
            averageRating: toolData.averageRating || 0,
            ratingCount: toolData.ratingCount || 0,
            totalDeployments: toolData.deploymentCount || 0,
            isVerified: toolData.isVerified || false,
            creatorId: toolData.creatorId || toolData.ownerId,
          },
        });
      }
    }

    const offsetTools = tools.slice(queryParams.offset, queryParams.offset + queryParams.limit);

    return respond.success({
      tools: offsetTools,
      pagination: {
        limit: queryParams.limit,
        offset: queryParams.offset,
        nextOffset:
          tools.length > queryParams.offset + queryParams.limit
            ? queryParams.offset + queryParams.limit
            : null,
      },
    });
  } catch (error) {
    logger.error(
      "Error fetching space tools",
      { error: error instanceof Error ? error.message : String(error) },
    );
    return respond.error("Failed to fetch space tools", "INTERNAL_ERROR", {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const POST = withAuthValidationAndErrors(
  CreateSpaceToolSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    try {
      const { spaceId } = await params;
      const userId = getUserId(request as AuthenticatedRequest);

      const validation = await validateSpaceAndMembership(spaceId, userId);
      if (!validation.ok) {
        const code =
          validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
        return respond.error(validation.message, code, { status: validation.status });
      }

      const toolDoc = await dbAdmin.collection("tools").doc(body.toolId).get();
      if (!toolDoc.exists) {
        return respond.error("Tool not found", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const toolData = toolDoc.data();
      if (!toolData) {
        return respond.error("Tool data missing", "RESOURCE_NOT_FOUND", {
          status: HttpStatus.NOT_FOUND,
        });
      }
      if (toolData.campusId && toolData.campusId !== CURRENT_CAMPUS_ID) {
        return respond.error("Access denied for this campus", "FORBIDDEN", {
          status: HttpStatus.FORBIDDEN,
        });
      }

      const existingSnapshot = await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("placed_tools")
        .where("toolId", "==", body.toolId)
        .where("status", "==", "active")
        .get();

      if (!existingSnapshot.empty) {
        return respond.error("Tool is already deployed in this space", "CONFLICT", {
          status: HttpStatus.CONFLICT,
        });
      }

      const placement = await createPlacementDocument({
        deployedTo: "space",
        targetId: spaceId,
        toolId: body.toolId,
        deploymentId: `space_${spaceId}_${Date.now()}`,
        surface: "tools",
        permissions: body.permissions || {
          canEdit: [],
          canView: [],
          isPublic: true,
        },
        settings: body.configuration || {},
      });

      await dbAdmin
        .collection("spaces")
        .doc(spaceId)
        .collection("placed_tools")
        .doc(placement.id)
        .set({
          toolId: body.toolId,
          status: "active",
          config: body.configuration || {},
          permissions: body.permissions || {
            canEdit: [],
            canView: [],
            isPublic: true,
          },
          isShared: body.isShared,
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date(),
          usageCount: 0,
          campusId: CURRENT_CAMPUS_ID,
        });

      await dbAdmin.collection("tools").doc(body.toolId).update({
        deploymentCount: admin.firestore.FieldValue.increment(1),
        lastDeployedAt: new Date(),
      });

      return respond.created({
        deployment: {
          deploymentId: buildPlacementCompositeId(`space:${spaceId}`, placement.id),
          toolId: body.toolId,
          name: toolData.name,
          description: toolData.description,
          category: toolData.category,
          version: toolData.currentVersion || "1.0.0",
          status: "active",
          configuration: body.configuration || {},
          permissions: body.permissions || {},
          isShared: body.isShared,
          deployer: { id: userId },
          deployedAt: new Date().toISOString(),
          lastUsed: null,
          usageCount: 0,
        },
      });
    } catch (error) {
      logger.error(
        "Error deploying tool to space",
        { error: error instanceof Error ? error.message : String(error) },
      );
      return respond.error("Failed to deploy tool", "INTERNAL_ERROR", {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  },
);
