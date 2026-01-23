/**
 * Orchestration Executor Service
 *
 * Runtime engine for evaluating Setup orchestration triggers and executing actions.
 * Handles:
 * - Trigger evaluation (tool_event, time_relative, data_condition, manual)
 * - Action execution (data_flow, visibility, config, notification, state)
 * - State machine for orchestration phases
 * - Cascading action handling
 */

import type {
  OrchestrationRule,
  OrchestrationTriggerConfig,
  ToolEventTriggerConfig,
  TimeRelativeTriggerConfig,
  DataConditionTriggerConfig,
  ManualTriggerConfig,
  OrchestrationActionConfig,
  DataFlowActionConfig,
  VisibilityActionConfig,
  ConfigActionConfig,
  NotificationActionConfig,
  StateActionConfig,
} from './setup-template';
import type { SetupDeployment, DeployedSetupTool, OrchestrationLogEntry } from './setup-deployment';
import { Result } from '../../shared/base/Result';

// ============================================================================
// Types
// ============================================================================

/**
 * Context for executing orchestration actions
 */
export interface ExecutionContext {
  deployment: SetupDeployment;
  triggeredBy: string;
  triggerPayload?: Record<string, unknown>;
}

/**
 * Result of a single action execution within orchestration
 * Note: Named OrchestrationActionResult to distinguish from automation-runner's ActionExecutionResult
 */
export interface OrchestrationActionResult {
  actionType: string;
  targetSlotId?: string;
  success: boolean;
  error?: string;
  updates?: Record<string, unknown>;
}

/**
 * Result of executing a rule
 */
export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  success: boolean;
  actionsExecuted: OrchestrationActionResult[];
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Result of evaluating and executing all matching rules
 */
export interface OrchestrationExecutionResult {
  executedRules: RuleExecutionResult[];
  totalRulesEvaluated: number;
  totalActionsExecuted: number;
  overallSuccess: boolean;
  logEntries: OrchestrationLogEntry[];
}

/**
 * Callback for persisting changes during action execution
 */
export interface ExecutorCallbacks {
  /** Update tool visibility in placed_tools collection */
  updateToolVisibility?: (spaceId: string, deploymentId: string, visible: boolean) => Promise<void>;
  /** Update tool config in placed_tools collection */
  updateToolConfig?: (spaceId: string, deploymentId: string, config: Record<string, unknown>) => Promise<void>;
  /** Send notification */
  sendNotification?: (recipients: string, title: string, body: string, actionUrl?: string) => Promise<void>;
}

// ============================================================================
// Trigger Evaluators
// ============================================================================

/**
 * Evaluate if a tool_event trigger matches
 */
function evaluateToolEventTrigger(
  trigger: ToolEventTriggerConfig,
  eventSlotId: string,
  eventType: string,
): boolean {
  return trigger.sourceSlotId === eventSlotId && trigger.eventType === eventType;
}

/**
 * Evaluate if a time_relative trigger should fire
 */
function evaluateTimeRelativeTrigger(
  trigger: TimeRelativeTriggerConfig,
  sharedData: Record<string, unknown>,
): boolean {
  const referenceValue = getNestedValue(sharedData, trigger.referenceField);

  if (!referenceValue) return false;

  const referenceTime = new Date(referenceValue as string);
  if (isNaN(referenceTime.getTime())) return false;

  const triggerTime = new Date(referenceTime.getTime() + trigger.offsetMinutes * 60 * 1000);
  const now = new Date();

  // Trigger if current time is within 1 minute of trigger time
  const diff = Math.abs(now.getTime() - triggerTime.getTime());
  return diff < 60 * 1000;
}

/**
 * Evaluate if a data_condition trigger matches
 */
