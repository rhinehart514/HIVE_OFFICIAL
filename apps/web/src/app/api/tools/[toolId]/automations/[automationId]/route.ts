/**
 * Single Automation API Route
 *
 * Sprint 4: Automations
 *
 * Endpoints:
 * - GET: Fetch automation details
 * - PATCH: Update automation (enable/disable, modify)
 * - DELETE: Remove automation
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { z } from 'zod';
import type { ToolAutomation, UpdateToolAutomationDTO } from '@hive/core';
import {
  DEFAULT_AUTOMATION_LIMITS,
  MAX_ACTIONS_PER_AUTOMATION,
  MAX_CONDITIONS_PER_AUTOMATION,
  isValidCron,
} from '@hive/core';
import { withCache } from '../../../../../../lib/cache-headers';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const EventTriggerSchema = z.object({
  type: z.literal('event'),
  elementId: z.string().min(1),
  event: z.string().min(1),
});

const ScheduleTriggerSchema = z.object({
  type: z.literal('schedule'),
  cron: z.string().refine(isValidCron, 'Invalid cron expression'),
  timezone: z.string().optional(),
});

const ThresholdTriggerSchema = z.object({
  type: z.literal('threshold'),
  path: z.string().min(1),
  operator: z.enum(['>', '<', '==', '>=', '<=']),
  value: z.number(),
  oncePerCrossing: z.boolean().optional(),
});

const TriggerSchema = z.discriminatedUnion('type', [
  EventTriggerSchema,
  ScheduleTriggerSchema,
  ThresholdTriggerSchema,
]);

const ConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum([
    'equals', 'notEquals', 'greaterThan', 'lessThan',
    'greaterOrEqual', 'lessOrEqual', 'contains', 'notContains',
    'isEmpty', 'isNotEmpty',
  ]),
  value: z.unknown().optional(),
});

const NotifyEmailActionSchema = z.object({
  type: z.literal('notify'),
  channel: z.literal('email'),
  templateId: z.string().min(1),
  to: z.string().min(1),
  roleName: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

const NotifyPushActionSchema = z.object({
  type: z.literal('notify'),
  channel: z.literal('push'),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  to: z.string().min(1),
  roleName: z.string().optional(),
  link: z.string().optional(),
});

const MutateActionSchema = z.object({
  type: z.literal('mutate'),
  elementId: z.string().min(1),
  mutation: z.record(z.unknown()),
});

const TriggerToolActionSchema = z.object({
  type: z.literal('triggerTool'),
  deploymentId: z.string().min(1),
  event: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

const ActionSchema = z.union([
  NotifyEmailActionSchema,
  NotifyPushActionSchema,
  MutateActionSchema,
  TriggerToolActionSchema,
]);

const LimitsSchema = z.object({
  maxRunsPerDay: z.number().min(1).max(1000).optional(),
  cooldownSeconds: z.number().min(0).max(86400).optional(),
});

const UpdateAutomationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  trigger: TriggerSchema.optional(),
  conditions: z.array(ConditionSchema).max(MAX_CONDITIONS_PER_AUTOMATION).optional(),
  actions: z.array(ActionSchema).min(1).max(MAX_ACTIONS_PER_AUTOMATION).optional(),
  limits: LimitsSchema.optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

async function verifyAccess(
  deploymentId: string,
  userId: string,
  requireOfficer = false
): Promise<{ allowed: boolean; error?: string; deployment?: FirebaseFirestore.DocumentSnapshot }> {
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (!deploymentDoc.exists) {
    return { allowed: false, error: 'Tool not found' };
  }

  const deploymentData = deploymentDoc.data();
  const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;

  if (deploymentData?.deployedTo === 'space' && deploymentData?.targetId) {
    const { getSpaceMember } = await import('@/lib/space-members');
    const memberData = await getSpaceMember(deploymentData.targetId, userId);

    if (!memberData && toolOwnerId !== userId) {
      return { allowed: false, error: 'Access denied' };
    }

    if (requireOfficer) {
      const isOfficer = memberData?.role === 'officer' || memberData?.role === 'leader';
      const isOwner = toolOwnerId === userId;

      if (!isOfficer && !isOwner) {
        return { allowed: false, error: 'Only officers can modify automations' };
      }
    }
  }

  return { allowed: true, deployment: deploymentDoc };
}

// ============================================================================
// GET - Fetch Automation
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; automationId: string }> }
) {
  const { toolId: deploymentId, automationId } = await params;
  const userId = getUserId(request);

  try {
    const access = await verifyAccess(deploymentId, userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

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

    const data = automationDoc.data();
    const automation: ToolAutomation = {
      id: automationDoc.id,
      deploymentId,
      name: data?.name,
      description: data?.description,
      enabled: data?.enabled !== false,
      trigger: data?.trigger,
      conditions: data?.conditions || [],
      actions: data?.actions || [],
      limits: {
        ...DEFAULT_AUTOMATION_LIMITS,
        ...data?.limits,
      },
      lastRun: data?.lastRun,
      nextRun: data?.nextRun,
      runCount: data?.runCount || 0,
      errorCount: data?.errorCount || 0,
      createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || data?.createdAt,
      createdBy: data?.createdBy,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString?.() || data?.updatedAt,
    };

    return NextResponse.json({ automation });
  } catch (error) {
    logger.error('[automation] Error fetching automation', {
      deploymentId,
      automationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch automation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Automation
// ============================================================================

async function handlePatch(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; automationId: string }> }
) {
  const { toolId: deploymentId, automationId } = await params;
  const userId = getUserId(request);

  try {
    const access = await verifyAccess(deploymentId, userId, true);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = UpdateAutomationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid automation data',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const dto = parsed.data as UpdateToolAutomationDTO;

    // Get existing automation
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

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.enabled !== undefined) updates.enabled = dto.enabled;
    if (dto.trigger !== undefined) updates.trigger = dto.trigger;
    if (dto.conditions !== undefined) updates.conditions = dto.conditions;
    if (dto.actions !== undefined) updates.actions = dto.actions;

    if (dto.limits !== undefined) {
      const existingData = automationDoc.data();
      updates.limits = {
        ...DEFAULT_AUTOMATION_LIMITS,
        ...existingData?.limits,
        ...dto.limits,
      };
    }

    // Recalculate next run if trigger changed to schedule
    if (dto.trigger?.type === 'schedule') {
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + 1);
      updates.nextRun = nextRun.toISOString();
    }

    // Apply updates
    await automationRef.update(updates);

    // Fetch updated automation
    const updatedDoc = await automationRef.get();
    const data = updatedDoc.data();

    const automation: ToolAutomation = {
      id: updatedDoc.id,
      deploymentId,
      name: data?.name,
      description: data?.description,
      enabled: data?.enabled !== false,
      trigger: data?.trigger,
      conditions: data?.conditions || [],
      actions: data?.actions || [],
      limits: {
        ...DEFAULT_AUTOMATION_LIMITS,
        ...data?.limits,
      },
      lastRun: data?.lastRun,
      nextRun: data?.nextRun,
      runCount: data?.runCount || 0,
      errorCount: data?.errorCount || 0,
      createdAt: data?.createdAt?.toDate?.()?.toISOString?.() || data?.createdAt,
      createdBy: data?.createdBy,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString?.() || data?.updatedAt,
    };

    logger.info('[automation] Updated automation', {
      deploymentId,
      automationId,
      updates: Object.keys(updates),
      userId,
    });

    return NextResponse.json({
      automation,
      message: 'Automation updated successfully',
    });
  } catch (error) {
    logger.error('[automation] Error updating automation', {
      deploymentId,
      automationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove Automation
// ============================================================================

async function handleDelete(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; automationId: string }> }
) {
  const { toolId: deploymentId, automationId } = await params;
  const userId = getUserId(request);

  try {
    const access = await verifyAccess(deploymentId, userId, true);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

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

    // Delete the automation
    await automationRef.delete();

    // Also delete associated runs (batch delete)
    const runsRef = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automationRuns');

    const runsSnapshot = await runsRef
      .where('automationId', '==', automationId)
      .limit(500)
      .get();

    if (!runsSnapshot.empty) {
      const batch = dbAdmin.batch();
      runsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    logger.info('[automation] Deleted automation', {
      deploymentId,
      automationId,
      runsDeleted: runsSnapshot.size,
      userId,
    });

    return NextResponse.json({
      message: 'Automation deleted successfully',
      automationId,
    });
  } catch (error) {
    logger.error('[automation] Error deleting automation', {
      deploymentId,
      automationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const _GET = withAuthAndErrors(handleGet);
export const PATCH = withAuthAndErrors(handlePatch);
export const DELETE = withAuthAndErrors(handleDelete);

export const GET = withCache(_GET, 'SHORT');
