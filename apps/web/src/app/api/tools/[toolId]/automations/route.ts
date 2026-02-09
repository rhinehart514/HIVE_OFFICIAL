/**
 * Tool Automations API Route
 *
 * Sprint 4: Automations
 *
 * Endpoints:
 * - GET: List all automations for a tool deployment
 * - POST: Create a new automation
 *
 * Firestore Path: deployedTools/{deploymentId}/automations/{automationId}
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
import type {
  ToolAutomation,
  CreateToolAutomationDTO,
  ToolAutomationTrigger,
  ToolAutomationAction,
  ToolAutomationCondition,
} from '@hive/core';
import {
  DEFAULT_AUTOMATION_LIMITS,
  MAX_AUTOMATIONS_PER_TOOL,
  MAX_ACTIONS_PER_AUTOMATION,
  MAX_CONDITIONS_PER_AUTOMATION,
  isValidCron,
} from '@hive/core';

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

const CreateAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: TriggerSchema,
  conditions: z.array(ConditionSchema).max(MAX_CONDITIONS_PER_AUTOMATION).optional(),
  actions: z.array(ActionSchema).min(1).max(MAX_ACTIONS_PER_AUTOMATION),
  limits: LimitsSchema.optional(),
});

// ============================================================================
// GET - List Automations
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId: deploymentId } = await params;
  const userId = getUserId(request);

  try {
    // Verify user has access to the tool
    const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
    const deploymentDoc = await deploymentRef.get();

    if (!deploymentDoc.exists) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const deploymentData = deploymentDoc.data();
    const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;

    // For space deployments, check space membership
    if (deploymentData?.deployedTo === 'space' && deploymentData?.targetId) {
      const memberRef = dbAdmin
        .collection('spaces')
        .doc(deploymentData.targetId)
        .collection('members')
        .doc(userId);
      const memberDoc = await memberRef.get();

      if (!memberDoc.exists && toolOwnerId !== userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Fetch automations
    const automationsRef = deploymentRef.collection('automations');
    const snapshot = await automationsRef.orderBy('createdAt', 'desc').get();

    const automations: ToolAutomation[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        deploymentId,
        name: data.name,
        description: data.description,
        enabled: data.enabled !== false,
        trigger: data.trigger,
        conditions: data.conditions || [],
        actions: data.actions || [],
        limits: {
          ...DEFAULT_AUTOMATION_LIMITS,
          ...data.limits,
        },
        lastRun: data.lastRun,
        nextRun: data.nextRun,
        runCount: data.runCount || 0,
        errorCount: data.errorCount || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
      };
    });

    return NextResponse.json({
      automations,
      count: automations.length,
      limit: MAX_AUTOMATIONS_PER_TOOL,
    });
  } catch (error) {
    logger.error('[automations] Error fetching automations', {
      deploymentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Automation
// ============================================================================

async function handlePost(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId: deploymentId } = await params;
  const userId = getUserId(request);

  try {
    // Parse and validate body
    const body = await request.json();
    const parsed = CreateAutomationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid automation data',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const dto = parsed.data as CreateToolAutomationDTO;

    // Verify user has access to the tool
    const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
    const deploymentDoc = await deploymentRef.get();

    if (!deploymentDoc.exists) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const deploymentData = deploymentDoc.data();
    const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;

    // For space deployments, check if user is an officer
    if (deploymentData?.deployedTo === 'space' && deploymentData?.targetId) {
      const memberRef = dbAdmin
        .collection('spaces')
        .doc(deploymentData.targetId)
        .collection('members')
        .doc(userId);
      const memberDoc = await memberRef.get();
      const memberData = memberDoc.data();

      const isOfficer = memberData?.role === 'officer' || memberData?.role === 'leader';
      const isOwner = toolOwnerId === userId;

      if (!memberDoc.exists || (!isOfficer && !isOwner)) {
        return NextResponse.json(
          { error: 'Only officers can create automations' },
          { status: 403 }
        );
      }
    }

    // Check automation limit
    const automationsRef = deploymentRef.collection('automations');
    const countSnapshot = await automationsRef.count().get();
    const currentCount = countSnapshot.data().count;

    if (currentCount >= MAX_AUTOMATIONS_PER_TOOL) {
      return NextResponse.json(
        {
          error: `Maximum automations reached (${MAX_AUTOMATIONS_PER_TOOL})`,
          code: 'LIMIT_REACHED',
        },
        { status: 400 }
      );
    }

    // Generate ID and create automation
    const automationId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const automation: ToolAutomation = {
      id: automationId,
      deploymentId,
      name: dto.name,
      description: dto.description,
      enabled: true,
      trigger: dto.trigger as ToolAutomationTrigger,
      conditions: (dto.conditions || []) as ToolAutomationCondition[],
      actions: dto.actions as ToolAutomationAction[],
      limits: {
        ...DEFAULT_AUTOMATION_LIMITS,
        ...dto.limits,
      },
      runCount: 0,
      errorCount: 0,
      createdAt: now,
      createdBy: userId,
    };

    // Calculate next run for scheduled automations
    if (automation.trigger.type === 'schedule') {
      const cron = automation.trigger.cron;
      const cronParts = cron.trim().split(/\s+/);

      if (cronParts.length === 5) {
        const [minuteSpec, hourSpec, daySpec, monthSpec, weekdaySpec] = cronParts;

        const matchesField = (spec: string, value: number): boolean => {
          if (spec === '*') return true;
          if (spec.startsWith('*/')) {
            const step = parseInt(spec.slice(2), 10);
            return step > 0 && value % step === 0;
          }
          return spec.split(',').some(v => parseInt(v, 10) === value);
        };

        const candidate = new Date();
        candidate.setMinutes(candidate.getMinutes() + 1, 0, 0);
        const maxMinutes = 48 * 60;
        let found = false;

        for (let i = 0; i < maxMinutes; i++) {
          if (
            matchesField(minuteSpec, candidate.getMinutes()) &&
            matchesField(hourSpec, candidate.getHours()) &&
            matchesField(daySpec, candidate.getDate()) &&
            matchesField(monthSpec, candidate.getMonth() + 1) &&
            matchesField(weekdaySpec, candidate.getDay())
          ) {
            automation.nextRun = candidate.toISOString();
            found = true;
            break;
          }
          candidate.setMinutes(candidate.getMinutes() + 1);
        }

        if (!found) {
          const fallback = new Date();
          fallback.setHours(fallback.getHours() + 24);
          automation.nextRun = fallback.toISOString();
        }
      } else {
        const fallback = new Date();
        fallback.setHours(fallback.getHours() + 1);
        automation.nextRun = fallback.toISOString();
      }
    }

    // Save to Firestore
    await automationsRef.doc(automationId).set(automation);

    logger.info('[automations] Created automation', {
      deploymentId,
      automationId,
      name: automation.name,
      triggerType: automation.trigger.type,
      userId,
    });

    return NextResponse.json(
      {
        automation,
        message: 'Automation created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('[automations] Error creating automation', {
      deploymentId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GET = withAuthAndErrors(handleGet);
export const POST = withAuthAndErrors(handlePost);
