"use server";

import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/structured-logger";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import {
  DEFAULT_SURFACE_MODES,
  type ToolCapabilities,
} from "@hive/core";

interface RouteContext {
  params: Promise<{
    spaceId: string;
    deploymentId: string;
  }>;
}

/**
 * GET /api/spaces/[spaceId]/apps/[deploymentId]
 *
 * Returns deployment data for app surface rendering.
 * Validates:
 * - User is space member
 * - Deployment exists and is active
 * - Deployment has app surface enabled
 * - User has permission to view
 */
export const GET = withAuthAndErrors(
  async (request, context: RouteContext, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { spaceId, deploymentId } = await context.params;

    logger.info("Fetching app deployment", {
      spaceId,
      deploymentId,
      userId,
    });

    // 1. Verify space membership
    const membershipQuery = await dbAdmin
      .collection("spaceMembers")
      .where("userId", "==", userId)
      .where("spaceId", "==", spaceId)
      .where("campusId", "==", CURRENT_CAMPUS_ID)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (membershipQuery.empty) {
      return respond.error(
        "You must be a space member to view this app",
        "FORBIDDEN",
        { status: 403 }
      );
    }

    const membership = membershipQuery.docs[0].data();

    // 2. Get deployment
    const deploymentDoc = await dbAdmin
      .collection("deployedTools")
      .doc(deploymentId)
      .get();

    if (!deploymentDoc.exists) {
      return respond.error("App not found", "NOT_FOUND", { status: 404 });
    }

    const deployment = deploymentDoc.data()!;

    // 3. Validate deployment belongs to this space
    if (deployment.targetId !== spaceId || deployment.deployedTo !== "space") {
      return respond.error("App not found in this space", "NOT_FOUND", {
        status: 404,
      });
    }

    // 4. Check app surface is enabled
    const surfaceModes = deployment.surfaceModes || DEFAULT_SURFACE_MODES;
    if (!surfaceModes.app) {
      return respond.error(
        "This tool does not have app view enabled",
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // 5. Check governance status
    if (!["active", "experimental"].includes(deployment.status)) {
      return respond.error(`This app is ${deployment.status}`, "FORBIDDEN", {
        status: 403,
      });
    }

    // 6. Check role permissions
    const allowedRoles = deployment.permissions?.allowedRoles || [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      return respond.error(
        `This app requires one of these roles: ${allowedRoles.join(", ")}`,
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // 7. Get tool data
    const toolDoc = await dbAdmin
      .collection("tools")
      .doc(deployment.toolId)
      .get();
    if (!toolDoc.exists) {
      return respond.error("Tool not found", "NOT_FOUND", { status: 404 });
    }

    const tool = toolDoc.data()!;

    // 8. Get space data for breadcrumb
    const spaceDoc = await dbAdmin.collection("spaces").doc(spaceId).get();
    const space = spaceDoc.data();

    // 9. Build response
    const response = {
      deployment: {
        id: deploymentDoc.id,
        toolId: deployment.toolId,
        status: deployment.status,
        config: deployment.config,
        permissions: deployment.permissions,
        surfaceModes: deployment.surfaceModes || DEFAULT_SURFACE_MODES,
        primarySurface: deployment.primarySurface || "widget",
        appConfig: deployment.appConfig,
        capabilities: deployment.capabilities as ToolCapabilities,
        budgets: deployment.budgets,
        capabilityLane: deployment.capabilityLane,
        deployedAt: deployment.deployedAt,
        provenance: deployment.provenance,
      },
      tool: {
        id: toolDoc.id,
        name: tool.name,
        description: tool.description,
        composition: tool.composition,
        elements: tool.elements,
        version: tool.currentVersion,
      },
      space: {
        id: spaceId,
        name: space?.name || "Unknown Space",
      },
      userRole: membership.role,
      grantedCapabilities: deployment.capabilities as ToolCapabilities,
    };

    logger.info("App deployment fetched successfully", {
      deploymentId,
      toolId: deployment.toolId,
      spaceId,
    });

    return respond.success(response);
  }
);
