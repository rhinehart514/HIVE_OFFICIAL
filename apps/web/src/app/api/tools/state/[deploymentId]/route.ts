"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger as _logger } from "@/lib/structured-logger";
import { getPlacementFromDeploymentDoc } from "@/lib/tool-placement";
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { withCache } from '../../../../../lib/cache-headers';

const STATE_SIZE_LIMIT_BYTES = 1024 * 1024; // 1MB

const UpdateStateSchema = z.object({
  state: z.record(z.unknown()),
  metadata: z
    .object({
      version: z.string().optional(),
      autoSave: z.boolean().optional(),
    })
    .optional(),
  merge: z.boolean().optional(),
});

const PatchStateSchema = z.object({
  path: z.string().min(1),
  value: z.unknown().optional(),
  operation: z
    .enum(["set", "delete", "increment", "append"])
    .optional(),
});

type DeploymentDoc =
  FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;

interface ToolStateDocument {
  deploymentId: string;
  toolId: string;
  userId: string;
  state: Record<string, unknown>;
  metadata: {
    version: string;
    lastSaved: string | null;
    autoSave: boolean;
    size: number;
  };
  createdAt: string;
  updatedAt: string;
  campusId?: string;
}

async function loadDeployment(deploymentId: string, campusId: string) {
  // Handle standalone deployments (standalone:{toolId})
  if (deploymentId.startsWith('standalone:')) {
    const toolId = deploymentId.replace('standalone:', '');
    return {
      ok: true as const,
      doc: null,
      data: {
        deploymentId,
        toolId,
        deployedTo: 'standalone',
        targetId: null,
        campusId: null, // Standalone tools are not campus-isolated
      },
    };
  }

  // Handle space deployments (space:{spaceId}_{placementId})
  const doc = await dbAdmin.collection("deployedTools").doc(deploymentId).get();
  if (!doc.exists) {
    return {
      ok: false as const,
      status: 404,
      message: "Deployment not found",
    };
  }

  const data = doc.data();
  if (!data) {
    return {
      ok: false as const,
      status: 400,
      message: "Invalid deployment data",
    };
  }

  if (data.campusId && data.campusId !== campusId) {
    return {
      ok: false as const,
      status: 403,
      message: "Access denied for this campus",
    };
  }

  return { ok: true as const, doc, data };
}

async function canUserAccessDeploymentState(
  userId: string,
  deployment: FirebaseFirestore.DocumentData,
  campusId: string,
) {
  // Standalone tools are accessible to all authenticated users
  if (deployment.deployedTo === "standalone") {
    return true;
  }

  if (deployment.deployedTo === "profile") {
    return deployment.targetId === userId;
  }

  if (deployment.deployedTo === "space") {
    const membershipSnapshot = await dbAdmin
      .collection("spaceMembers")
      .where("userId", "==", userId)
      .where("spaceId", "==", deployment.targetId)
      .where("status", "==", "active")
      .where("campusId", "==", campusId)
      .limit(1)
      .get();
    return !membershipSnapshot.empty;
  }

  return false;
}

async function ensureStateAccess(
  userId: string,
  deploymentDoc: DeploymentDoc | null,
  deploymentData: FirebaseFirestore.DocumentData,
  campusId: string,
) {
  if (!deploymentData) {
    return {
      ok: false as const,
      status: 400,
      message: "Invalid deployment data",
    };
  }

  // Standalone deployments skip campus isolation
  if (deploymentData.deployedTo !== 'standalone') {
    if (deploymentData.campusId && deploymentData.campusId !== campusId) {
      return {
        ok: false as const,
        status: 403,
        message: "Access denied for this campus",
      };
    }
  }

  const hasAccess = await canUserAccessDeploymentState(userId, deploymentData, campusId);
  if (!hasAccess) {
    return {
      ok: false as const,
      status: 403,
      message: "Access denied",
    };
  }

  return { ok: true as const, deploymentData };
}

async function fetchStateDocuments(
  deploymentDoc: DeploymentDoc | null,
  deploymentId: string,
  userId: string,
) {
  // Standalone deployments don't have placement context
  const placementContext = deploymentDoc ? await getPlacementFromDeploymentDoc(deploymentDoc) : null;
  const placementStateDoc = placementContext
    ? await placementContext.ref.collection("state").doc(userId).get()
    : null;

  const globalStateDoc = await dbAdmin
    .collection("toolStates")
    .doc(`${deploymentId}_${userId}`)
    .get();

  return { placementContext, placementStateDoc, globalStateDoc };
}

function ensureStateWithinLimit(state: Record<string, unknown>) {
  const size = JSON.stringify(state).length;
  if (size > STATE_SIZE_LIMIT_BYTES) {
    return {
      ok: false as const,
      status: 413,
      message: "State data too large (max 1MB)",
    };
  }
  return { ok: true as const, size };
}

