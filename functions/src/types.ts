/**
 * HIVE Cloud Functions Types
 *
 * Local type definitions for Cloud Functions.
 * These mirror the types from @hive/core but are self-contained
 * for Firebase Functions deployment.
 */

// ============================================================================
// TOOL SHARED STATE
// ============================================================================

export interface ToolSharedState {
  counters: Record<string, number>;
  collections: Record<string, Record<string, unknown>>;
  timeline: TimelineEntry[];
  computed: Record<string, unknown>;
  version: number;
  lastModified: string;
}

export interface TimelineEntry {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export type AutomationTriggerType = 'event' | 'schedule' | 'threshold';

export interface EventTrigger {
  type: 'event';
  elementId: string;
  event: string;
}

export interface ScheduleTrigger {
  type: 'schedule';
  cron: string;
  timezone?: string;
}

export interface ThresholdTrigger {
  type: 'threshold';
  path: string;
  operator: '>' | '<' | '==' | '>=' | '<=';
  value: number;
  oncePerCrossing?: boolean;
}

export type ToolAutomationTrigger = EventTrigger | ScheduleTrigger | ThresholdTrigger;

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty';

export interface ToolAutomationCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface NotifyEmailAction {
  type: 'notify';
  channel: 'email';
  templateId: string;
  to: string;
  roleName?: string;
  subject?: string;
  body?: string;
}

export interface NotifyPushAction {
  type: 'notify';
  channel: 'push';
  title: string;
  body: string;
  to: string;
  roleName?: string;
  link?: string;
}

export interface MutateAction {
  type: 'mutate';
  elementId: string;
  mutation: Record<string, unknown>;
}

export interface TriggerToolAction {
  type: 'triggerTool';
  deploymentId: string;
  event: string;
  data?: Record<string, unknown>;
}

export type ToolAutomationAction =
  | NotifyEmailAction
  | NotifyPushAction
  | MutateAction
  | TriggerToolAction;

export interface ToolAutomationLimits {
  maxRunsPerDay: number;
  cooldownSeconds: number;
}

export interface ToolAutomation {
  id: string;
  deploymentId: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: ToolAutomationTrigger;
  conditions: ToolAutomationCondition[];
  actions: ToolAutomationAction[];
  limits: ToolAutomationLimits;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  errorCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface ToolAutomationRun {
  id: string;
  automationId: string;
  deploymentId: string;
  timestamp: string;
  status: 'success' | 'skipped' | 'failed';
  triggerType: AutomationTriggerType;
  triggerData?: Record<string, unknown>;
  conditionResults?: Array<{
    field: string;
    operator: string;
    expected: unknown;
    actual: unknown;
    met: boolean;
  }>;
  actionsExecuted: string[];
  error?: string;
  duration: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_AUTOMATION_LIMITS: ToolAutomationLimits = {
  maxRunsPerDay: 100,
  cooldownSeconds: 60,
};

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function evaluateCondition(
  condition: ToolAutomationCondition,
  context: Record<string, unknown>
): { met: boolean; actual: unknown } {
  const actual = getValueAtPath(context, condition.field);
  const expected = condition.value;

  let met = false;

  switch (condition.operator) {
    case 'equals':
      met = actual === expected;
      break;
    case 'notEquals':
      met = actual !== expected;
      break;
    case 'greaterThan':
      met = typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      break;
    case 'lessThan':
      met = typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      break;
    case 'greaterOrEqual':
      met = typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      break;
    case 'lessOrEqual':
      met = typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      break;
    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        met = actual.includes(expected);
      } else if (Array.isArray(actual)) {
        met = actual.includes(expected);
      }
      break;
    case 'notContains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        met = !actual.includes(expected);
      } else if (Array.isArray(actual)) {
        met = !actual.includes(expected);
      }
      break;
    case 'isEmpty':
      if (actual === null || actual === undefined) {
        met = true;
      } else if (typeof actual === 'string') {
        met = actual.length === 0;
      } else if (Array.isArray(actual)) {
        met = actual.length === 0;
      } else if (typeof actual === 'object') {
        met = Object.keys(actual).length === 0;
      }
      break;
    case 'isNotEmpty':
      if (actual === null || actual === undefined) {
        met = false;
      } else if (typeof actual === 'string') {
        met = actual.length > 0;
      } else if (Array.isArray(actual)) {
        met = actual.length > 0;
      } else if (typeof actual === 'object') {
        met = Object.keys(actual).length > 0;
      }
      break;
  }

  return { met, actual };
}

export function evaluateAllConditions(
  conditions: ToolAutomationCondition[],
  context: Record<string, unknown>
): { allMet: boolean; results: Array<{ field: string; operator: string; expected: unknown; actual: unknown; met: boolean }> } {
  const results = conditions.map((condition) => {
    const { met, actual } = evaluateCondition(condition, context);
    return {
      field: condition.field,
      operator: condition.operator,
      expected: condition.value,
      actual,
      met,
    };
  });

  return {
    allMet: results.every((r) => r.met),
    results,
  };
}

export function canRunAutomation(
  automation: ToolAutomation,
  runsToday: number
): { canRun: boolean; reason?: string } {
  if (!automation.enabled) {
    return { canRun: false, reason: 'Automation is disabled' };
  }

  if (runsToday >= automation.limits.maxRunsPerDay) {
    return { canRun: false, reason: `Daily limit reached (${automation.limits.maxRunsPerDay})` };
  }

  if (automation.lastRun && automation.limits.cooldownSeconds > 0) {
    const lastRunTime = new Date(automation.lastRun).getTime();
    const cooldownEnd = lastRunTime + automation.limits.cooldownSeconds * 1000;
    if (Date.now() < cooldownEnd) {
      return { canRun: false, reason: 'Cooldown period active' };
    }
  }

  return { canRun: true };
}