function evaluateDataConditionTrigger(
  trigger: DataConditionTriggerConfig,
  sharedData: Record<string, unknown>,
): boolean {
  const actualValue = getNestedValue(sharedData, trigger.dataPath);

  switch (trigger.operator) {
    case 'eq':
      return actualValue === trigger.value;
    case 'neq':
      return actualValue !== trigger.value;
    case 'gt':
      return typeof actualValue === 'number' && actualValue > (trigger.value as number);
    case 'gte':
      return typeof actualValue === 'number' && actualValue >= (trigger.value as number);
    case 'lt':
      return typeof actualValue === 'number' && actualValue < (trigger.value as number);
    case 'lte':
      return typeof actualValue === 'number' && actualValue <= (trigger.value as number);
    case 'contains':
      if (Array.isArray(actualValue)) {
        return actualValue.includes(trigger.value);
      }
      if (typeof actualValue === 'string') {
        return actualValue.includes(trigger.value as string);
      }
      return false;
    case 'exists':
      return actualValue !== undefined && actualValue !== null;
    default:
      return false;
  }
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// ============================================================================
// Action Executors
// ============================================================================

/**
 * Execute a data_flow action
 */
function executeDataFlowAction(
  action: DataFlowActionConfig,
  context: ExecutionContext,
): OrchestrationActionResult {
  try {
    const { deployment, triggerPayload } = context;

    // Get data from event payload or shared state
    let sourceData: unknown;

    if (triggerPayload && action.sourceOutput in triggerPayload) {
      sourceData = triggerPayload[action.sourceOutput];
    } else {
      sourceData = deployment.getSharedDataValue(`${action.sourceSlotId}.${action.sourceOutput}`);
    }

    // Update target
    if (action.targetSlotId === '_shared') {
      deployment.setSharedDataValue(action.targetInput, sourceData);
    } else {
      deployment.setSharedDataValue(`${action.targetSlotId}.${action.targetInput}`, sourceData);
    }

    return {
      actionType: 'data_flow',
      targetSlotId: action.targetSlotId,
      success: true,
      updates: { [action.targetInput]: sourceData },
    };
  } catch (error) {
    return {
      actionType: 'data_flow',
      targetSlotId: action.targetSlotId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a visibility action
 */
function executeVisibilityAction(
  action: VisibilityActionConfig,
  context: ExecutionContext,
): OrchestrationActionResult {
  try {
    const { deployment } = context;
    deployment.setToolVisibility(action.targetSlotId, action.visible);

    return {
      actionType: 'visibility',
      targetSlotId: action.targetSlotId,
      success: true,
      updates: { visible: action.visible },
    };
  } catch (error) {
    return {
      actionType: 'visibility',
      targetSlotId: action.targetSlotId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a config action
 */
function executeConfigAction(
  action: ConfigActionConfig,
  context: ExecutionContext,
): OrchestrationActionResult {
  try {
    const { deployment } = context;
    deployment.updateToolConfig(action.targetSlotId, action.updates);

    return {
      actionType: 'config',
      targetSlotId: action.targetSlotId,
      success: true,
      updates: action.updates,
    };
  } catch (error) {
    return {
      actionType: 'config',
      targetSlotId: action.targetSlotId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a notification action (placeholder - requires integration)
 */
function executeNotificationAction(
  action: NotificationActionConfig,
  _context: ExecutionContext,
): OrchestrationActionResult {
  // Notification sending would be handled by callbacks in real implementation
  return {
    actionType: 'notification',
    success: true,
    updates: {
      recipients: action.recipients,
      title: action.title,
      body: action.body,
    },
  };
}

/**
 * Execute a state action
 */
function executeStateAction(
  action: StateActionConfig,
  context: ExecutionContext,
): OrchestrationActionResult {
  try {
    const { deployment } = context;

    if (action.targetSlotId === '_shared') {
      if (action.merge) {
        deployment.updateSharedData(action.updates);
      } else {
        for (const [key, value] of Object.entries(action.updates)) {
          deployment.setSharedDataValue(key, value);
        }
      }
    } else {
      for (const [key, value] of Object.entries(action.updates)) {
        deployment.setSharedDataValue(`${action.targetSlotId}.${key}`, value);
      }
    }

    return {
      actionType: 'state',
      targetSlotId: action.targetSlotId,
      success: true,
      updates: action.updates,
    };
  } catch (error) {
    return {
      actionType: 'state',
      targetSlotId: action.targetSlotId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a single action based on its type
 */
function executeAction(
  action: OrchestrationActionConfig,
  context: ExecutionContext,
): OrchestrationActionResult {
  switch (action.type) {
    case 'data_flow':
      return executeDataFlowAction(action, context);
    case 'visibility':
      return executeVisibilityAction(action, context);
    case 'config':
      return executeConfigAction(action, context);
    case 'notification':
      return executeNotificationAction(action, context);
    case 'state':
      return executeStateAction(action, context);
    default:
      return {
        actionType: (action as { type: string }).type,
        success: false,
        error: `Unknown action type`,
      };
  }
}

// ============================================================================
// Orchestration Executor Service
// ============================================================================

export class OrchestrationExecutorService {
  constructor(private readonly callbacks?: ExecutorCallbacks) {}

  /**
   * Evaluate which rules match a tool event and execute them
   */
  executeOnToolEvent(
    deployment: SetupDeployment,
    slotId: string,
    eventType: string,
    payload: Record<string, unknown>,
    triggeredBy: string,
  ): OrchestrationExecutionResult {
    const matchingRules = deployment.orchestrationRules.filter(rule => {
      if (!rule.enabled) return false;
      if (rule.trigger.type !== 'tool_event') return false;
      return evaluateToolEventTrigger(rule.trigger as ToolEventTriggerConfig, slotId, eventType);
    });

    return this.executeRules(
      matchingRules,
      { deployment, triggeredBy, triggerPayload: payload },
      'tool_event',
      { slotId, eventType, payload },
    );
  }

  /**
   * Evaluate time-relative triggers and execute matching rules
   */
  executeOnTimeCheck(
    deployment: SetupDeployment,
    triggeredBy: string,
  ): OrchestrationExecutionResult {
    const matchingRules = deployment.orchestrationRules.filter(rule => {
      if (!rule.enabled) return false;
      if (rule.trigger.type !== 'time_relative') return false;
      return evaluateTimeRelativeTrigger(rule.trigger as TimeRelativeTriggerConfig, deployment.sharedData);
    });

    return this.executeRules(
      matchingRules,
      { deployment, triggeredBy },
      'time_relative',
      {},
    );
  }

  /**
   * Evaluate data condition triggers and execute matching rules
   */
  executeOnDataChange(
    deployment: SetupDeployment,
    triggeredBy: string,
  ): OrchestrationExecutionResult {
    const matchingRules = deployment.orchestrationRules.filter(rule => {
      if (!rule.enabled) return false;
      if (rule.trigger.type !== 'data_condition') return false;
      return evaluateDataConditionTrigger(rule.trigger as DataConditionTriggerConfig, deployment.sharedData);
    });

    return this.executeRules(
      matchingRules,
      { deployment, triggeredBy },
      'data_condition',
      {},
    );
  }

  /**
   * Execute a specific manual trigger rule
   */
  executeManualTrigger(
    deployment: SetupDeployment,
    ruleId: string,
    triggeredBy: string,
  ): Result<RuleExecutionResult> {
    const rule = deployment.orchestrationRules.find(r => r.id === ruleId);

    if (!rule) {
      return Result.fail(`Rule not found: ${ruleId}`);
    }

    if (!rule.enabled) {
      return Result.fail(`Rule is disabled: ${ruleId}`);
    }

    if (rule.trigger.type !== 'manual') {
      return Result.fail(`Rule is not a manual trigger: ${ruleId}`);
    }

    const context: ExecutionContext = { deployment, triggeredBy };
    const result = this.executeSingleRule(rule, context, 'manual', {});

    return Result.ok(result);
  }

  /**
   * Execute a list of matching rules
   */
  private executeRules(
    rules: OrchestrationRule[],
    context: ExecutionContext,
    triggerType: string,
    triggerDetails: Record<string, unknown>,
  ): OrchestrationExecutionResult {
    const executedRules: RuleExecutionResult[] = [];
    const logEntries: OrchestrationLogEntry[] = [];
    let totalActionsExecuted = 0;

    for (const rule of rules) {
      const result = this.executeSingleRule(rule, context, triggerType, triggerDetails);
      executedRules.push(result);

      if (!result.skipped) {
        totalActionsExecuted += result.actionsExecuted.length;

        // Create log entry
        const logEntry: OrchestrationLogEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: new Date(),
          triggerType: triggerType as 'tool_event' | 'time_relative' | 'data_condition' | 'manual',
          triggerDetails,
          actionsExecuted: result.actionsExecuted,
          triggeredBy: context.triggeredBy,
          success: result.success,
        };

        logEntries.push(logEntry);
        context.deployment.addLogEntry(logEntry);
      }
    }

    const overallSuccess = executedRules.every(r => r.success || r.skipped);

    return {
      executedRules,
      totalRulesEvaluated: rules.length,
      totalActionsExecuted,
      overallSuccess,
      logEntries,
    };
  }

  /**
   * Execute a single rule
   */
  private executeSingleRule(
    rule: OrchestrationRule,
    context: ExecutionContext,
    triggerType: string,
    triggerDetails: Record<string, unknown>,
  ): RuleExecutionResult {
    const { deployment } = context;

    // Check if runOnce rule has already been executed
    if (rule.runOnce && deployment.hasRuleExecuted(rule.id)) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        success: true,
        actionsExecuted: [],
        skipped: true,
        skipReason: 'Rule already executed (runOnce)',
      };
    }

    // Execute all actions
    const actionsExecuted: OrchestrationActionResult[] = [];

    for (const action of rule.actions) {
      const result = executeAction(action, context);
      actionsExecuted.push(result);
    }

    // Mark rule as executed
    deployment.markRuleExecuted(rule.id);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      success: actionsExecuted.every(a => a.success),
      actionsExecuted,
    };
  }

  /**
   * Get all pending time-relative triggers for scheduling
   */
  getPendingTimeTriggers(
    deployment: SetupDeployment,
  ): Array<{ rule: OrchestrationRule; scheduledFor: Date }> {
    const pending: Array<{ rule: OrchestrationRule; scheduledFor: Date }> = [];

    for (const rule of deployment.orchestrationRules) {
      if (!rule.enabled) continue;
      if (rule.trigger.type !== 'time_relative') continue;
      if (rule.runOnce && deployment.hasRuleExecuted(rule.id)) continue;

      const trigger = rule.trigger as TimeRelativeTriggerConfig;
      const referenceValue = getNestedValue(deployment.sharedData, trigger.referenceField);

      if (!referenceValue) continue;

      const referenceTime = new Date(referenceValue as string);
      if (isNaN(referenceTime.getTime())) continue;

      const scheduledFor = new Date(referenceTime.getTime() + trigger.offsetMinutes * 60 * 1000);

      // Only include future triggers
      if (scheduledFor > new Date()) {
        pending.push({ rule, scheduledFor });
      }
    }

    return pending.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }
}

// ============================================================================
// Factory
// ============================================================================

let executorInstance: OrchestrationExecutorService | null = null;

/**
 * Get the orchestration executor service instance
 */
export function getOrchestrationExecutor(callbacks?: ExecutorCallbacks): OrchestrationExecutorService {
  if (!executorInstance || callbacks) {
    executorInstance = new OrchestrationExecutorService(callbacks);
  }
  return executorInstance;
}

/**
 * Reset the executor instance (for testing)
 */
export function resetOrchestrationExecutor(): void {
  executorInstance = null;
}
