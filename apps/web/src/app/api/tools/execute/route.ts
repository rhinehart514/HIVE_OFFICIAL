// Use admin SDK methods since we're in an API route
import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from "@/lib/logger";
import { getPlacementFromDeploymentDoc } from '@/lib/tool-placement';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import {
  withAuthValidationAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { z } from "zod";
import {
  executeAction,
  type ActionContext,
  type ActionResult,
  type ToolElement as ActionToolElement,
  type ToolData as ActionToolData,
  type DeploymentData as ActionDeploymentData,
} from '@/lib/tool-action-handlers';

// Deployment data interface
interface DeploymentData {
  id: string;
  status?: string;
  toolId?: string;
  deployedTo?: 'profile' | 'space';
  targetId?: string;
  surface?: string;
  permissions?: {
    canInteract?: boolean;
    allowedRoles?: string[];
  };
  settings?: {
    collectAnalytics?: boolean;
    [key: string]: unknown;
  };
  usageCount?: number;
  [key: string]: unknown;
}

// Tool data interface
interface ToolData {
  id?: string;
  elements?: ToolElement[];
  useCount?: number;
  [key: string]: unknown;
}

// Tool element interface
interface ToolElement {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  actions?: ToolAction[];
  [key: string]: unknown;
}

// Tool action interface
interface ToolAction {
  id: string;
  type: string;
  handler?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

// Tool execution request interface
interface _ToolExecutionRequest {
  deploymentId: string;
  action: string;
  elementId?: string;
  data?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

// Tool execution result interface
interface ToolExecutionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  feedContent?: {
    type: 'post' | 'update' | 'achievement';
    content: string;
    metadata?: Record<string, unknown>;
  };
  state?: Record<string, unknown>;
  notifications?: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    recipients?: string[];
  }>;
}

const ToolExecutionSchema = z.object({
  deploymentId: z.string(),
  action: z.string(),
  elementId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
});

/**
 * Resolve deployment document from various ID formats:
 * 1. Composite ID: "space:spaceId_placementId" → placed_tools subcollection
 * 2. Direct ID → deployedTools collection
 */
async function resolveDeployment(deploymentId: string): Promise<{
  doc: admin.firestore.DocumentSnapshot | null;
  ref: admin.firestore.DocumentReference | null;
  placementRef: admin.firestore.DocumentReference | null;
  spaceId: string | null;
}> {
  // Check for composite ID format: "space:spaceId_placementId"
  if (deploymentId.startsWith('space:')) {
    const rest = deploymentId.slice(6); // Remove 'space:' prefix
    const underscoreIndex = rest.indexOf('_');
    if (underscoreIndex > 0) {
      const spaceId = rest.slice(0, underscoreIndex);
      const placementId = rest.slice(underscoreIndex + 1);

      // Get from placed_tools subcollection
      const placementRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('placed_tools')
        .doc(placementId);

      const placementDoc = await placementRef.get();
      if (placementDoc.exists) {
        return {
          doc: placementDoc,
          ref: placementRef,
          placementRef,
          spaceId,
        };
      }
    }
  }

  // Fallback: Check deployedTools collection
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (deploymentDoc.exists) {
    const data = deploymentDoc.data();
    return {
      doc: deploymentDoc,
      ref: deploymentRef,
      placementRef: null,
      spaceId: data?.targetId || null,
    };
  }

  return { doc: null, ref: null, placementRef: null, spaceId: null };
}

// POST - Execute tool action
export const POST = withAuthValidationAndErrors(
  ToolExecutionSchema,
  async (
    request,
    _context,
    body,
    respond
  ) => {
    try {
      const userId = getUserId(request as AuthenticatedRequest);
      const { deploymentId, action, elementId, data, context } = body;

    // Get deployment details from either placed_tools or deployedTools
    const resolved = await resolveDeployment(deploymentId);
    if (!resolved.doc) {
        return respond.error("Deployment not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const deploymentDocData = resolved.doc.data() || {};
    const deployment = { id: resolved.doc.id, ...deploymentDocData } as DeploymentData;

    // For placed_tools, fill in missing fields
    if (resolved.placementRef && resolved.spaceId) {
      deployment.deployedTo = 'space';
      deployment.targetId = resolved.spaceId;
    }

    // Enforce campus isolation
    if ((deployment as Record<string, unknown>)?.campusId && (deployment as Record<string, unknown>).campusId !== CURRENT_CAMPUS_ID) {
        return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }

    // Use resolved placementRef or fall back to getPlacementFromDeploymentDoc
    let placementContext: { snapshot: admin.firestore.DocumentSnapshot; ref: admin.firestore.DocumentReference } | null = null;
    if (resolved.placementRef) {
      placementContext = { snapshot: resolved.doc, ref: resolved.placementRef };
    } else {
      placementContext = await getPlacementFromDeploymentDoc(resolved.doc);
    }
    const placementData = placementContext?.snapshot?.data() as (Record<string, unknown> | undefined);

    // Check if deployment is active
    const deploymentStatus = placementData?.status || deployment.status;
    if (deploymentStatus !== 'active') {
        return respond.error("Tool deployment is not active", "FORBIDDEN", { status: 403 });
    }

    // Check user permissions
    if (!await canUserExecuteTool(userId, deployment, placementData)) {
        return respond.error("Insufficient permissions", "FORBIDDEN", { status: 403 });
    }

    // Get tool details
    if (!deployment.toolId) {
        return respond.error("Invalid deployment: missing toolId", "INVALID_DATA", { status: 400 });
    }
    const toolDoc = await dbAdmin.collection('tools').doc(deployment.toolId).get();
    if (!toolDoc.exists) {
        return respond.error("Tool not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const tool = toolDoc.data() as ToolData;
    if ((tool as Record<string, unknown>)?.campusId && (tool as Record<string, unknown>).campusId !== CURRENT_CAMPUS_ID) {
        return respond.error("Access denied for this campus", "FORBIDDEN", { status: 403 });
    }
    if (!tool) {
        return respond.error("Tool data not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Execute tool action
    const executionResult = await executeToolAction({
      deployment,
      tool,
        user: { uid: userId },
      action,
      elementId,
      data: data || {},
        context: context || {},
        placementContext
    });

    // Update deployment usage stats
    const nowIso = new Date().toISOString();

    // Update the appropriate deployment document based on source
    if (placementContext) {
      // For placed_tools, update via placementContext.ref
      await placementContext.ref.update({
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (resolved.ref) {
      // For deployedTools, update directly
      await resolved.ref.update({
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsed: nowIso
      });
    }

    // Update tool usage stats
    await dbAdmin.collection('tools').doc(deployment.toolId).update({
      useCount: (tool.useCount || 0) + 1,
      lastUsedAt: nowIso
    });

    // Log activity event
    await dbAdmin.collection('activityEvents').add({
        userId,
      type: 'tool_interaction',
      toolId: deployment.toolId,
      spaceId: deployment.deployedTo === 'space' ? deployment.targetId : undefined,
      duration: context?.duration || undefined,
      metadata: {
        action,
        elementId,
        deploymentId,
        success: executionResult.success,
        surface: deployment.surface
      },
      timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        campusId: CURRENT_CAMPUS_ID,
    });

    // Generate feed content if requested and successful
    if (executionResult.success && executionResult.feedContent) {
      await generateFeedContent(deployment, tool, userId, executionResult.feedContent);
    }

    // Send notifications if any
    if (executionResult.notifications) {
      await processNotifications(deployment, executionResult.notifications);
    }

      return respond.success({
      result: executionResult,
      deploymentId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(
      `Error executing tool at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
      return respond.error("Failed to execute tool", "INTERNAL_ERROR", { status: 500 });
  }
  }
);

// Helper function to check tool execution permissions
async function canUserExecuteTool(
  userId: string,
  deployment: DeploymentData,
  placement?: Record<string, unknown>
): Promise<boolean> {
  try {
    const permissionConfig = (placement?.permissions || deployment.permissions) as { canInteract?: boolean; allowedRoles?: string[] } | undefined;
    if (permissionConfig?.canInteract === false) {
      return false;
    }

    const targetType = placement?.targetType || deployment.deployedTo;
    const targetId = placement?.targetId || deployment.targetId;

    if (targetType === 'profile') {
      return targetId === userId;
    }

    if (targetType === 'space') {
      const membershipQuery = dbAdmin.collection('members')
        .where('userId', '==', userId)
        .where('spaceId', '==', targetId)
        .where('status', '==', 'active')
        .where('campusId', '==', CURRENT_CAMPUS_ID);
      const membershipSnapshot = await membershipQuery.get();

      if (membershipSnapshot.empty) {
        return false;
      }

      const memberData = membershipSnapshot.docs[0].data() as { role: string; [key: string]: unknown };
      const allowedRoles = permissionConfig?.allowedRoles || deployment.permissions?.allowedRoles;
      return allowedRoles?.includes(memberData.role) || false;
    }

    return false;
  } catch (error) {
    logger.error(
      `Error checking tool execution permissions at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return false;
  }
}

// Helper function to execute tool action
async function executeToolAction(params: {
  deployment: DeploymentData;
  tool: ToolData;
  user: { uid: string };
  action: string;
  elementId?: string;
  data: Record<string, unknown>;
  context: Record<string, unknown>;
  placementContext?: Awaited<ReturnType<typeof getPlacementFromDeploymentDoc>> | null;
}): Promise<ToolExecutionResult> {
  const { deployment, tool, user, action, elementId, data, placementContext } = params;

  try {
    // Get or create tool state
    const stateId = `${deployment.id}_${user.uid}`;
    let currentState: Record<string, unknown> = {};

    let placementStateRef: admin.firestore.DocumentReference<admin.firestore.DocumentData> | null = null;
    if (placementContext) {
      placementStateRef = placementContext.ref.collection('state').doc(user.uid);
      const stateSnapshot = await placementStateRef.get();
      if (stateSnapshot.exists) {
        currentState = (stateSnapshot.data()?.state as Record<string, unknown>) || {};
      }
    } else {
      const stateDoc = await dbAdmin.collection('toolStates').doc(stateId).get();
      currentState = stateDoc.exists ? (stateDoc.data() as { state?: Record<string, unknown> })?.state || {} : {};
    }

    // Find the target element if elementId is provided
    let targetElement: ToolElement | null = null;
    if (elementId) {
      targetElement = tool.elements?.find((el: ToolElement) => el.id === elementId) || null;
      if (!targetElement) {
        return {
          success: false,
          error: `Element ${elementId} not found in tool`
        };
      }
    }

    // Build action context for the extensible handler system
    const actionContext: ActionContext = {
      deployment: deployment as ActionDeploymentData,
      tool: tool as ActionToolData,
      userId: user.uid,
      elementId,
      element: targetElement as ActionToolElement | null,
      data,
      state: currentState,
      metadata: params.context,
    };

    // Execute action through the extensible handler registry
    const result = await executeAction(action, actionContext) as ToolExecutionResult;

    // Save updated state if action was successful
    if (result.success && result.state) {
      const statePayload = {
        deploymentId: deployment.id,
        toolId: tool.id || deployment.toolId,
        userId: user.uid,
        state: result.state,
        updatedAt: new Date().toISOString(),
        campusId: CURRENT_CAMPUS_ID,
      };

      if (placementStateRef) {
        await placementStateRef.set(statePayload, { merge: true });
      }

      await dbAdmin.collection('toolStates').doc(stateId).set(statePayload);
    }

    if (result.success && placementContext && action.startsWith('submit')) {
      const submissionRecord = {
        userId: user.uid,
        actionName: action,
        elementId: elementId || null,
        payload: data || {},
        response: result.data || {},
        metadata: {},
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await placementContext.ref
        .collection('responses')
        .doc(user.uid)
        .set(submissionRecord, { merge: true });

      await placementContext.ref.set(
        {
          responseCount: admin.firestore.FieldValue.increment(1),
          lastResponseAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return result;
  } catch (error) {
    logger.error(
      `Error in tool execution at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return {
      success: false,
      error: 'Tool execution failed'
    };
  }
}

// Helper function to generate feed content
async function generateFeedContent(deployment: DeploymentData, tool: ToolData, userId: string, feedContent: ToolExecutionResult['feedContent']) {
  try {
    if (deployment.deployedTo === 'space' && deployment.settings?.collectAnalytics && feedContent) {
      await dbAdmin.collection('posts').add({
        authorId: userId,
        spaceId: deployment.targetId,
        campusId: CURRENT_CAMPUS_ID,
        type: 'tool_generated',
        toolId: deployment.toolId,
        content: feedContent.content,
        metadata: {
          ...feedContent.metadata,
          deploymentId: deployment.id,
          generatedBy: 'tool_execution'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'published',
        engagement: { likes: 0, comments: 0, shares: 0 }
      });
    }
  } catch (error) {
    logger.error(
      `Error generating feed content at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Helper function to process notifications
async function processNotifications(deployment: DeploymentData, notifications: ToolExecutionResult['notifications']) {
  try {
    if (!notifications) return;
    for (const notification of notifications) {
      await dbAdmin.collection('notifications').add({
        type: notification.type,
        message: notification.message,
        recipients: notification.recipients || [],
        deploymentId: deployment.id,
        toolId: deployment.toolId,
        spaceId: deployment.deployedTo === 'space' ? deployment.targetId : undefined,
        campusId: CURRENT_CAMPUS_ID,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  } catch (error) {
    logger.error(
      `Error processing notifications at /api/tools/execute`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}