function mergeState(
  existing: Record<string, unknown> | undefined,
  incoming: Record<string, unknown>,
  shouldMerge: boolean | undefined,
) {
  if (!existing || !shouldMerge) {
    return incoming;
  }
  return { ...existing, ...incoming };
}

function getNestedValue(object: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, object);
}

function setNestedValue(object: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current: Record<string, unknown>, key) => {
    if (!(key in current)) current[key] = {};
    return current[key] as Record<string, unknown>;
  }, object);
  target[lastKey] = value;
}

function deleteNestedValue(object: Record<string, unknown>, path: string): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current: unknown, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, object);
  if (target && typeof target === 'object' && lastKey in target) {
    delete (target as Record<string, unknown>)[lastKey];
  }
}

function applyPatchOperation(
  state: Record<string, unknown>,
  patch: z.infer<typeof PatchStateSchema>,
) {
  const operation = patch.operation || 'set';
  switch (operation) {
    case "set":
      setNestedValue(state, patch.path, patch.value);
      break;
    case "delete":
      deleteNestedValue(state, patch.path);
      break;
    case "increment": {
      const currentValue = Number(getNestedValue(state, patch.path)) || 0;
      setNestedValue(state, patch.path, currentValue + Number(patch.value ?? 1));
      break;
    }
    case "append": {
      const currentArray = getNestedValue(state, patch.path) || [];
      if (!Array.isArray(currentArray)) {
        return {
          ok: false as const,
          status: 400,
          message: "Path does not point to an array",
        };
      }
      currentArray.push(patch.value);
      setNestedValue(state, patch.path, currentArray);
      break;
    }
    default:
      return {
        ok: false as const,
        status: 400,
        message: "Unsupported operation",
      };
  }
  return { ok: true as const };
}

function createStatePayload(
  deploymentId: string,
  toolId: string,
  userId: string,
  state: Record<string, unknown>,
  size: number,
  campusId: string,
  metadata?: { version?: string; autoSave?: boolean },
  createdAt?: string,
): ToolStateDocument {
  const timestamp = new Date().toISOString();
  return {
    deploymentId,
    toolId,
    userId,
    state,
    metadata: {
      version: metadata?.version ?? "1.0.0",
      lastSaved: timestamp,
      autoSave: metadata?.autoSave !== false,
      size,
    },
    createdAt: createdAt ?? timestamp,
    updatedAt: timestamp,
    campusId,
  };
}

const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ deploymentId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest) || '';
  const { deploymentId } = await params;

  const deploymentResult = await loadDeployment(deploymentId, campusId);
  if (!deploymentResult.ok) {
    return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
      status: deploymentResult.status,
    });
  }

  const accessResult = await ensureStateAccess(
    userId,
    deploymentResult.doc,
    deploymentResult.data,
    campusId
  );
  if (!accessResult.ok) {
    return respond.error(accessResult.message, "FORBIDDEN", {
      status: accessResult.status,
    });
  }

  const { placementContext: _placementContext, placementStateDoc, globalStateDoc } =
    await fetchStateDocuments(deploymentResult.doc, deploymentId, userId);

  const stateDoc =
    (placementStateDoc && placementStateDoc.exists
      ? (placementStateDoc.data() as ToolStateDocument)
      : null) ??
    (globalStateDoc.exists
      ? (globalStateDoc.data() as ToolStateDocument)
      : null);

  if (!stateDoc) {
    return respond.success({
      state: {},
      metadata: {
        version: "1.0.0",
        lastSaved: null,
        autoSave: true,
        size: 0,
      },
      exists: false,
    });
  }

  return respond.success({
    state: stateDoc.state,
    metadata: stateDoc.metadata,
    exists: true,
    createdAt: stateDoc.createdAt,
    updatedAt: stateDoc.updatedAt,
  });
});

