/**
 * HiveLab Tool Automation Types
 *
 * Sprint 4: Automations
 *
 * Enables tools to run themselves via events, schedules, and conditions.
 * Exit Criteria: Automated dues reminder sends email 7 days before deadline.
 *
 * Distinct from space automations (member_join, event_reminder), these are
 * tool-level automations that react to tool state changes.
 *
 * Trigger Types:
 * - event: Element state change (e.g., "submission_created")
 * - schedule: Cron-based (e.g., "every day at 9am")
 * - threshold: State value crosses a limit (e.g., counter > 100)
 *
 * Action Types:
 * - notify: Send email notification
 * - mutate: Update element state
 * - triggerTool: Trigger another tool's action
 */

// ============================================================================
// TRIGGER TYPES
// ============================================================================

/**
 * Event trigger - fires when an element emits an event
 */
export interface ToolEventTrigger {
  type: 'event';
  /** Element instance ID that emits the event */
  elementId: string;
  /** Event name to listen for (e.g., "submission_created", "counter_updated") */
  event: string;
}

/**
 * Schedule trigger - fires on a cron schedule
 */
export interface ToolScheduleTrigger {
  type: 'schedule';
  /** Cron expression (standard 5-field: minute hour day month weekday) */
  cron: string;
  /** Timezone for the schedule (default: America/New_York) */
  timezone?: string;
}

/**
 * Threshold trigger - fires when a value crosses a threshold
 */
export interface ToolThresholdTrigger {
  type: 'threshold';
  /** Path to the value in shared state (e.g., "counters.submissions") */
  path: string;
  /** Comparison operator */
  operator: '>' | '<' | '==' | '>=' | '<=';
  /** Threshold value to compare against */
  value: number;
  /** Only fire once per crossing (reset when value crosses back) */
  oncePerCrossing?: boolean;
}

export type ToolAutomationTrigger =
  | ToolEventTrigger
  | ToolScheduleTrigger
  | ToolThresholdTrigger;

// ============================================================================
// CONDITION TYPES
// ============================================================================

/**
 * Condition operator for automation conditions
 */
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

/**
 * Single condition that must be met for automation to execute
 */
export interface ToolAutomationCondition {
  /** Path to the field in shared state or context */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Value to compare against (not needed for isEmpty/isNotEmpty) */
  value?: unknown;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Email notification action
 */
export interface NotifyEmailAction {
  type: 'notify';
  channel: 'email';
  /** Email template ID */
  templateId: string;
  /** Recipients */
  to: 'user' | 'role' | 'all' | string;
  /** Role name if to='role' */
  roleName?: string;
  /** Custom subject line (supports {{variables}}) */
  subject?: string;
  /** Custom body (supports {{variables}}) */
  body?: string;
}

/**
 * Push notification action
 */
export interface NotifyPushAction {
  type: 'notify';
  channel: 'push';
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Recipients */
  to: 'user' | 'role' | 'all' | string;
  /** Role name if to='role' */
  roleName?: string;
  /** Link to navigate to on click */
  link?: string;
}

/**
 * Mutate element state action
 */
export interface MutateAction {
  type: 'mutate';
  /** Target element instance ID */
  elementId: string;
  /** State mutation to apply */
  mutation: Record<string, unknown>;
}

/**
 * Trigger another tool's action
 */
export interface TriggerToolAction {
  type: 'triggerTool';
  /** Target tool deployment ID */
  deploymentId: string;
  /** Event name to trigger */
  event: string;
  /** Data to pass to the triggered tool */
  data?: Record<string, unknown>;
}

export type ToolAutomationAction =
  | NotifyEmailAction
  | NotifyPushAction
  | MutateAction
  | TriggerToolAction;

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limits for automation execution
 */
export interface ToolAutomationLimits {
  /** Maximum runs per day (default: 100) */
  maxRunsPerDay: number;
  /** Cooldown between runs in seconds (default: 60) */
  cooldownSeconds: number;
}

/**
 * Default rate limits
 */
export const DEFAULT_AUTOMATION_LIMITS: ToolAutomationLimits = {
  maxRunsPerDay: 100,
  cooldownSeconds: 60,
};

// ============================================================================
// MAIN AUTOMATION TYPE
// ============================================================================

/**
 * Tool automation configuration
 *
 * Stored at: deployedTools/{deploymentId}/automations/{automationId}
 */
export interface ToolAutomation {
  /** Unique automation ID */
  id: string;

  /** Deployment ID this automation belongs to */
  deploymentId: string;

  /** Human-readable name */
  name: string;

  /** Optional description */
  description?: string;

  /** Whether the automation is active */
  enabled: boolean;

  /** What triggers the automation */
  trigger: ToolAutomationTrigger;

  /** Optional conditions that must all be true */
  conditions?: ToolAutomationCondition[];

  /** Actions to execute (in order) */
  actions: ToolAutomationAction[];

  /** Rate limits */
  limits: ToolAutomationLimits;

  /** Last run timestamp (ISO string) */
  lastRun?: string;

  /** Next scheduled run (for schedule triggers) */
  nextRun?: string;

  /** Total run count */
  runCount: number;

  /** Error count */
  errorCount: number;

  /** Creation timestamp (ISO string) */
  createdAt: string;

  /** Creator user ID */
  createdBy: string;

