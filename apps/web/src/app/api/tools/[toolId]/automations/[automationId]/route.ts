/**
 * Single Automation API
 *
 * GET    /api/tools/[toolId]/automations/[automationId] — Get automation details
 * PATCH  /api/tools/[toolId]/automations/[automationId] — Update automation
 * DELETE /api/tools/[toolId]/automations/[automationId] — Soft-delete automation
 */

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

// ============================================================================
// Schema
// ============================================================================

const UpdateAutomationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  trigger: z.object({
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
  }).optional(),
  conditions: z.array(z.object({
    path: z.string(),
    operator: z.string(),
    value: z.unknown(),
  })).optional(),
  actions: z.array(z.object({
    type: z.enum(['notify', 'mutate', 'triggerTool']),
    title: z.string().optional(),
    body: z.string().optional(),
    recipients: z.union([z.string(), z.array(z.string())]).optional(),
    elementId: z.string().optional(),
    mutation: z.record(z.unknown()).optional(),
    deploymentId: z.string().optional(),
    eventName: z.string().optional(),
  })).optional(),
  limits: z.object({
    maxRunsPerDay: z.number().min(1).max(1000).optional(),
    cooldownSeconds: z.number().min(0).max(86400).optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, 'At least one field required');

// ============================================================================
// Helpers
// ============================================================================

async function getAutomationWithAccess(
  toolId: string,
  automationId: string,
  userId: string
): Promise<{ doc: FirebaseFirestore.DocumentSnapshot; error?: string }> {
  const doc = await dbAdmin.collection('tool_automations').doc(automationId).get();

  if (!doc.exists || doc.data()?.isActive === false) {
    return { doc, error: 'Automation not found' };
  }

  if (doc.data()?.toolId !== toolId) {
    return { doc, error: 'Automation not found' };
  }

  // Verify user has access to the tool
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return { doc, error: 'Tool not found' };
  }

  const tool = toolDoc.data();
  const isOwner = tool?.ownerId === userId || tool?.createdBy === userId;
  if (!isOwner) {
    return { doc, error: 'Access denied' };
  }

  return { doc };
}

// ============================================================================
// GET — Get automation details
// ============================================================================

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string; automationId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId, automationId } = await params;

  const { doc, error } = await getAutomationWithAccess(toolId, automationId, userId);
  if (error) {
    const status = error === 'Access denied' ? 403 : 404;
    return respond.error(error, status === 403 ? 'FORBIDDEN' : 'RESOURCE_NOT_FOUND', { status });
  }

  return respond.success({
    automation: { id: doc.id, ...doc.data() },
  });
});

// ============================================================================
// PATCH — Update automation
// ============================================================================

export const PATCH = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string; automationId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId, automationId } = await params;

  const { doc, error } = await getAutomationWithAccess(toolId, automationId, userId);
  if (error) {
    const status = error === 'Access denied' ? 403 : 404;
    return respond.error(error, status === 403 ? 'FORBIDDEN' : 'RESOURCE_NOT_FOUND', { status });
  }

  const body = await request.json();
  const parsed = UpdateAutomationSchema.safeParse(body);
  if (!parsed.success) {
    return respond.error(
      parsed.error.issues.map(i => i.message).join(', '),
      'INVALID_INPUT',
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  const data = parsed.data;
  if (data.name !== undefined) updates.name = data.name;
  if (data.enabled !== undefined) updates.enabled = data.enabled;
  if (data.trigger) updates.trigger = data.trigger;
  if (data.conditions) updates.conditions = data.conditions;
  if (data.actions) updates.actions = data.actions;
  if (data.limits) {
    if (data.limits.maxRunsPerDay !== undefined) updates.maxRunsPerDay = data.limits.maxRunsPerDay;
    if (data.limits.cooldownSeconds !== undefined) updates.cooldownSeconds = data.limits.cooldownSeconds;
  }

  await doc.ref.update(updates);

  const updated = await doc.ref.get();
  return respond.success({
    automation: { id: updated.id, ...updated.data() },
  });
});

// ============================================================================
// DELETE — Soft-delete automation
// ============================================================================

export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string; automationId: string }> },
  respond
) => {
  const req = request as AuthenticatedRequest;
  const userId = getUserId(req);
  const { toolId, automationId } = await params;

  const { doc, error } = await getAutomationWithAccess(toolId, automationId, userId);
  if (error) {
    const status = error === 'Access denied' ? 403 : 404;
    return respond.error(error, status === 403 ? 'FORBIDDEN' : 'RESOURCE_NOT_FOUND', { status });
  }

  await doc.ref.update({
    isActive: false,
    enabled: false,
    deletedAt: new Date().toISOString(),
    deletedBy: userId,
  });

  return respond.success({ success: true });
});