export const PUT = withAuthValidationAndErrors(
  UpdateStateSchema,
  async (
    request,
    { params }: { params: Promise<{ deploymentId: string }> },
    body,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest) || '';
    const { deploymentId } = await params;

    const deploymentResult = await loadDeployment(deploymentId, campusId);
    if (!deploymentResult.ok) {
      return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
        status: deploymentResult.status,
      });
    }

    const { data: deploymentData } = deploymentResult;

    const accessResult = await ensureStateAccess(
      userId,
      deploymentResult.doc,
      deploymentData,
      campusId
    );
    if (!accessResult.ok) {
      return respond.error(accessResult.message, "FORBIDDEN", {
        status: accessResult.status,
      });
    }

    const { placementContext, placementStateDoc, globalStateDoc } =
      await fetchStateDocuments(deploymentResult.doc, deploymentId, userId);

    const existingState =
      placementStateDoc?.data()?.state ??
      globalStateDoc.data()?.state ??
      undefined;

    const mergedState = mergeState(existingState, body.state, body.merge);

    const sizeCheck = ensureStateWithinLimit(mergedState);
    if (!sizeCheck.ok) {
      return respond.error(sizeCheck.message, "INVALID_INPUT", {
        status: sizeCheck.status,
      });
    }

    const existingCreatedAt =
      (placementStateDoc?.data() as ToolStateDocument | undefined)?.createdAt ??
      (globalStateDoc.data() as ToolStateDocument | undefined)?.createdAt;

    const stateDocument = createStatePayload(
      deploymentId,
      deploymentData.toolId ?? "",
      userId,
      mergedState,
      sizeCheck.size,
      campusId,
      body.metadata,
      existingCreatedAt,
    );

    await dbAdmin
      .collection("toolStates")
      .doc(`${deploymentId}_${userId}`)
      .set(stateDocument);

    if (placementContext) {
      await placementContext.ref.collection("state").doc(userId).set(
        stateDocument,
        {
          merge: true,
        },
      );
    }

    return respond.success({
      success: true,
      state: mergedState,
      metadata: stateDocument.metadata,
      updatedAt: stateDocument.updatedAt,
    });
  },
);

export const PATCH = withAuthValidationAndErrors(
  PatchStateSchema,
  async (
    request,
    { params }: { params: Promise<{ deploymentId: string }> },
    body,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest) || '';
    const { deploymentId } = await params;

    const deploymentResult = await loadDeployment(deploymentId, campusId);
    if (!deploymentResult.ok) {
      return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
        status: deploymentResult.status,
      });
    }

    const accessResult = await ensureStateAccess(
      userId,
      deploymentResult.doc,
      deploymentResult.data,
      campusId
    );
    if (!accessResult.ok) {
      return respond.error(accessResult.message, "FORBIDDEN", {
        status: accessResult.status,
      });
    }

    const { placementContext, placementStateDoc, globalStateDoc } =
      await fetchStateDocuments(deploymentResult.doc, deploymentId, userId);

    const sourceDoc =
      placementStateDoc && placementStateDoc.exists
        ? (placementStateDoc.data() as ToolStateDocument)
        : (globalStateDoc.data() as ToolStateDocument | undefined);

    if (!sourceDoc) {
      return respond.error("State not found", "RESOURCE_NOT_FOUND", {
        status: 404,
      });
    }

    const mutableState = { ...sourceDoc.state };
    const patchResult = applyPatchOperation(mutableState, body);
    if (!patchResult.ok) {
      return respond.error(patchResult.message, "INVALID_INPUT", {
        status: patchResult.status,
      });
    }

    const sizeCheck = ensureStateWithinLimit(mutableState);
    if (!sizeCheck.ok) {
      return respond.error(sizeCheck.message, "INVALID_INPUT", {
        status: sizeCheck.status,
      });
    }

    const timestamp = new Date().toISOString();
    const stateId = `${deploymentId}_${userId}`;

    await dbAdmin.collection("toolStates").doc(stateId).set(
      {
        state: mutableState,
        "metadata.size": sizeCheck.size,
        "metadata.lastSaved": timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );

    if (placementContext) {
      await placementContext.ref.collection("state").doc(userId).set(
        {
          state: mutableState,
          metadata: {
            ...(sourceDoc.metadata ?? {}),
            size: sizeCheck.size,
            lastSaved: timestamp,
          },
          updatedAt: timestamp,
        },
        { merge: true },
      );
    }

    return respond.success({
      success: true,
      state: mutableState,
      operation: body.operation,
      path: body.path,
      value: body.value,
      updatedAt: timestamp,
    });
  },
);

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ deploymentId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest) || '';
  const { deploymentId } = await params;

  const deploymentResult = await loadDeployment(deploymentId, campusId);
  if (!deploymentResult.ok) {
    return respond.error(deploymentResult.message, "RESOURCE_NOT_FOUND", {
      status: deploymentResult.status,
    });
  }

  const accessResult = await ensureStateAccess(
    userId,
    deploymentResult.doc,
    deploymentResult.data,
    campusId
  );
  if (!accessResult.ok) {
    return respond.error(accessResult.message, "FORBIDDEN", {
      status: accessResult.status,
    });
  }

  const { placementContext } = await fetchStateDocuments(
    deploymentResult.doc,
    deploymentId,
    userId,
  );

  await dbAdmin
    .collection("toolStates")
    .doc(`${deploymentId}_${userId}`)
    .delete();

  if (placementContext) {
    await placementContext.ref.collection("state").doc(userId).delete();
  }

  return respond.success({
    success: true,
    message: "Tool state cleared successfully",
  });
});

export const GET = withCache(_GET, 'SHORT');
