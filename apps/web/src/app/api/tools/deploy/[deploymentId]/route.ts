"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger as _logger } from "@/lib/structured-logger";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";
import { getPlacementFromDeploymentDoc } from "@/lib/tool-placement";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";

async function loadDeployment(deploymentId: string) {
  const doc = await dbAdmin.collection("deployedTools").doc(deploymentId).get();
  if (!doc.exists) {
    return { ok: false as const, status: 404, message: "Deployment not found" };
  }

  const data = doc.data();
  if (!data) {
    return { ok: false as const, status: 400, message: "Invalid deployment data" };
  }

  if (data.campusId && data.campusId !== CURRENT_CAMPUS_ID) {
    return { ok: false as const, status: 403, message: "Access denied for this campus" };
  }

  return { ok: true as const, doc, data };
}

async function canUserManageDeployment(
  userId: string,
  deployment: FirebaseFirestore.DocumentData,
) {
  if (deployment.deployedBy === userId) {
    return true;
  }

  if (deployment.deployedTo === "profile") {
    return deployment.targetId === userId;
  }

  if (deployment.deployedTo === "space") {
    const spaceDoc = await dbAdmin.collection("spaces").doc(deployment.targetId).get();
    if (!spaceDoc.exists) {
      return false;
    }

    const spaceData = spaceDoc.data();
    if (!spaceData) {
      return false;
    }

    if (spaceData.campusId && spaceData.campusId !== CURRENT_CAMPUS_ID) {
      return false;
    }

    if (spaceData.ownerId === userId) {
      return true;
    }

    const membershipSnapshot = await dbAdmin
      .collection("spaceMembers")
      .where("userId", "==", userId)
      .where("spaceId", "==", deployment.targetId)
      .where("status", "==", "active")
      .where("campusId", "==", CURRENT_CAMPUS_ID)
      .limit(1)
      .get();

    if (membershipSnapshot.empty) {
      return false;
    }

    const memberData = membershipSnapshot.docs[0].data();
    return ["admin", "moderator", "builder"].includes(memberData.role);
  }

  return false;
}

function buildExecutionContext(
  deployment: FirebaseFirestore.DocumentData & { id?: string },
  userId: string,
) {
  const permissions = {
    canRead: Boolean(deployment.permissions?.canView),
    canWrite: Boolean(deployment.permissions?.canEdit),
    canExecute: Boolean(deployment.permissions?.canInteract),
  };

  if (deployment.deployedBy === userId) {
    permissions.canWrite = true;
    permissions.canExecute = true;
  }

  return {
    deploymentId: deployment.id ?? "",
    toolId: deployment.toolId,
    userId,
    targetType: deployment.deployedTo,
    targetId: deployment.targetId,
    surface: deployment.surface,
    permissions,
    environment: deployment.status === "active" ? "production" : "preview",
    config: deployment.config || {},
    settings: deployment.settings || {},
  };
}

// Governance status enum - includes all hack lanes
const DeploymentGovernanceStatusSchema = z.enum([
  "active",           // Normal operation
  "paused",           // Temporarily stopped by leader
  "disabled",         // Kill-switched by leader or admin
  "quarantined",      // Flagged for review
  "experimental",     // Opt-in only, not auto-promoted
]);

const UpdateDeploymentSchema = z.object({
  config: z.record(z.any()).optional(),
  permissions: z
    .object({
      canInteract: z.boolean().optional(),
      canView: z.boolean().optional(),
      canEdit: z.boolean().optional(),
      allowedRoles: z.array(z.string()).optional(),
    })
    .optional(),
  settings: z
    .object({
      showInDirectory: z.boolean().optional(),
      allowSharing: z.boolean().optional(),
      collectAnalytics: z.boolean().optional(),
      notifyOnInteraction: z.boolean().optional(),
    })
    .optional(),
  status: DeploymentGovernanceStatusSchema.optional(),
  position: z.number().optional(),
  // Kill switch - instant disable with reason
  killSwitch: z.boolean().optional(),
  killReason: z.string().max(500).optional(),
});

type UpdateDeploymentInput = z.infer<typeof UpdateDeploymentSchema>;

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ deploymentId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { deploymentId } = await params;

  const deploymentResult = await loadDeployment(deploymentId);
  if (!deploymentResult.ok) {
    return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
      status: deploymentResult.status,
    });
  }

  const { doc, data } = deploymentResult;

  if (!(await canUserManageDeployment(userId, data))) {
    return respond.error("Access denied", "FORBIDDEN", { status: 403 });
  }

  const placement = await getPlacementFromDeploymentDoc(doc);

  const toolDoc = await dbAdmin.collection("tools").doc(data.toolId).get();
  const toolData = toolDoc.exists ? toolDoc.data() : null;
  if (toolData?.campusId && toolData.campusId !== CURRENT_CAMPUS_ID) {
    return respond.error("Access denied", "FORBIDDEN", { status: 403 });
  }

  const deployment = { id: doc.id, ...data };
  const executionContext = buildExecutionContext(deployment, userId);

  return respond.success({
    deployment,
    toolData,
    executionContext,
    placement: placement?.snapshot?.data() ?? null,
  });
});

