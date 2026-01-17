/**
 * SetupDeployment Entity - Instance of a Setup deployed to a space
 *
 * A SetupDeployment tracks:
 * - Which tools are deployed and their configurations
 * - The current state of orchestration (which rules have fired)
 * - Shared data between tools
 * - Deployment status (active, paused, completed, archived)
 */

import { Result } from '../../shared/base/Result';
import type {
  SetupToolSlot,
  OrchestrationRule,
  SetupCategory,
  OrchestrationActionConfig,
  SetupConfigField,
} from './setup-template';

// ============================================================================
// Deployed Tool Types
// ============================================================================

/**
 * A tool instance deployed as part of a Setup
 */
export interface DeployedSetupTool {
  /** Slot ID from the template */
  slotId: string;

  /** Actual deployment ID in Firestore (from placed_tools) */
  deploymentId: string;

  /** Current visibility state */
  isVisible: boolean;

  /** Current configuration (may differ from template defaults) */
  config: Record<string, unknown>;

  /** Placement in the space */
  placement: 'sidebar' | 'inline' | 'modal' | 'tab';

  /** Order in the deployment (for UI ordering) */
  order: number;
}

// ============================================================================
// Orchestration State Types
// ============================================================================

/**
 * Execution log entry for an orchestration rule
 */
export interface OrchestrationLogEntry {
  /** Unique log entry ID */
  id: string;

  /** Rule ID that was executed */
  ruleId: string;

  /** Rule name for display */
  ruleName: string;

  /** When the rule was triggered */
  triggeredAt: Date;

  /** What triggered the rule */
  triggerType: 'tool_event' | 'time_relative' | 'data_condition' | 'manual';

  /** Trigger details */
  triggerDetails: Record<string, unknown>;

  /** Actions that were executed */
  actionsExecuted: Array<{
    actionType: string;
    targetSlotId?: string;
    success: boolean;
    error?: string;
  }>;

  /** User who triggered (for manual triggers) */
  triggeredBy?: string;

  /** Whether all actions succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Current orchestration state
 */
export interface OrchestrationState {
  /** Current phase/stage name (for display) */
  currentPhase: string | null;

  /** Rules that are currently active (can fire) */
  activeRules: string[];

  /** Rules that have been executed (for runOnce rules) */
  executedRules: string[];

  /** Scheduled triggers (time-relative rules) */
  scheduledTriggers: Array<{
    ruleId: string;
    scheduledFor: Date;
    triggered: boolean;
  }>;

  /** Last rule execution time */
  lastExecutionAt: Date | null;
}

// ============================================================================
// Setup Deployment Status
// ============================================================================

/**
 * Deployment status
 */
export type SetupDeploymentStatus =
  | 'active'     // Running normally
  | 'paused'     // Temporarily stopped
  | 'completed'  // Setup has run to completion
  | 'archived';  // No longer in use

// ============================================================================
// Setup Deployment Props
// ============================================================================

/**
 * Setup deployment properties
 */
export interface SetupDeploymentProps {
  /** Unique deployment ID */
  id: string;

  /** Template ID this deployment is based on */
  templateId: string;

  /** Template name (cached for display) */
  templateName: string;

  /** Template category (cached for filtering) */
  templateCategory: SetupCategory;

  /** Template icon (cached for display) */
  templateIcon: string;

  /** Space this Setup is deployed to */
  spaceId: string;

  /** Campus ID */
  campusId: string;

  /** User who deployed this Setup */
  deployedBy: string;

  /** Deployed tools */
  tools: DeployedSetupTool[];

  /** Current orchestration state */
  orchestrationState: OrchestrationState;

  /** Orchestration rules (copied from template at deploy time) */
  orchestrationRules: OrchestrationRule[];

  /** Shared data between tools */
  sharedData: Record<string, unknown>;

  /** Configuration values (from install wizard) */
  config: Record<string, unknown>;

  /** Deployment status */
  status: SetupDeploymentStatus;

  /** Execution log (recent entries) */
  executionLog: OrchestrationLogEntry[];

