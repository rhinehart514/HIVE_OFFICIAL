/**
 * Automation Runner Service
 *
 * Sprint 4: Automations
 *
 * Core execution logic for tool automations. This service:
 * 1. Evaluates conditions against tool state
 * 2. Executes actions in sequence
 * 3. Enforces rate limits
 * 4. Logs run history
 *
 * Used by Cloud Functions (on-state-change, run-scheduled) to execute automations.
 */

import type {
  ToolAutomation,
  ToolAutomationRun,
  ToolAutomationAction,
  ToolAutomationCondition,
  ToolAutomationTrigger,
  ToolAutomationRunStatus,
} from '../../domain/hivelab/tool-automation.types';
import {
  evaluateAllConditions,
  canRunAutomation,
  MAX_AUTOMATION_RUNS_HISTORY,
} from '../../domain/hivelab/tool-automation.types';
import type { ToolSharedState } from '../../domain/hivelab/tool-composition.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Repository interface for automation data access
 */
export interface AutomationRunnerRepository {
  /**
   * Get all automations for a deployment
   */
  getAutomations(deploymentId: string): Promise<ToolAutomation[]>;

  /**
   * Get automations matching a specific trigger type
   */
  getAutomationsByTrigger(
    deploymentId: string,
    triggerType: ToolAutomationTrigger['type']
  ): Promise<ToolAutomation[]>;

  /**
   * Get automations by element event trigger
   */
  getAutomationsByElementEvent(
    deploymentId: string,
    elementId: string,
    event: string
  ): Promise<ToolAutomation[]>;

  /**
   * Get the current shared state for a tool
   */
  getToolState(deploymentId: string): Promise<ToolSharedState | null>;

  /**
   * Update automation after execution (lastRun, runCount, etc.)
   */
  updateAutomationStats(
    automationId: string,
    deploymentId: string,
    updates: {
      lastRun: string;
      runCount: number;
      errorCount: number;
      nextRun?: string;
    }
  ): Promise<void>;

  /**
   * Log an automation run
   */
  logRun(run: ToolAutomationRun): Promise<void>;

  /**
   * Get runs today count for rate limiting
   */
  getRunsToday(automationId: string, deploymentId: string): Promise<number>;

  /**
   * Prune old runs (keep last N)
   */
  pruneOldRuns(deploymentId: string, keepCount: number): Promise<void>;
}

/**
 * Action executor callbacks - injected by the caller
 */
export interface ActionExecutorCallbacks {
  /**
   * Send email notification
   */
  sendEmail: (params: {
    deploymentId: string;
    templateId: string;
    to: string | string[];
    subject?: string;
    body?: string;
    variables: Record<string, unknown>;
  }) => Promise<{ sent: number; errors?: string[] }>;

  /**
   * Send push notification
   */
  sendPush?: (params: {
    deploymentId: string;
    to: string | string[];
    title: string;
    body: string;
    link?: string;
    variables: Record<string, unknown>;
  }) => Promise<{ sent: number; errors?: string[] }>;

  /**
   * Mutate element state
   */
  mutateElement: (params: {
    deploymentId: string;
    elementId: string;
    mutation: Record<string, unknown>;
  }) => Promise<{ success: boolean; error?: string }>;

  /**
   * Trigger another tool
   */
  triggerTool: (params: {
    sourceDeploymentId: string;
    targetDeploymentId: string;
    event: string;
    data?: Record<string, unknown>;
  }) => Promise<{ success: boolean; error?: string }>;

  /**
   * Resolve recipients (role -> user IDs, 'all' -> member IDs, etc.)
   */
  resolveRecipients: (params: {
    deploymentId: string;
    to: 'user' | 'role' | 'all' | string;
    roleName?: string;
    triggeringUserId?: string;
  }) => Promise<string[]>;
}

/**
 * Context for automation execution
 */
export interface AutomationExecutionContext {
  /** Deployment ID */
  deploymentId: string;
  /** Space ID (if deployed to space) */
  spaceId?: string;
  /** Current tool state */
  state: ToolSharedState;
  /** Trigger data */
  trigger: {
    type: ToolAutomationTrigger['type'];
    elementId?: string;
    event?: string;
    previousValue?: unknown;
    currentValue?: unknown;
  };
  /** User who triggered (if applicable) */
  triggeringUserId?: string;
}