  /** Last update timestamp (ISO string) */
  updatedAt?: string;
}

/**
 * DTO for creating a new automation
 */
export interface CreateToolAutomationDTO {
  name: string;
  description?: string;
  trigger: ToolAutomationTrigger;
  conditions?: ToolAutomationCondition[];
  actions: ToolAutomationAction[];
  limits?: Partial<ToolAutomationLimits>;
}

/**
 * DTO for updating an existing automation
 */
export interface UpdateToolAutomationDTO {
  name?: string;
  description?: string;
  enabled?: boolean;
  trigger?: ToolAutomationTrigger;
  conditions?: ToolAutomationCondition[];
  actions?: ToolAutomationAction[];
  limits?: Partial<ToolAutomationLimits>;
}

// ============================================================================
// AUTOMATION RUN (EXECUTION LOG)
// ============================================================================

/**
 * Status of an automation run
 */
export type ToolAutomationRunStatus = 'success' | 'skipped' | 'failed';

/**
 * Record of an automation execution
 *
 * Stored at: deployedTools/{deploymentId}/automationRuns/{runId}
 * (Keep last 100 only)
 */
export interface ToolAutomationRun {
  /** Unique run ID */
  id: string;

  /** Automation ID that was executed */
  automationId: string;

  /** Deployment ID */
  deploymentId: string;

  /** Execution timestamp (ISO string) */
  timestamp: string;

  /** Run status */
  status: ToolAutomationRunStatus;

  /** What triggered this run */
  triggerType: 'event' | 'schedule' | 'threshold';

  /** Trigger data (event name, threshold value, etc.) */
  triggerData?: Record<string, unknown>;

  /** Results of condition evaluation */
  conditionResults?: boolean[];

  /** Which actions were executed */
  actionsExecuted: string[];

  /** Error message if status is 'failed' */
  error?: string;

  /** Execution duration in milliseconds */
  duration: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum automations per tool */
export const MAX_AUTOMATIONS_PER_TOOL = 10;

/** Maximum actions per automation */
export const MAX_ACTIONS_PER_AUTOMATION = 5;

/** Maximum conditions per automation */
export const MAX_CONDITIONS_PER_AUTOMATION = 5;

/** Maximum runs to keep in history */
export const MAX_AUTOMATION_RUNS_HISTORY = 100;

/** Firestore subcollection name */
export const AUTOMATIONS_COLLECTION = 'automations';
export const AUTOMATION_RUNS_COLLECTION = 'automationRuns';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a cron expression (basic validation)
 */
export function isValidCron(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  // Basic validation: each part should be a number, *, or cron expression
  const cronPattern = /^(\*|(\d+(-\d+)?(,\d+(-\d+)?)*)(\/\d+)?)$/;
  return parts.every(part => cronPattern.test(part));
}

/**
 * Parse a cron expression to get next run time
 * (Simplified - real implementation would use a library like cron-parser)
 */
export function getNextRunTime(cron: string, timezone?: string): Date {
  // Placeholder - in real implementation, use cron-parser library
  // For now, return 1 hour from now
  const next = new Date();
  next.setHours(next.getHours() + 1);
  return next;
}

/**
 * Evaluate a condition against a context
 */
export function evaluateCondition(
  condition: ToolAutomationCondition,
  context: Record<string, unknown>
): boolean {
  const value = getValueAtPath(context, condition.field);

  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'notEquals':
      return value !== condition.value;
    case 'greaterThan':
      return typeof value === 'number' && value > (condition.value as number);
    case 'lessThan':
      return typeof value === 'number' && value < (condition.value as number);
    case 'greaterOrEqual':
      return typeof value === 'number' && value >= (condition.value as number);
    case 'lessOrEqual':
      return typeof value === 'number' && value <= (condition.value as number);
    case 'contains':
      if (Array.isArray(value)) {
        return value.includes(condition.value);
      }
      if (typeof value === 'string') {
        return value.includes(String(condition.value));
      }
      return false;
    case 'notContains':
      if (Array.isArray(value)) {
        return !value.includes(condition.value);
      }
      if (typeof value === 'string') {
        return !value.includes(String(condition.value));
      }
      return true;
    case 'isEmpty':
      if (value === null || value === undefined) return true;
      if (Array.isArray(value)) return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      if (typeof value === 'string') return value.length === 0;
      return false;
    case 'isNotEmpty':
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object') return Object.keys(value).length > 0;
      if (typeof value === 'string') return value.length > 0;
      return true;
    default:
      return false;
  }
}

/**
 * Evaluate all conditions (must all be true)
 */
export function evaluateAllConditions(
  conditions: ToolAutomationCondition[],
  context: Record<string, unknown>
): { allMet: boolean; results: boolean[] } {
  const results = conditions.map(c => evaluateCondition(c, context));
  return {
    allMet: results.every(r => r),
    results,
  };
}

/**
 * Get value at a dot-notation path
 */
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

/**
 * Check if automation can run based on rate limits
 */
export function canRunAutomation(
  automation: ToolAutomation,
  runsToday: number
): { canRun: boolean; reason?: string } {
  // Check max runs per day
  if (runsToday >= automation.limits.maxRunsPerDay) {
    return {
      canRun: false,
      reason: `Rate limit exceeded: ${runsToday}/${automation.limits.maxRunsPerDay} runs today`,
    };
  }

  // Check cooldown
  if (automation.lastRun) {
    const lastRunTime = new Date(automation.lastRun).getTime();
    const cooldownMs = automation.limits.cooldownSeconds * 1000;
    const now = Date.now();

    if (now - lastRunTime < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - (now - lastRunTime)) / 1000);
      return {
        canRun: false,
        reason: `Cooldown: ${remainingSeconds}s remaining`,
      };
    }
  }

  return { canRun: true };
}