  /** Maximum log entries to keep */
  maxLogEntries: number;

  /** Timestamps */
  deployedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  archivedAt?: Date;
}

// ============================================================================
// SetupDeployment Entity
// ============================================================================

export class SetupDeployment {
  private constructor(private readonly props: SetupDeploymentProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get templateId(): string {
    return this.props.templateId;
  }

  get templateName(): string {
    return this.props.templateName;
  }

  get templateCategory(): SetupCategory {
    return this.props.templateCategory;
  }

  get templateIcon(): string {
    return this.props.templateIcon;
  }

  get spaceId(): string {
    return this.props.spaceId;
  }

  get campusId(): string {
    return this.props.campusId;
  }

  get deployedBy(): string {
    return this.props.deployedBy;
  }

  get tools(): DeployedSetupTool[] {
    return [...this.props.tools];
  }

  get orchestrationState(): OrchestrationState {
    return { ...this.props.orchestrationState };
  }

  get orchestrationRules(): OrchestrationRule[] {
    return [...this.props.orchestrationRules];
  }

  get sharedData(): Record<string, unknown> {
    return { ...this.props.sharedData };
  }

  get config(): Record<string, unknown> {
    return { ...this.props.config };
  }

  get status(): SetupDeploymentStatus {
    return this.props.status;
  }

  get executionLog(): OrchestrationLogEntry[] {
    return [...this.props.executionLog];
  }

  get deployedAt(): Date {
    return this.props.deployedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get archivedAt(): Date | undefined {
    return this.props.archivedAt;
  }

  get toolCount(): number {
    return this.props.tools.length;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  // ============================================================================
  // Tool Management
  // ============================================================================

  /**
   * Get a deployed tool by slot ID
   */
  getTool(slotId: string): DeployedSetupTool | undefined {
    return this.props.tools.find(t => t.slotId === slotId);
  }

  /**
   * Get visible tools
   */
  getVisibleTools(): DeployedSetupTool[] {
    return this.props.tools.filter(t => t.isVisible);
  }

  /**
   * Set tool visibility
   */
  setToolVisibility(slotId: string, isVisible: boolean): void {
    const tool = this.props.tools.find(t => t.slotId === slotId);
    if (tool) {
      tool.isVisible = isVisible;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Update tool configuration
   */
  updateToolConfig(slotId: string, updates: Record<string, unknown>): void {
    const tool = this.props.tools.find(t => t.slotId === slotId);
    if (tool) {
      tool.config = { ...tool.config, ...updates };
      this.props.updatedAt = new Date();
    }
  }

  // ============================================================================
  // Shared Data Management
  // ============================================================================

  /**
   * Get a value from shared data
   */
  getSharedDataValue(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.props.sharedData;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Update shared data
   */
  updateSharedData(updates: Record<string, unknown>): void {
    this.props.sharedData = { ...this.props.sharedData, ...updates };
    this.props.updatedAt = new Date();
  }

  /**
   * Set a nested value in shared data
   */
  setSharedDataValue(path: string, value: unknown): void {
    const parts = path.split('.');
    const lastPart = parts.pop()!;

    let current: Record<string, unknown> = this.props.sharedData;
    for (const part of parts) {
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    current[lastPart] = value;
    this.props.updatedAt = new Date();
  }

  // ============================================================================
  // Orchestration Management
  // ============================================================================

  /**
   * Get an orchestration rule by ID
   */
  getRule(ruleId: string): OrchestrationRule | undefined {
    return this.props.orchestrationRules.find(r => r.id === ruleId);
  }

  /**
   * Check if a rule has been executed (for runOnce rules)
   */
  hasRuleExecuted(ruleId: string): boolean {
    return this.props.orchestrationState.executedRules.includes(ruleId);
  }

  /**
   * Check if a rule is currently active
   */
  isRuleActive(ruleId: string): boolean {
    return this.props.orchestrationState.activeRules.includes(ruleId);
  }

  /**
   * Mark a rule as executed
   */
  markRuleExecuted(ruleId: string): void {
    if (!this.props.orchestrationState.executedRules.includes(ruleId)) {
      this.props.orchestrationState.executedRules.push(ruleId);
    }
    this.props.orchestrationState.lastExecutionAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Set the current phase
   */
  setCurrentPhase(phase: string | null): void {
    this.props.orchestrationState.currentPhase = phase;
    this.props.updatedAt = new Date();
  }

  /**
   * Add a scheduled trigger
   */
  addScheduledTrigger(ruleId: string, scheduledFor: Date): void {
    this.props.orchestrationState.scheduledTriggers.push({
      ruleId,
      scheduledFor,
      triggered: false,
    });
    this.props.updatedAt = new Date();
  }

  /**
   * Mark a scheduled trigger as triggered
   */
  markScheduledTriggerTriggered(ruleId: string): void {
    const trigger = this.props.orchestrationState.scheduledTriggers.find(
      t => t.ruleId === ruleId && !t.triggered,
    );
    if (trigger) {
      trigger.triggered = true;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Add an execution log entry
   */
  addLogEntry(entry: Omit<OrchestrationLogEntry, 'id'>): void {
    const logEntry: OrchestrationLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    this.props.executionLog.unshift(logEntry);

    // Trim log to max entries
    if (this.props.executionLog.length > this.props.maxLogEntries) {
      this.props.executionLog = this.props.executionLog.slice(0, this.props.maxLogEntries);
    }

    this.props.updatedAt = new Date();
  }

  // ============================================================================
  // Status Management
  // ============================================================================

  /**
   * Pause the deployment
   */
  pause(): void {
    if (this.props.status === 'active') {
      this.props.status = 'paused';
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Resume the deployment
   */
  resume(): void {
    if (this.props.status === 'paused') {
      this.props.status = 'active';
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Mark as completed
   */
  complete(): void {
    this.props.status = 'completed';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Archive the deployment
   */
  archive(): void {
    this.props.status = 'archived';
    this.props.archivedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Get all props for persistence
   */
  toProps(): SetupDeploymentProps {
    return { ...this.props };
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new SetupDeployment from a template
   */
  static createFromTemplate(
    deploymentId: string,
    template: {
      id: string;
      name: string;
      category: SetupCategory;
      icon: string;
      tools: SetupToolSlot[];
      orchestration: OrchestrationRule[];
      sharedDataSchema: Record<string, unknown>;
      configFields: SetupConfigField[];
    },
    spaceId: string,
    campusId: string,
    deployedBy: string,
    config: Record<string, unknown>,
    deployedTools: Array<{ slotId: string; deploymentId: string }>,
  ): Result<SetupDeployment> {
    // Validation
    if (!deploymentId) {
      return Result.fail<SetupDeployment>('Deployment ID is required');
    }

    if (!spaceId) {
      return Result.fail<SetupDeployment>('Space ID is required');
    }

    if (!deployedBy) {
      return Result.fail<SetupDeployment>('Deployed by user ID is required');
    }

    // Build deployed tools from template slots and actual deployments
    const tools: DeployedSetupTool[] = [];
    for (let i = 0; i < template.tools.length; i++) {
      const slot = template.tools[i];
      const deployed = deployedTools.find(d => d.slotId === slot.slotId);

      if (!deployed) {
        return Result.fail<SetupDeployment>(`Missing deployment for slot: ${slot.slotId}`);
      }

      tools.push({
        slotId: slot.slotId,
        deploymentId: deployed.deploymentId,
        isVisible: slot.initiallyVisible,
        config: { ...slot.defaultConfig },
        placement: slot.placement,
        order: i,
      });
    }

    // Initialize orchestration state
    const orchestrationState: OrchestrationState = {
      currentPhase: null,
      activeRules: template.orchestration.filter(r => r.enabled).map(r => r.id),
      executedRules: [],
      scheduledTriggers: [],
      lastExecutionAt: null,
    };

    // Initialize shared data from schema defaults
    const sharedData: Record<string, unknown> = {};

    // Extract default values from JSON Schema properties
    const schemaProperties = template.sharedDataSchema.properties as Record<string, { default?: unknown }> | undefined;
    if (schemaProperties) {
      for (const [key, schema] of Object.entries(schemaProperties)) {
        if (schema && 'default' in schema && schema.default !== undefined) {
          sharedData[key] = schema.default;
        }
      }
    }

    // Also apply config values that map to shared data (e.g., eventName from install config)
    for (const field of template.configFields) {
      if (config[field.key] !== undefined) {
        sharedData[field.key] = config[field.key];
      } else if (field.defaultValue !== undefined) {
        sharedData[field.key] = field.defaultValue;
      }
    }

    const now = new Date();

    const deployment = new SetupDeployment({
      id: deploymentId,
      templateId: template.id,
      templateName: template.name,
      templateCategory: template.category,
      templateIcon: template.icon,
      spaceId,
      campusId,
      deployedBy,
      tools,
      orchestrationState,
      orchestrationRules: [...template.orchestration],
      sharedData,
      config,
      status: 'active',
      executionLog: [],
      maxLogEntries: 100,
      deployedAt: now,
      updatedAt: now,
    });

    return Result.ok<SetupDeployment>(deployment);
  }

  /**
   * Reconstitute from persistence (skip validation for trusted data)
   */
  static reconstitute(props: SetupDeploymentProps): SetupDeployment {
    return new SetupDeployment(props);
  }
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Setup deployment list item DTO
 */
export interface SetupDeploymentListDTO {
  id: string;
  templateId: string;
  templateName: string;
  templateCategory: SetupCategory;
  templateIcon: string;
  spaceId: string;
  status: SetupDeploymentStatus;
  toolCount: number;
  currentPhase: string | null;
  deployedAt: string;
  updatedAt: string;
}

/**
 * Setup deployment detail DTO
 */
export interface SetupDeploymentDetailDTO extends SetupDeploymentListDTO {
  campusId: string;
  deployedBy: string;
  tools: DeployedSetupTool[];
  orchestrationState: OrchestrationState;
  sharedData: Record<string, unknown>;
  config: Record<string, unknown>;
  executionLog: Array<{
    id: string;
    ruleId: string;
    ruleName: string;
    triggeredAt: string;
    triggerType: string;
    success: boolean;
  }>;
  completedAt?: string;
  archivedAt?: string;
}

/**
 * Convert SetupDeployment entity to list DTO
 */
export function toSetupDeploymentListDTO(deployment: SetupDeployment): SetupDeploymentListDTO {
  return {
    id: deployment.id,
    templateId: deployment.templateId,
    templateName: deployment.templateName,
    templateCategory: deployment.templateCategory,
    templateIcon: deployment.templateIcon,
    spaceId: deployment.spaceId,
    status: deployment.status,
    toolCount: deployment.toolCount,
    currentPhase: deployment.orchestrationState.currentPhase,
    deployedAt: deployment.deployedAt.toISOString(),
    updatedAt: deployment.updatedAt.toISOString(),
  };
}

/**
 * Convert SetupDeployment entity to detail DTO
 */
export function toSetupDeploymentDetailDTO(deployment: SetupDeployment): SetupDeploymentDetailDTO {
  return {
    ...toSetupDeploymentListDTO(deployment),
    campusId: deployment.campusId,
    deployedBy: deployment.deployedBy,
    tools: deployment.tools,
    orchestrationState: deployment.orchestrationState,
    sharedData: deployment.sharedData,
    config: deployment.config,
    executionLog: deployment.executionLog.map(entry => ({
      id: entry.id,
      ruleId: entry.ruleId,
      ruleName: entry.ruleName,
      triggeredAt: entry.triggeredAt.toISOString(),
      triggerType: entry.triggerType,
      success: entry.success,
    })),
    completedAt: deployment.completedAt?.toISOString(),
    archivedAt: deployment.archivedAt?.toISOString(),
  };
}
