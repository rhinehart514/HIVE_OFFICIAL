/**
 * Automation Test API Route
 *
 * Sprint 4: Automations
 *
 * Test endpoint that evaluates conditions with current state
 * and returns what actions would execute WITHOUT actually executing them.
 *
 * Endpoints:
 * - POST: Test automation with current or provided state
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
import type { ToolAutomation, ToolSharedState } from '@hive/core';
import { evaluateAllConditions, canRunAutomation, DEFAULT_AUTOMATION_LIMITS } from '@hive/core';

// ============================================================================
// TYPES
// ============================================================================

interface ConditionTestResult {
  field: string;
  operator: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

interface ActionPreview {
  type: string;
  summary: string;
  target?: string;
  wouldExecute: boolean;
}

interface TestResult {
  automationId: string;
  automationName: string;
  enabled: boolean;
  canRun: boolean;
  canRunReason?: string;
  triggerType: string;
  conditionsEvaluated: boolean;
  allConditionsMet: boolean;
  conditionResults: ConditionTestResult[];
  actionsPreview: ActionPreview[];
  stateSnapshot: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const TestRequestSchema = z.object({
  // Optional: provide custom state for testing
  mockState: z.record(z.unknown()).optional(),
  // Optional: simulate a specific trigger event
  simulateTrigger: z.object({
    type: z.enum(['event', 'schedule', 'threshold']),
    data: z.record(z.unknown()).optional(),
  }).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

async function verifyAccess(
  deploymentId: string,
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
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

    if (!memberDoc.exists && toolOwnerId !== userId) {
      return { allowed: false, error: 'Access denied' };
    }
  }

  return { allowed: true };
}

async function getToolState(deploymentId: string): Promise<ToolSharedState | null> {
  const stateRef = dbAdmin
    .collection('deployedTools')
    .doc(deploymentId)
    .collection('sharedState')
    .doc('current');

  const doc = await stateRef.get();
  if (!doc.exists) return null;

  const data = doc.data();
  return {
    counters: data?.counters || {},
    collections: data?.collections || {},
    timeline: data?.timeline || [],
    computed: data?.computed || {},
    version: data?.version || 0,
    lastModified: data?.lastModified || new Date().toISOString(),
  };
}

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

function getValueFromPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function generateActionSummary(action: ToolAutomation['actions'][0]): ActionPreview {
  switch (action.type) {
    case 'notify':
      if (action.channel === 'email') {
        return {
          type: 'notify:email',
          summary: `Send email using template "${action.templateId}" to ${action.roleName || action.to}`,
          target: action.to,
          wouldExecute: true,
        };
      } else if (action.channel === 'push') {
        return {
          type: 'notify:push',
          summary: `Send push notification "${action.title}" to ${action.roleName || action.to}`,
          target: action.to,
          wouldExecute: true,
        };
      }
      return {
        type: 'notify',
        summary: 'Unknown notification type',
        wouldExecute: false,
      };

    case 'mutate':
      return {
        type: 'mutate',
        summary: `Mutate element "${action.elementId}" with ${Object.keys(action.mutation).length} field(s)`,
        target: action.elementId,
        wouldExecute: true,
      };

    case 'triggerTool':
      return {
        type: 'triggerTool',
        summary: `Trigger tool "${action.deploymentId}" with event "${action.event}"`,
        target: action.deploymentId,
        wouldExecute: true,
      };

    default:
      return {
        type: 'unknown',
        summary: 'Unknown action type',
        wouldExecute: false,
      };
  }
}

// ============================================================================
// POST - Test Automation
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

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const parsed = TestRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { mockState } = parsed.data;

    // Fetch automation
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
      createdAt: data?.createdAt,
      createdBy: data?.createdBy,
    };

    // Get state (mock or real)
    const realState = await getToolState(deploymentId);
    const testState = mockState || (realState ? {
      counters: realState.counters,
      collections: realState.collections,
      timeline: realState.timeline,
      computed: realState.computed,
    } : {});

    // Check rate limits
    const runsToday = await getRunsToday(deploymentId, automationId);
    const canRunResult = canRunAutomation(automation, runsToday);

    // Evaluate conditions
    let allConditionsMet = true;
    const conditionResults: ConditionTestResult[] = [];

    if (automation.conditions && automation.conditions.length > 0) {
      const conditionContext = {
        state: testState,
        trigger: { type: automation.trigger.type },
      };

      const evaluation = evaluateAllConditions(
        automation.conditions,
        conditionContext as Record<string, unknown>
      );

      allConditionsMet = evaluation.allMet;

      // Build detailed results for each condition
      // evaluation.results is a boolean[] that matches the order of conditions
      for (let i = 0; i < automation.conditions.length; i++) {
        const condition = automation.conditions[i];
        const actualValue = getValueFromPath(testState, condition.field);
        const conditionPassed = evaluation.results[i] ?? false;

        conditionResults.push({
          field: condition.field,
          operator: condition.operator,
          expected: condition.value,
          actual: actualValue,
          passed: conditionPassed,
        });
      }
    }

    // Generate action previews
    const actionsPreview: ActionPreview[] = automation.actions.map(action => {
      const preview = generateActionSummary(action);
      // Only mark as would execute if all conditions met and can run
      preview.wouldExecute = preview.wouldExecute && allConditionsMet && canRunResult.canRun;
      return preview;
    });

    // Build test result
    const testResult: TestResult = {
      automationId: automation.id,
      automationName: automation.name,
      enabled: automation.enabled,
      canRun: canRunResult.canRun,
      canRunReason: canRunResult.reason,
      triggerType: automation.trigger.type,
      conditionsEvaluated: (automation.conditions?.length ?? 0) > 0,
      allConditionsMet,
      conditionResults,
      actionsPreview,
      stateSnapshot: testState,
      timestamp: new Date().toISOString(),
    };

    logger.info('[automation-test] Automation test completed', {
      deploymentId,
      automationId,
      canRun: canRunResult.canRun,
      allConditionsMet,
      actionsCount: actionsPreview.length,
      userId,
    });

    return NextResponse.json({
      result: testResult,
      message: allConditionsMet && canRunResult.canRun
        ? 'Automation would execute successfully'
        : 'Automation would NOT execute',
    });
  } catch (error) {
    logger.error('[automation-test] Error testing automation', {
      deploymentId,
      automationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to test automation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const POST = withAuthAndErrors(handlePost);
