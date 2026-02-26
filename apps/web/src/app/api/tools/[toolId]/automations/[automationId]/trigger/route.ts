/**
 * Manual Automation Trigger API
 *
 * POST /api/tools/[toolId]/automations/[automationId]/trigger — Run automation manually
 */

import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string; automationId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const campusId = req.user.campusId || '';
  const { toolId, automationId } = await params;

  // Verify access
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const tool = toolDoc.data();
  if (tool?.ownerId !== userId && tool?.createdBy !== userId) {
    return respond.error('Access denied', 'FORBIDDEN', { status: 403 });
  }

  // Fetch automation
  const automationDoc = await dbAdmin.collection('tool_automations').doc(automationId).get();
  if (!automationDoc.exists || automationDoc.data()?.toolId !== toolId) {
    return respond.error('Automation not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const automation = automationDoc.data()!;
  const now = new Date().toISOString();

  // Execute actions via Inngest event
  try {
    const { inngest } = await import('@/lib/inngest/client');
    await inngest.send({
      name: 'tool/action.executed',
      data: {
        toolId,
        deploymentId: automation.deploymentId || toolId,
        elementId: automation.trigger?.elementId || 'manual',
        action: automation.trigger?.eventName || 'manual_trigger',
        userId,
        campusId,
      },
    });
  } catch {
    // Fallback: execute actions directly
    const { executeAutomationActions } = await import('@/lib/automation-executor');
    await executeAutomationActions(automation.actions || [], {
      toolId,
      deploymentId: automation.deploymentId || toolId,
      elementId: 'manual',
      userId,
      campusId,
    });
  }

  // Record the manual run
  await dbAdmin
    .collection('tool_automations')
    .doc(automationId)
    .collection('runs')
    .add({
      timestamp: now,
      triggerType: 'manual',
      triggeredBy: userId,
      status: 'success',
      duration: 0,
    });

  // Update run count
  const { FieldValue } = await import('firebase-admin/firestore');
  await automationDoc.ref.update({
    runCount: FieldValue.increment(1),
    lastRunAt: now,
  });

  return respond.success({ success: true, triggeredAt: now });
});
