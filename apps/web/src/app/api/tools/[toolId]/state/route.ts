import { getFirestore as _getFirestore, FieldValue as _FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { ApiResponseHelper as _ApiResponseHelper, HttpStatus as _HttpStatus } from "@/lib/api-response-types";
import { logger } from "@/lib/logger";
import { withCache } from '../../../../../lib/cache-headers';

// Schema for tool state update requests
const ToolStateSchema = z.object({
  spaceId: z.string().min(1, "spaceId is required"),
  userId: z.string().optional(),
  state: z.record(z.any())
});

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
  const userId = searchParams.get("userId") || authenticatedUserId;

  if (!spaceId) {
    return respond.error("spaceId parameter is required", "INVALID_INPUT", { status: 400 });
  }

    const db = dbAdmin;
    // Enforce campus isolation: verify space and tool belong to campus
    const toolDoc = await db.collection('tools').doc(toolId).get();
    const spaceDoc = await db.collection('spaces').doc(spaceId).get();
    if (!toolDoc.exists || !spaceDoc.exists || (toolDoc.data()?.campusId !== campusId) || (spaceDoc.data()?.campusId !== campusId)) {
      return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }
    
    // Get tool state document
    const stateDoc = await db
      .collection("tool_states")
      .doc(`${toolId}_${spaceId}_${userId}`)
      .get();

    if (!stateDoc.exists) {
      return respond.error("Tool state not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const stateData = stateDoc.data();

    return respond.success(stateData);
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
    const authenticatedUserId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { toolId } = await params;

    // Ensure user can only update their own state
    const userId = requestUserId || authenticatedUserId;
    if (userId !== authenticatedUserId) {
      return respond.error("Cannot update another user's state", "FORBIDDEN", { status: 403 });
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
      .where("campusId", "==", campusId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (toolDeploymentDoc.empty) {
      return respond.error("Tool is not deployed to this space", "FORBIDDEN", { status: 403 });
    }

    // Prepare state document
    const stateDocId = `${toolId}_${spaceId}_${userId}`;
    const stateData = {
      ...state,
      toolId,
      spaceId,
      userId,
      campusId: campusId,
      metadata: {
        ...state.metadata,
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
      activeUsers: admin.firestore.FieldValue.arrayUnion(userId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Trigger threshold automations (non-blocking)
    const deploymentId = toolDeploymentDoc.docs[0]?.id;
    if (deploymentId) {
      triggerThresholdAutomations(
        deploymentId,
        toolId,
        spaceId,
        state,
        userId
      ).catch(err => {
        // Non-blocking - log but don't fail the request
        logger.warn('Threshold automation trigger failed', {
          action: 'threshold_automation_trigger',
          deploymentId,
          toolId,
          spaceId,
          userId,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      });
    }

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
  const userId = searchParams.get("userId") || authenticatedUserId;

  if (!spaceId) {
    return respond.error("spaceId parameter is required", "INVALID_INPUT", { status: 400 });
  }

  // Ensure user can only delete their own state
  if (userId !== authenticatedUserId) {
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
    const stateDocId = `${toolId}_${spaceId}_${userId}`;
    await db
      .collection("tool_states")
      .doc(stateDocId)
      .delete();

    return respond.success({
      deletedAt: new Date().toISOString()
    });
});

/**
 * Trigger threshold automations when tool state changes
 * Non-blocking - runs in background
 */
async function triggerThresholdAutomations(
  deploymentId: string,
  toolId: string,
  spaceId: string,
  newState: Record<string, unknown>,
  userId: string
): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore');

  // Get threshold automations for this deployment
  const automationsSnapshot = await dbAdmin
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automations')
    .where('trigger.type', '==', 'threshold')
    .where('enabled', '==', true)
    .get();

  if (automationsSnapshot.empty) return;

  // Get previous state for comparison
  const previousStateDoc = await dbAdmin
    .collection('tool_states')
    .doc(`${toolId}_${spaceId}_${userId}`)
    .get();

  const previousState = previousStateDoc.exists ? previousStateDoc.data() || {} : {};

  const now = new Date();

  for (const doc of automationsSnapshot.docs) {
    const automation = doc.data();
    const trigger = automation.trigger || {};
    const path = trigger.path as string;
    const operator = trigger.operator as '>' | '<' | '==' | '>=' | '<=';
    const thresholdValue = trigger.value as number;

    // Get previous and current values
    const prevValue = getValueAtPath(previousState, path);
    const currValue = getValueAtPath(newState, path);

    // Check if threshold was crossed
    const wasCrossed = wasThresholdCrossed(
      prevValue,
      currValue,
      operator,
      thresholdValue
    );

    if (!wasCrossed) continue;

    // Check rate limits
    const runsToday = await getRunsToday(deploymentId, doc.id);
    const maxRunsPerDay = automation.limits?.maxRunsPerDay || 100;
    if (runsToday >= maxRunsPerDay) continue;

    // Check cooldown
    if (automation.lastRun) {
      const lastRunTime = new Date(automation.lastRun).getTime();
      const cooldownSeconds = automation.limits?.cooldownSeconds || 60;
      if (Date.now() - lastRunTime < cooldownSeconds * 1000) continue;
    }

    try {
      // Execute actions
      for (const action of automation.actions || []) {
        await executeAutomationAction(action, deploymentId, spaceId, userId, newState);
      }

      // Log run and update stats
      const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await dbAdmin
        .collection('deployedTools')
        .doc(deploymentId)
        .collection('automationRuns')
        .doc(runId)
        .set({
          automationId: doc.id,
          deploymentId,
          timestamp: now.toISOString(),
          status: 'success',
          triggerType: 'threshold',
          triggerData: {
            path,
            operator,
            threshold: thresholdValue,
            previousValue: prevValue,
            currentValue: currValue,
          },
          actionsExecuted: (automation.actions || []).map((a: { type: string }) => a.type),
          duration: Date.now() - now.getTime(),
        });

      await doc.ref.update({
        lastRun: now.toISOString(),
        runCount: FieldValue.increment(1),
      });

      logger.info('Threshold automation triggered', {
        action: 'threshold_automation_success',
        automationName: automation.name,
        deploymentId,
        automationId: doc.id,
        path,
        previousValue: prevValue,
        currentValue: currValue,
      });
    } catch (error) {
      // Log failure
      await doc.ref.update({
        errorCount: FieldValue.increment(1),
        lastRun: now.toISOString(),
      });

      logger.error('Threshold automation failed', {
        action: 'threshold_automation_error',
        automationId: doc.id,
        deploymentId,
      }, error instanceof Error ? error : undefined);
    }
  }
}

/**
 * Get value at a dot-notation path
 */
function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || typeof obj !== 'object' || !path) return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Check if a threshold was crossed
 */
function wasThresholdCrossed(
  prevValue: unknown,
  currValue: unknown,
  operator: '>' | '<' | '==' | '>=' | '<=',
  threshold: number
): boolean {
  const prev = typeof prevValue === 'number' ? prevValue : 0;
  const curr = typeof currValue === 'number' ? currValue : 0;

  const wasAbove = compareValue(prev, operator, threshold);
  const isAbove = compareValue(curr, operator, threshold);

  // Crossed means it wasn't meeting the condition before but is now
  return !wasAbove && isAbove;
}

/**
 * Compare a value against a threshold
 */
function compareValue(
  value: number,
  operator: '>' | '<' | '==' | '>=' | '<=',
  threshold: number
): boolean {
  switch (operator) {
    case '>': return value > threshold;
    case '<': return value < threshold;
    case '==': return value === threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    default: return false;
  }
}

/**
 * Get runs today count for rate limiting
 */
async function getRunsToday(deploymentId: string, automationId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runsRef = dbAdmin
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('automationRuns')
    .where('automationId', '==', automationId)
    .where('timestamp', '>=', today.toISOString());

  const snapshot = await runsRef.count().get();
  return snapshot.data().count;
}

/**
 * Execute a single automation action
 */
async function executeAutomationAction(
  action: { type: string; [key: string]: unknown },
  deploymentId: string,
  spaceId: string,
  userId: string,
  _state: Record<string, unknown>
): Promise<void> {
  if (action.type === 'notify') {
    const { createBulkNotifications } = await import('@/lib/notification-service');

    // Get recipients
    let userIds: string[] = [];
    const to = action.to as string;

    if (to === 'user') {
      userIds = [userId];
    } else if (to === 'all') {
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('status', '==', 'active')
        .get();
      userIds = membersSnapshot.docs.map(d => d.data().userId);
    } else if (to === 'role' && action.roleName) {
      const membersSnapshot = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('role', '==', action.roleName)
        .where('status', '==', 'active')
        .get();
      userIds = membersSnapshot.docs.map(d => d.data().userId);
    }

    if (userIds.length > 0) {
      const channel = action.channel as string;
      if (channel === 'push' || channel === 'email') {
        await createBulkNotifications(userIds, {
          type: 'system',
          category: 'tools',
          title: (action.title as string) || 'Tool Notification',
          body: (action.body as string) || '',
          actionUrl: `/s/${spaceId}`,
          metadata: {
            deploymentId,
            automationType: 'threshold',
          },
        });
      }
    }
  } else if (action.type === 'mutate') {
    const elementId = action.elementId as string;
    const mutation = action.mutation as Record<string, unknown>;

    // Update element state in tool_states
    const stateRef = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('sharedState')
      .doc('current');

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(mutation)) {
      updates[`${elementId}.${key}`] = value;
    }
    updates.lastModified = new Date().toISOString();

    await stateRef.set(updates, { merge: true });
  }
  // triggerTool action would call another tool's event endpoint
}

export const GET = withCache(_GET, 'SHORT');
