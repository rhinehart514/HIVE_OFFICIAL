/**
 * Manual Automation Trigger API Route
 *
 * POST /api/tools/[toolId]/automations/[automationId]/trigger
 *
 * Allows officers/owners to manually trigger an automation immediately.
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { createBulkNotifications } from '@/lib/notification-service';

// ============================================================================
// HELPERS
// ============================================================================

async function verifyAccess(
  deploymentId: string,
  userId: string
): Promise<{ allowed: boolean; error?: string; deployment?: FirebaseFirestore.DocumentData }> {
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (!deploymentDoc.exists) {
    return { allowed: false, error: 'Tool not found' };
  }

  const deploymentData = deploymentDoc.data();
  const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;

  if (deploymentData?.deployedTo === 'space' && deploymentData?.targetId) {
    const memberRef = dbAdmin
      .collection('spaces')
      .doc(deploymentData.targetId)
      .collection('members')
      .doc(userId);
    const memberDoc = await memberRef.get();
    const memberData = memberDoc.data();

    if (!memberDoc.exists && toolOwnerId !== userId) {
      return { allowed: false, error: 'Access denied' };
    }

    const isOfficer = memberData?.role === 'officer' || memberData?.role === 'leader';
    const isOwner = toolOwnerId === userId;

    if (!isOfficer && !isOwner) {
      return { allowed: false, error: 'Only officers can trigger automations' };
    }
  }

  return { allowed: true, deployment: deploymentData };
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: Record<string, unknown>,
  deploymentId: string,
  deployment: FirebaseFirestore.DocumentData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const actionType = action.type as string;

    switch (actionType) {
      case 'notify': {
        const channel = action.channel as string;
        const title = action.title as string;
        const body = action.body as string;
        const to = action.to as string;

        if (channel === 'push' && deployment.targetId) {
          // Get target users based on 'to' field
          let userIds: string[] = [];

          if (to === 'all_members' || to === 'participants') {
            const membersSnapshot = await dbAdmin
              .collection('spaces')
              .doc(deployment.targetId)
              .collection('members')
              .where('status', '==', 'active')
              .get();
            userIds = membersSnapshot.docs.map(d => d.id);
          } else if (to === 'officers') {
            const membersSnapshot = await dbAdmin
              .collection('spaces')
              .doc(deployment.targetId)
              .collection('members')
              .where('role', 'in', ['officer', 'leader'])
              .get();
            userIds = membersSnapshot.docs.map(d => d.id);
          }

          if (userIds.length > 0 && title && body) {
            await createBulkNotifications(userIds, {
              type: 'system',
              category: 'system',
              title,
              body,
              metadata: {
                deploymentId,
                spaceId: deployment.targetId,
                source: 'tool_automation',
              },
            });
          }
        }
        return { success: true };
      }

      case 'mutate': {
        const elementId = action.elementId as string;
        const mutation = action.mutation as Record<string, unknown>;

        if (elementId && mutation) {
          // Update the tool's state for this element
          const stateRef = dbAdmin
            .collection('deployedTools')
            .doc(deploymentId)
            .collection('state')
            .doc('current');

          await stateRef.set(
            { [`elements.${elementId}`]: mutation },
            { merge: true }
          );
        }
        return { success: true };
      }

      case 'triggerTool': {
        const targetDeploymentId = action.deploymentId as string;
        const event = action.event as string;
        const data = action.data as Record<string, unknown> | undefined;

        if (targetDeploymentId && event) {
          // Record the trigger event for the target tool
          await dbAdmin
            .collection('deployedTools')
            .doc(targetDeploymentId)
            .collection('events')
            .add({
              type: event,
              data: data || {},
              triggeredBy: deploymentId,
              triggeredByUser: userId,
              createdAt: FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
      }

      default:
        return { success: true }; // Unknown action types are no-ops
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// POST - Trigger Automation
// ============================================================================

async function handlePost(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; automationId: string }> }
) {
  const { toolId: deploymentId, automationId } = await params;
  const userId = getUserId(request);

  try {
    // Verify access
    const access = await verifyAccess(deploymentId, userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    // Get the automation
    const automationRef = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automations')
      .doc(automationId);

    const automationDoc = await automationRef.get();

    if (!automationDoc.exists) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    const automation = automationDoc.data();

    if (!automation?.enabled) {
      return NextResponse.json(
        { error: 'Automation is disabled' },
        { status: 400 }
      );
    }

    const actions = automation.actions || [];
    if (actions.length === 0) {
      return NextResponse.json(
        { error: 'Automation has no actions configured' },
        { status: 400 }
      );
    }

    // Execute all actions
    const actionResults: Array<{ type: string; success: boolean; error?: string }> = [];

    for (const action of actions) {
      const result = await executeAction(
        action as Record<string, unknown>,
        deploymentId,
        access.deployment!,
        userId
      );
      actionResults.push({
        type: (action as Record<string, unknown>).type as string,
        ...result,
      });
    }

    const allSucceeded = actionResults.every(r => r.success);
    const now = new Date().toISOString();

    // Record the run
    await dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automationRuns')
      .add({
        automationId,
        automationName: automation.name,
        triggeredBy: 'manual',
        triggeredByUser: userId,
        status: allSucceeded ? 'success' : 'partial_failure',
        actionResults,
        startedAt: now,
        completedAt: now,
      });

    // Update automation stats
    await automationRef.update({
      lastRun: now,
      runCount: FieldValue.increment(1),
      ...(allSucceeded ? {} : { errorCount: FieldValue.increment(1) }),
    });

    logger.info('[automation] Manual trigger executed', {
      deploymentId,
      automationId,
      userId,
      actionsExecuted: actionResults.length,
      success: allSucceeded,
    });

    return NextResponse.json({
      success: allSucceeded,
      message: allSucceeded
        ? 'Automation triggered successfully'
        : 'Automation completed with some failures',
      results: actionResults,
      timestamp: now,
    });
  } catch (error) {
    logger.error('[automation] Manual trigger failed', {
      deploymentId,
      automationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to trigger automation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const POST = withAuthAndErrors(handlePost);
