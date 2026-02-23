import * as admin from "firebase-admin";
import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { withCache } from '../../../../../lib/cache-headers';

// Schema for tool state update requests
const StateScopeSchema = z.enum(['personal', 'shared']);
const ToolStateSchema = z.object({
  spaceId: z.string().min(1, "spaceId is required"),
  userId: z.string().optional(),
  scope: StateScopeSchema.optional(),
  state: z.record(z.any())
});

type StateScope = z.infer<typeof StateScopeSchema>;

function getStateDocumentId(
  toolId: string,
  spaceId: string,
  scope: StateScope,
  userId: string
): string {
  return scope === 'shared'
    ? `${toolId}_${spaceId}_shared`
    : `${toolId}_${spaceId}_${userId}`;
}

const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const authenticatedUserId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const spaceId = searchParams.get("spaceId");
  const requestedScope = searchParams.get("scope");
  const scopeResult = StateScopeSchema.safeParse(requestedScope ?? undefined);
  if (requestedScope && !scopeResult.success) {
    return respond.error("Invalid scope. Use personal or shared", "INVALID_INPUT", { status: 400 });
  }
  const scope = scopeResult.success ? scopeResult.data : 'personal';
  const userId = searchParams.get("userId") || authenticatedUserId;

  if (!spaceId) {
    return respond.error("spaceId parameter is required", "INVALID_INPUT", { status: 400 });
  }

  if (scope === 'personal' && userId !== authenticatedUserId) {
    return respond.error("Cannot read another user's personal state", "FORBIDDEN", { status: 403 });
  }

    const db = dbAdmin;
    // Enforce campus isolation: verify space and tool belong to campus
    const toolDoc = await db.collection('tools').doc(toolId).get();
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!toolDoc.exists || !spaceDoc.exists || (toolDoc.data()?.campusId !== campusId) || (spaceDoc.data()?.campusId !== campusId)) {
      return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }
    
    // Get tool state document
    const stateDocId = getStateDocumentId(toolId, spaceId, scope, userId);
    const stateDoc = await db
      .collection("tool_states")
      .doc(stateDocId)
      .get();

    if (!stateDoc.exists) {
      return respond.error("Tool state not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const stateData = stateDoc.data();

    return respond.success({
      ...stateData,
      scope,
    });
});

type ToolStateData = z.infer<typeof ToolStateSchema>;

export const POST = withAuthValidationAndErrors(
  ToolStateSchema,
  async (
    request,
    { params }: { params: Promise<{ toolId: string }> },
    body: ToolStateData,
    respond
  ) => {
    const { spaceId, userId: requestUserId, state } = body;
    const scope = body.scope || 'personal';
    const authenticatedUserId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { toolId } = await params;

    // Ensure user can only update their own personal state
    const stateUserId = requestUserId || authenticatedUserId;
    if (scope === 'personal' && stateUserId !== authenticatedUserId) {
      return respond.error("Cannot update another user's state", "FORBIDDEN", { status: 403 });
    }
    const actorUserId = authenticatedUserId;

    const db = dbAdmin;

    // Verify user has access to the space (using flat spaceMembers collection)
    const membershipSnapshot = await db
      .collection("spaceMembers")
      .where("userId", "==", actorUserId)
      .where("spaceId", "==", spaceId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (membershipSnapshot.empty) {
      return respond.error("Access denied to this space", "FORBIDDEN", { status: 403 });
    }

    // Verify tool exists and is deployed to the space
    const toolDoc = await db
      .collection("tools")
      .doc(toolId)
      .get();

    if (!toolDoc.exists) {
      return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const toolData = toolDoc.data();
    if (toolData?.status !== "published") {
      return respond.error("Tool is not published", "INVALID_INPUT", { status: 400 });
    }

    // Check if tool is deployed to the space
    const toolDeploymentDoc = await db
      .collection("tool_deployments")
      .where("toolId", "==", toolId)
      .where("spaceId", "==", spaceId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (toolDeploymentDoc.empty) {
      return respond.error("Tool is not deployed to this space", "FORBIDDEN", { status: 403 });
    }

    // Prepare state document
    const stateDocId = getStateDocumentId(toolId, spaceId, scope, stateUserId);
    const metadataState = (state.metadata && typeof state.metadata === 'object')
      ? state.metadata as Record<string, unknown>
      : {};
    const stateData = {
      ...state,
      toolId,
      spaceId,
      ...(scope === 'personal' ? { userId: stateUserId } : {}),
      scope,
      campusId: campusId,
      metadata: {
        ...metadataState,
        scope,
        updatedBy: actorUserId,
        updatedAt: new Date().toISOString(),
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    };

    // Save tool state
    await db
      .collection("tool_states")
      .doc(stateDocId)
      .set(stateData, { merge: true });

    // Update tool usage analytics
    const analyticsDoc = db
      .collection("tool_analytics")
      .doc(`${toolId}_${spaceId}`);

    await analyticsDoc.set({
      toolId,
      spaceId,
      campusId: campusId,
      lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: admin.firestore.FieldValue.increment(1),
      activeUsers: admin.firestore.FieldValue.arrayUnion(actorUserId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return respond.success({
      savedAt: new Date().toISOString()
    });
  }
);

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const authenticatedUserId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const spaceId = searchParams.get("spaceId");
  const requestedScope = searchParams.get("scope");
  const scopeResult = StateScopeSchema.safeParse(requestedScope ?? undefined);
  if (requestedScope && !scopeResult.success) {
    return respond.error("Invalid scope. Use personal or shared", "INVALID_INPUT", { status: 400 });
  }
  const scope = scopeResult.success ? scopeResult.data : 'personal';
  const userId = searchParams.get("userId") || authenticatedUserId;

  if (!spaceId) {
    return respond.error("spaceId parameter is required", "INVALID_INPUT", { status: 400 });
  }

  // Ensure user can only delete their own personal state
  if (scope === 'personal' && userId !== authenticatedUserId) {
    return respond.error("Cannot delete another user's state", "FORBIDDEN", { status: 403 });
  }

    const db = dbAdmin;
    // Enforce campus isolation: verify space and tool belong to campus
    const toolDoc = await db.collection('tools').doc(toolId).get();
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!toolDoc.exists || !spaceDoc.exists || (toolDoc.data()?.campusId !== campusId) || (spaceDoc.data()?.campusId !== campusId)) {
      return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }
    
    // Delete tool state document
    const stateDocId = getStateDocumentId(toolId, spaceId, scope, userId);
    await db
      .collection("tool_states")
      .doc(stateDocId)
      .delete();

    return respond.success({
      scope,
      deletedAt: new Date().toISOString()
    });
});

export const GET = withCache(_GET, 'SHORT');
