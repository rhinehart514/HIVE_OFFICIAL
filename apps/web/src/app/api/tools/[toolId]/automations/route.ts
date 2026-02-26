/**
 * Automation CRUD API
 *
 * GET  /api/tools/[toolId]/automations — List automations for a tool/deployment
 * POST /api/tools/[toolId]/automations — Create a new automation
 */

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

// ============================================================================
// Schemas
// ============================================================================

const TriggerSchema = z.object({
  type: z.enum(['event', 'schedule', 'threshold']),
  elementId: z.string().optional(),
  eventName: z.string().optional(),
  cron: z.string().optional(),
  scheduleType: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
  hour: z.number().min(0).max(23).optional(),
  minute: z.number().min(0).max(59).optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  path: z.string().optional(),
  operator: z.string().optional(),
  value: z.number().optional(),
});

const ConditionSchema = z.object({
  path: z.string(),
  operator: z.string(),
  value: z.unknown(),
});

const ActionSchema = z.object({
  type: z.enum(['notify', 'mutate', 'triggerTool']),
  title: z.string().optional(),
  body: z.string().optional(),
  recipients: z.union([z.string(), z.array(z.string())]).optional(),
  elementId: z.string().optional(),
  mutation: z.record(z.unknown()).optional(),
  deploymentId: z.string().optional(),
  eventName: z.string().optional(),
});

const CreateAutomationSchema = z.object({
  name: z.string().min(1).max(120),
  trigger: TriggerSchema,
  conditions: z.array(ConditionSchema).default([]),
  actions: z.array(ActionSchema).min(1),
  limits: z.object({
    maxRunsPerDay: z.number().min(1).max(1000).default(100),
    cooldownSeconds: z.number().min(0).max(86400).default(60),
  }).default({ maxRunsPerDay: 100, cooldownSeconds: 60 }),
});

// ============================================================================
// Helpers
// ============================================================================

async function verifyToolAccess(toolId: string, userId: string): Promise<boolean> {
  // Check if user owns the tool
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) return false;
  const tool = toolDoc.data();
  if (tool?.ownerId === userId || tool?.createdBy === userId) return true;

  // Check if user has deployed this tool (deployment access)
  const deployments = await dbAdmin
    .collection('tool_deployments')
    .where('toolId', '==', toolId)
    .where('deployedBy', '==', userId)
    .limit(1)
    .get();

  return !deployments.empty;
}

// ============================================================================
// GET — List automations
// ============================================================================

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId } = await params;

  const hasAccess = await verifyToolAccess(toolId, userId);
  if (!hasAccess) {
    return respond.error('Access denied', 'FORBIDDEN', { status: 403 });
  }

  const snapshot = await dbAdmin
    .collection('tool_automations')
    .where('toolId', '==', toolId)
    .where('isActive', '!=', false)
    .orderBy('createdAt', 'desc')
    .get();

  const automations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return respond.success({ automations });
});

// ============================================================================
// POST — Create automation
// ============================================================================

export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId } = await params;

  const hasAccess = await verifyToolAccess(toolId, userId);
  if (!hasAccess) {
    return respond.error('Access denied', 'FORBIDDEN', { status: 403 });
  }

  const body = await request.json();
  const parsed = CreateAutomationSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error(
      parsed.error.issues.map(i => i.message).join(', '),
      'INVALID_INPUT',
      { status: 400 }
    );
  }

  const { name, trigger, conditions, actions, limits } = parsed.data;

  // Cap automations per tool at 20
  const existingCount = await dbAdmin
    .collection('tool_automations')
    .where('toolId', '==', toolId)
    .where('isActive', '!=', false)
    .count()
    .get();

  if (existingCount.data().count >= 20) {
    return respond.error('Maximum 20 automations per tool', 'LIMIT_EXCEEDED', { status: 400 });
  }

  const now = new Date().toISOString();
  const automationData = {
    toolId,
    deploymentId: toolId, // Use toolId as default deploymentId for non-deployed tools
    name,
    enabled: true,
    trigger,
    conditions,
    actions,
    maxRunsPerDay: limits.maxRunsPerDay,
    cooldownSeconds: limits.cooldownSeconds,
    runCount: 0,
    errorCount: 0,
    isActive: true,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await dbAdmin.collection('tool_automations').add(automationData);

  return respond.success({
    automation: { id: docRef.id, ...automationData },
  });
});