export const PUT = withAuthValidationAndErrors(
  UpdateDeploymentSchema,
  async (
    request,
    { params }: { params: Promise<{ deploymentId: string }> },
    payload: UpdateDeploymentInput,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const { deploymentId } = await params;

    const deploymentResult = await loadDeployment(deploymentId);
    if (!deploymentResult.ok) {
      return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
        status: deploymentResult.status,
      });
    }

    const { doc, data } = deploymentResult;

    if (!(await canUserManageDeployment(userId, data))) {
      return respond.error("Access denied", "FORBIDDEN", { status: 403 });
    }

    const placementContext = await getPlacementFromDeploymentDoc(doc);
    const updatedAtIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updatedAt: updatedAtIso,
    };

    if (payload.config !== undefined) {
      updateData.config = payload.config;
    }

    if (payload.permissions) {
      updateData.permissions = {
        ...data.permissions,
        ...payload.permissions,
      };
    }

    if (payload.settings) {
      updateData.settings = {
        ...data.settings,
        ...payload.settings,
      };
    }

    if (payload.status) {
      updateData.status = payload.status;
    }

    // Kill switch - immediate disable with logging
    if (payload.killSwitch === true) {
      updateData.status = 'disabled';
      updateData.killedAt = new Date().toISOString();
      updateData.killedBy = userId;
      updateData.killReason = payload.killReason || 'Manually disabled by leader';

      // Log kill switch activation
      await dbAdmin.collection('activityEvents').add({
        userId,
        campusId: CURRENT_CAMPUS_ID,
        type: 'tool_kill_switch',
        toolId: data.toolId,
        spaceId: data.deployedTo === 'space' ? data.targetId : undefined,
        metadata: {
          deploymentId,
          reason: payload.killReason || 'Manually disabled',
          previousStatus: data.status,
        },
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      });
    }

    if (payload.position !== undefined) {
      updateData.position = payload.position;
    }

    await doc.ref.update(updateData);

    if (placementContext) {
      const placementUpdates: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (payload.config !== undefined) {
        placementUpdates.config = payload.config;
      }
      if (payload.permissions) {
        placementUpdates.permissions = {
          ...placementContext.snapshot?.data()?.permissions,
          ...payload.permissions,
        };
      }
      if (payload.settings) {
        placementUpdates.settings = {
          ...placementContext.snapshot?.data()?.settings,
          ...payload.settings,
        };
      }
      if (payload.status) {
        placementUpdates.status = payload.status;
      }
      if (payload.position !== undefined) {
        placementUpdates.position = payload.position;
      }
      await placementContext.ref.update(placementUpdates);
    }

    await dbAdmin.collection("activityEvents").add({
      userId,
      campusId: CURRENT_CAMPUS_ID,
      type: "tool_interaction",
      toolId: data.toolId,
      spaceId: data.deployedTo === "space" ? data.targetId : undefined,
      metadata: {
        action: "deployment_updated",
        deploymentId,
        changes: Object.keys(payload),
      },
      timestamp: updatedAtIso,
      date: updatedAtIso.split("T")[0],
    });

    const updatedDoc = await doc.ref.get();
    return respond.success({
      deployment: { id: updatedDoc.id, ...updatedDoc.data() },
      message: "Deployment updated successfully",
    });
  },
);

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ deploymentId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { deploymentId } = await params;

  const deploymentResult = await loadDeployment(deploymentId);
  if (!deploymentResult.ok) {
    return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
      status: deploymentResult.status,
    });
  }

  const { doc, data } = deploymentResult;

  const ownsDeployment = data.deployedBy === userId;
  const canManage = await canUserManageDeployment(userId, data);

  if (!ownsDeployment && !canManage) {
    return respond.error("Access denied", "FORBIDDEN", { status: 403 });
  }

  const placementContext = await getPlacementFromDeploymentDoc(doc);

  await doc.ref.delete();
  if (placementContext) {
    await placementContext.ref.delete();
  }

  const toolDoc = await dbAdmin.collection("tools").doc(data.toolId).get();
  if (toolDoc.exists) {
    const toolData = toolDoc.data();
    if (toolData) {
      await toolDoc.ref.update({
        deploymentCount: Math.max(0, (toolData.deploymentCount || 1) - 1),
      });
    }
  }

  const timestamp = new Date().toISOString();
  await dbAdmin.collection("activityEvents").add({
    userId,
    campusId: CURRENT_CAMPUS_ID,
    type: "tool_interaction",
    toolId: data.toolId,
    spaceId: data.deployedTo === "space" ? data.targetId : undefined,
    metadata: {
      action: "deployment_removed",
      deploymentId,
      deployedTo: data.deployedTo,
      surface: data.surface ?? null,
    },
    timestamp,
    date: timestamp.split("T")[0],
  });

  return respond.success({
    success: true,
    message: "Deployment removed successfully",
  });
});
