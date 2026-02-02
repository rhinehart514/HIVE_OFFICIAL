/**
 * Setup Orchestration Data Change API
 *
 * POST /api/setups/orchestration/data-change - Evaluate data condition triggers
 *
 * Called when shared data changes to evaluate data_condition triggers.
 * Can be triggered by tool actions, cron jobs, or direct API calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupDeploymentRepository,
  toSetupDeploymentDetailDTO,
  dbAdmin,
} from '@hive/core/server';
import { getOrchestrationExecutor } from '@hive/core';
import { createBulkNotifications } from '@/lib/notification-service';

// ============================================================================
// Request Validation
// ============================================================================

const DataChangeSchema = z.object({
  deploymentId: z.string().min(1, 'Deployment ID is required'),
  source: z.enum(['cron', 'tool_action', 'api']).optional().default('api'),
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
// POST /api/setups/orchestration/data-change
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    // Parse session
    let session: { userId: string; campusId?: string };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return errorResponse('Invalid session', 401);
    }

    const { userId } = session;

    // Parse request body
    const body = await request.json();
    const parseResult = DataChangeSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0].message, 400);
    }

    const { deploymentId, source } = parseResult.data;

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

    // Create executor with callbacks for persistence
    const executor = getOrchestrationExecutor({
      updateToolVisibility: async (spaceId, toolDeploymentId, visible) => {
        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('placed_tools')
          .doc(toolDeploymentId)
          .update({
            isActive: visible,
            updatedAt: new Date().toISOString(),
          });
      },
      updateToolConfig: async (spaceId, toolDeploymentId, config) => {
        const configUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(config)) {
          configUpdates[`config.${key}`] = value;
        }
        configUpdates.updatedAt = new Date().toISOString();

        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('placed_tools')
          .doc(toolDeploymentId)
          .update(configUpdates);
      },
    });

    // Execute data condition rules
    const result = await executor.executeOnDataChange(deployment, userId);

    if (result.totalRulesEvaluated === 0) {
      return jsonResponse({
        executed: [],
        message: 'No matching data condition rules found',
        source,
      });
    }

    // Persist visibility and config changes to placed_tools
    for (const ruleResult of result.executedRules) {
      if (ruleResult.skipped) continue;

      for (const actionResult of ruleResult.actionsExecuted) {
        if (!actionResult.success) continue;

        if (actionResult.actionType === 'visibility' && actionResult.targetSlotId) {
          const tool = deployment.getTool(actionResult.targetSlotId);
          if (tool) {
            await dbAdmin
              .collection('spaces')
              .doc(deployment.spaceId)
              .collection('placed_tools')
              .doc(tool.deploymentId)
              .update({
                isActive: actionResult.updates?.visible,
                updatedAt: new Date().toISOString(),
              });
          }
        }

        if (actionResult.actionType === 'config' && actionResult.targetSlotId && actionResult.updates) {
          const tool = deployment.getTool(actionResult.targetSlotId);
          if (tool) {
            const configUpdates: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(actionResult.updates)) {
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
        }

        // Handle notification actions
        if (actionResult.actionType === 'notification' && actionResult.updates) {
          const notifData = actionResult.updates as {
            recipients?: 'all' | 'leaders';
            title?: string;
            body?: string;
            actionUrl?: string;
          };

          let userIds: string[] = [];
          const spaceId = deployment.spaceId;

          if (notifData.recipients === 'all') {
            const membersSnapshot = await dbAdmin
              .collection('spaceMembers')
              .where('spaceId', '==', spaceId)
              .where('isActive', '==', true)
              .get();
            userIds = membersSnapshot.docs.map(d => d.data().userId);
          } else if (notifData.recipients === 'leaders') {
            const leadersSnapshot = await dbAdmin
              .collection('spaceMembers')
              .where('spaceId', '==', spaceId)
              .where('role', 'in', ['owner', 'admin', 'moderator', 'leader'])
              .where('isActive', '==', true)
              .get();
            userIds = leadersSnapshot.docs.map(d => d.data().userId);
          }

          if (userIds.length > 0) {
            await createBulkNotifications(userIds, {
              type: 'system',
              category: 'tools',
              title: notifData.title || 'Setup Notification',
              body: notifData.body || '',
              actionUrl: notifData.actionUrl || `/s/${spaceId}`,
              metadata: {
                deploymentId: deployment.id,
                templateId: deployment.templateId,
                orchestrationType: 'data_condition',
              },
            });
          }
        }
      }
    }

    // Save updated deployment
    await repo.save(deployment);

    // Return results
    const dto = toSetupDeploymentDetailDTO(deployment);
    const executedRuleIds = result.executedRules
      .filter(r => !r.skipped)
      .map(r => r.ruleId);

    return jsonResponse({
      executed: executedRuleIds,
      logs: result.logEntries,
      deployment: dto,
      source,
      meta: {
        totalRulesEvaluated: result.totalRulesEvaluated,
        totalActionsExecuted: result.totalActionsExecuted,
        overallSuccess: result.overallSuccess,
      },
    });
  } catch {
    return errorResponse('Failed to handle data change orchestration', 500);
  }
}
