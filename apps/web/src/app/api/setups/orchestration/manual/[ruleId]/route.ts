/**
 * Setup Orchestration Manual Trigger API
 *
 * POST /api/setups/orchestration/manual/[ruleId] - Manually trigger a rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupDeploymentRepository,
  toSetupDeploymentDetailDTO,
  dbAdmin,
} from '@hive/core/server';
import type { OrchestrationLogEntry, OrchestrationActionConfig } from '@hive/core';

// ============================================================================
// Request Validation
// ============================================================================

const ManualTriggerSchema = z.object({
  deploymentId: z.string().min(1, 'Deployment ID is required'),
});

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// POST /api/setups/orchestration/manual/[ruleId]
// ============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ ruleId: string }> },
) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    // Parse session
    let session: { userId: string };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return errorResponse('Invalid session', 401);
    }

    const { userId } = session;
    const { ruleId } = await context.params;

    if (!ruleId) {
      return errorResponse('Rule ID is required', 400);
    }

    // Parse request body
    const body = await request.json();
    const parseResult = ManualTriggerSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0].message, 400);
    }

    const { deploymentId } = parseResult.data;

    // Get repository
    const repo = getServerSetupDeploymentRepository();

    // Find deployment
    const deploymentResult = await repo.findById(deploymentId);

    if (deploymentResult.isFailure) {
      return errorResponse('Deployment not found', 404);
    }

    const deployment = deploymentResult.getValue();

    // Check if deployment is active
    if (deployment.status !== 'active') {
      return errorResponse('Deployment is not active', 400);
    }

    // Verify user has permission (must be leader)
    const memberDoc = await dbAdmin
      .collection('spaces')
      .doc(deployment.spaceId)
      .collection('members')
      .doc(userId)
      .get();

    if (!memberDoc.exists) {
      return errorResponse('Not a member of this space', 403);
    }

    const memberData = memberDoc.data();
    const role = memberData?.role || 'member';

    if (!['owner', 'admin', 'moderator'].includes(role)) {
      return errorResponse('Only leaders can trigger manual rules', 403);
    }

    // Find the rule
    const rule = deployment.getRule(ruleId);

    if (!rule) {
      return errorResponse('Rule not found', 404);
    }

    // Verify it's a manual trigger rule
    if (rule.trigger.type !== 'manual') {
      return errorResponse('This rule cannot be triggered manually', 400);
    }

    // Check if runOnce rule has already been executed
    if (rule.runOnce && deployment.hasRuleExecuted(rule.id)) {
      return errorResponse('This rule has already been executed', 400);
    }

    // Execute actions
    const actionsExecuted: Array<{
      actionType: string;
      targetSlotId?: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const action of rule.actions) {
      try {
        await executeAction(deployment, action);
        actionsExecuted.push({
          actionType: action.type,
          targetSlotId: 'targetSlotId' in action ? action.targetSlotId : undefined,
          success: true,
        });
      } catch (error) {
        actionsExecuted.push({
          actionType: action.type,
          targetSlotId: 'targetSlotId' in action ? action.targetSlotId : undefined,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log the execution
    const logEntry: Omit<OrchestrationLogEntry, 'id'> = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: new Date(),
      triggerType: 'manual',
      triggerDetails: { triggeredBy: userId },
      actionsExecuted,
      triggeredBy: userId,
      success: actionsExecuted.every(a => a.success),
    };

    deployment.addLogEntry(logEntry);
    deployment.markRuleExecuted(rule.id);

    // Save updated deployment
    await repo.save(deployment);

    // Return results
    const dto = toSetupDeploymentDetailDTO(deployment);

    return jsonResponse({
      executed: true,
      ruleId: rule.id,
      ruleName: rule.name,
      actionsExecuted,
      success: actionsExecuted.every(a => a.success),
      deployment: dto,
    });
  } catch (error) {
    console.error('[API] Error executing manual trigger:', error);
    return errorResponse('Failed to execute manual trigger', 500);
  }
}

// ============================================================================
// Action Executor (simplified version)
// ============================================================================

async function executeAction(
  deployment: ReturnType<typeof import('@hive/core').SetupDeployment.reconstitute>,
  action: OrchestrationActionConfig,
): Promise<void> {
  switch (action.type) {
    case 'visibility': {
      const { targetSlotId, visible } = action as unknown as { targetSlotId: string; visible: boolean };
      deployment.setToolVisibility(targetSlotId, visible);

      const tool = deployment.getTool(targetSlotId);
      if (tool) {
        await dbAdmin
          .collection('spaces')
          .doc(deployment.spaceId)
          .collection('placed_tools')
          .doc(tool.deploymentId)
          .update({
            isActive: visible,
            updatedAt: new Date().toISOString(),
          });
      }
      break;
    }

    case 'config': {
      const { targetSlotId, updates } = action as unknown as {
        targetSlotId: string;
        updates: Record<string, unknown>;
      };
      deployment.updateToolConfig(targetSlotId, updates);

      const tool = deployment.getTool(targetSlotId);
      if (tool) {
        const configUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
          configUpdates[`config.${key}`] = value;
        }
        configUpdates.updatedAt = new Date().toISOString();

        await dbAdmin
          .collection('spaces')
          .doc(deployment.spaceId)
          .collection('placed_tools')
          .doc(tool.deploymentId)
          .update(configUpdates);
      }
      break;
    }

    case 'state': {
      const { targetSlotId, updates } = action as unknown as {
        targetSlotId: string;
        updates: Record<string, unknown>;
      };

      if (targetSlotId === '_shared') {
        deployment.updateSharedData(updates);
      } else {
        for (const [key, value] of Object.entries(updates)) {
          deployment.setSharedDataValue(`${targetSlotId}.${key}`, value);
        }
      }
      break;
    }

    case 'notification': {
      const { recipients, title, body, actionUrl } = action as unknown as {
        recipients: string;
        title: string;
        body: string;
        actionUrl?: string;
      };

      console.log('[Orchestration] Would send notification:', {
        recipients,
        title,
        body,
        actionUrl,
        spaceId: deployment.spaceId,
      });
      break;
    }

    default:
      console.warn('[Orchestration] Unknown action type:', action.type);
  }
}