/**
 * Result of executing a single action
 */
export interface AutomationActionResult {
  actionType: ToolAutomationAction['type'];
  success: boolean;
  error?: string;
  output?: Record<string, unknown>;
}

/**
 * Result of running an automation
 */
export interface AutomationExecutionResult {
  automationId: string;
  status: ToolAutomationRunStatus;
  conditionResults?: boolean[];
  actionResults: AutomationActionResult[];
  error?: string;
  duration: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class AutomationRunnerService {
  constructor(
    private readonly repository: AutomationRunnerRepository,
    private readonly executors: ActionExecutorCallbacks
  ) {}

  /**
   * Process an event trigger and execute matching automations.
   * Called when an element emits an event.
   */
  async processEventTrigger(
    deploymentId: string,
    elementId: string,
    event: string,
    context: Omit<AutomationExecutionContext, 'trigger'>
  ): Promise<AutomationExecutionResult[]> {
    const automations = await this.repository.getAutomationsByElementEvent(
      deploymentId,
      elementId,
      event
    );

    const results: AutomationExecutionResult[] = [];

    for (const automation of automations) {
      if (!automation.enabled) continue;

      const result = await this.runAutomation(automation, {
        ...context,
        trigger: {
          type: 'event',
          elementId,
          event,
        },
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Process scheduled automations.
   * Called by Cloud Scheduler every minute.
   */
  async processScheduledTriggers(
    deploymentId: string,
    context: Omit<AutomationExecutionContext, 'trigger'>
  ): Promise<AutomationExecutionResult[]> {
    const automations = await this.repository.getAutomationsByTrigger(
      deploymentId,
      'schedule'
    );

    const now = new Date();
    const results: AutomationExecutionResult[] = [];

    for (const automation of automations) {
      if (!automation.enabled) continue;

      // Check if it's time to run
      if (automation.nextRun) {
        const nextRunTime = new Date(automation.nextRun);
        if (now < nextRunTime) continue;
      }

      const result = await this.runAutomation(automation, {
        ...context,
        trigger: {
          type: 'schedule',
        },
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Process threshold triggers by comparing state changes.
   * Called when tool state changes.
   */
  async processThresholdTriggers(
    deploymentId: string,
    previousState: ToolSharedState,
    currentState: ToolSharedState,
    context: Omit<AutomationExecutionContext, 'trigger'>
  ): Promise<AutomationExecutionResult[]> {
    const automations = await this.repository.getAutomationsByTrigger(
      deploymentId,
      'threshold'
    );

    const results: AutomationExecutionResult[] = [];

    for (const automation of automations) {
      if (!automation.enabled) continue;

      const trigger = automation.trigger;
      if (trigger.type !== 'threshold') continue;

      // Get previous and current values
      const prevValue = this.getValueAtPath(previousState, trigger.path);
      const currValue = this.getValueAtPath(currentState, trigger.path);

      // Check if threshold was crossed
      const wasCrossed = this.wasThresholdCrossed(
        prevValue,
        currValue,
        trigger.operator,
        trigger.value
      );

      if (!wasCrossed) continue;

      const result = await this.runAutomation(automation, {
        ...context,
        trigger: {
          type: 'threshold',
          previousValue: prevValue,
          currentValue: currValue,
        },
      });

      results.push(result);
    }

    return results;
  }

  /**
   * Run a single automation.
   */
  async runAutomation(
    automation: ToolAutomation,
    context: AutomationExecutionContext
  ): Promise<AutomationExecutionResult> {
    const startTime = Date.now();
    let status: ToolAutomationRunStatus = 'success';
    let error: string | undefined;
    let conditionResults: boolean[] | undefined;
    const actionResults: AutomationActionResult[] = [];

    try {
      // Check rate limits
      const runsToday = await this.repository.getRunsToday(
        automation.id,
        automation.deploymentId
      );
      const canRun = canRunAutomation(automation, runsToday);

      if (!canRun.canRun) {
        status = 'skipped';
        error = canRun.reason;
      } else {
        // Evaluate conditions
        if (automation.conditions && automation.conditions.length > 0) {
          const conditionContext = {
            state: context.state,
            trigger: context.trigger,
            user: { id: context.triggeringUserId },
          };

          const conditionEval = evaluateAllConditions(
            automation.conditions,
            conditionContext as Record<string, unknown>
          );
          conditionResults = conditionEval.results;

          if (!conditionEval.allMet) {
            status = 'skipped';
            error = 'Conditions not met';
          }
        }

        // Execute actions if not skipped
        if (status !== 'skipped') {
          for (const action of automation.actions) {
            const actionResult = await this.executeAction(action, context);
            actionResults.push(actionResult);

            // Stop on first failure
            if (!actionResult.success) {
              status = 'failed';
              error = actionResult.error;
              break;
            }
          }
        }
      }
    } catch (err) {
      status = 'failed';
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const duration = Date.now() - startTime;

    // Log the run
    const run: ToolAutomationRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      automationId: automation.id,
      deploymentId: automation.deploymentId,
      timestamp: new Date().toISOString(),
      status,
      triggerType: context.trigger.type,
      triggerData: {
        elementId: context.trigger.elementId,
        event: context.trigger.event,
        previousValue: context.trigger.previousValue,
        currentValue: context.trigger.currentValue,
      },
      conditionResults,
      actionsExecuted: actionResults
        .filter(r => r.success)
        .map(r => r.actionType),
      error,
      duration,
    };

    await this.repository.logRun(run);

    // Update automation stats
    await this.repository.updateAutomationStats(
      automation.id,
      automation.deploymentId,
      {
        lastRun: new Date().toISOString(),
        runCount: automation.runCount + 1,
        errorCount: status === 'failed'
          ? automation.errorCount + 1
          : automation.errorCount,
        nextRun: automation.trigger.type === 'schedule'
          ? this.calculateNextRun(automation.trigger)
          : undefined,
      }
    );

    // Prune old runs periodically
    if (automation.runCount % 10 === 0) {
      await this.repository.pruneOldRuns(
        automation.deploymentId,
        MAX_AUTOMATION_RUNS_HISTORY
      );
    }

    return {
      automationId: automation.id,
      status,
      conditionResults,
      actionResults,
      error,
      duration,
    };
  }

  /**
   * Execute a single action.
   */
  private async executeAction(
    action: ToolAutomationAction,
    context: AutomationExecutionContext
  ): Promise<AutomationActionResult> {
    try {
      switch (action.type) {
        case 'notify': {
          if (action.channel === 'email') {
            const recipients = await this.executors.resolveRecipients({
              deploymentId: context.deploymentId,
              to: action.to,
              roleName: action.roleName,
              triggeringUserId: context.triggeringUserId,
            });

            if (recipients.length === 0) {
              return {
                actionType: 'notify',
                success: false,
                error: 'No recipients found',
              };
            }

            const result = await this.executors.sendEmail({
              deploymentId: context.deploymentId,
              templateId: action.templateId,
              to: recipients,
              subject: action.subject,
              body: action.body,
              variables: this.buildVariables(context),
            });

            return {
              actionType: 'notify',
              success: result.sent > 0,
              error: result.errors?.join(', '),
              output: { sent: result.sent },
            };
          } else if (action.channel === 'push' && this.executors.sendPush) {
            const recipients = await this.executors.resolveRecipients({
              deploymentId: context.deploymentId,
              to: action.to,
              roleName: action.roleName,
              triggeringUserId: context.triggeringUserId,
            });

            const result = await this.executors.sendPush({
              deploymentId: context.deploymentId,
              to: recipients,
              title: action.title,
              body: action.body,
              link: action.link,
              variables: this.buildVariables(context),
            });

            return {
              actionType: 'notify',
              success: result.sent > 0,
              error: result.errors?.join(', '),
              output: { sent: result.sent },
            };
          }

          return {
            actionType: 'notify',
            success: false,
            error: `Unsupported notification channel: ${(action as { channel?: string }).channel}`,
          };
        }

        case 'mutate': {
          const result = await this.executors.mutateElement({
            deploymentId: context.deploymentId,
            elementId: action.elementId,
            mutation: action.mutation,
          });

          return {
            actionType: 'mutate',
            success: result.success,
            error: result.error,
          };
        }

        case 'triggerTool': {
          const result = await this.executors.triggerTool({
            sourceDeploymentId: context.deploymentId,
            targetDeploymentId: action.deploymentId,
            event: action.event,
            data: action.data,
          });

          return {
            actionType: 'triggerTool',
            success: result.success,
            error: result.error,
          };
        }

        default:
          return {
            actionType: (action as { type: string }).type as ToolAutomationAction['type'],
            success: false,
            error: `Unknown action type: ${(action as { type: string }).type}`,
          };
      }
    } catch (err) {
      return {
        actionType: action.type,
        success: false,
        error: err instanceof Error ? err.message : 'Action execution failed',
      };
    }
  }

  /**
   * Build template variables from context.
   */
  private buildVariables(
    context: AutomationExecutionContext
  ): Record<string, unknown> {
    return {
      deploymentId: context.deploymentId,
      spaceId: context.spaceId,
      trigger: context.trigger,
      state: context.state,
      user: {
        id: context.triggeringUserId,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get value at a dot-notation path.
   */
  private getValueAtPath(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;

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
   * Check if a threshold was crossed.
   */
  private wasThresholdCrossed(
    prevValue: unknown,
    currValue: unknown,
    operator: '>' | '<' | '==' | '>=' | '<=',
    threshold: number
  ): boolean {
    const prev = typeof prevValue === 'number' ? prevValue : 0;
    const curr = typeof currValue === 'number' ? currValue : 0;

    const wasAbove = this.compareValue(prev, operator, threshold);
    const isAbove = this.compareValue(curr, operator, threshold);

    // Crossed means it wasn't meeting the condition before but is now
    return !wasAbove && isAbove;
  }

  /**
   * Compare a value against a threshold.
   */
  private compareValue(
    value: number,
    operator: '>' | '<' | '==' | '>=' | '<=',
    threshold: number
  ): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '==': return value === threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Calculate next run time for scheduled automation from cron expression.
   */
  private calculateNextRun(
    trigger: ToolAutomationTrigger & { type: 'schedule' }
  ): string {
    const cron = trigger.cron;
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      const fallback = new Date();
      fallback.setHours(fallback.getHours() + 1);
      return fallback.toISOString();
    }

    const [minuteSpec, hourSpec, daySpec, monthSpec, weekdaySpec] = parts;

    function matchesField(spec: string, value: number): boolean {
      if (spec === '*') return true;
      if (spec.startsWith('*/')) {
        const step = parseInt(spec.slice(2), 10);
        return step > 0 && value % step === 0;
      }
      return spec.split(',').some(v => parseInt(v, 10) === value);
    }

    const now = new Date();
    const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
    const maxMinutes = 48 * 60;

    for (let i = 0; i < maxMinutes; i++) {
      if (
        matchesField(minuteSpec, candidate.getMinutes()) &&
        matchesField(hourSpec, candidate.getHours()) &&
        matchesField(daySpec, candidate.getDate()) &&
        matchesField(monthSpec, candidate.getMonth() + 1) &&
        matchesField(weekdaySpec, candidate.getDay())
      ) {
        return candidate.toISOString();
      }
      candidate.setMinutes(candidate.getMinutes() + 1);
    }

    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 24);
    return fallback.toISOString();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let instance: AutomationRunnerService | null = null;

/**
 * Get the singleton automation runner instance.
 */
export function getAutomationRunner(): AutomationRunnerService {
  if (!instance) {
    throw new Error(
      'AutomationRunnerService not initialized. Call initializeAutomationRunner first.'
    );
  }
  return instance;
}

/**
 * Initialize the automation runner with dependencies.
 */
export function initializeAutomationRunner(
  repository: AutomationRunnerRepository,
  executors: ActionExecutorCallbacks
): AutomationRunnerService {
  instance = new AutomationRunnerService(repository, executors);
  return instance;
}

/**
 * Create an automation runner (non-singleton for testing).
 */
export function createAutomationRunner(
  repository: AutomationRunnerRepository,
  executors: ActionExecutorCallbacks
): AutomationRunnerService {
  return new AutomationRunnerService(repository, executors);
}

/**
 * Reset the singleton (for testing).
 */
export function resetAutomationRunner(): void {
  instance = null;
}
