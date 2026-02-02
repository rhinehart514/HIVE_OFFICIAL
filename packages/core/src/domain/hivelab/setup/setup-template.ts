/**
 * SetupTemplate Entity - Blueprint for orchestrated tool bundles
 *
 * A Setup is a bundle of ToolCompositions with:
 * - Shared defaults across tools
 * - Cross-tool triggers (countdown complete -> show check-in)
 * - Data flow between tools (RSVP list -> check-in expected list)
 * - Conditional branching (if checked in, enable photo upload)
 *
 * SetupTemplate is the blueprint that defines the structure.
 * SetupDeployment is an instance installed in a space.
 */

import { Result } from '../../shared/base/Result';
import type { ToolCapabilities } from '../capabilities';

// ============================================================================
// Setup Tool Slot Types
// ============================================================================

/**
 * A tool slot within a Setup.
 * Each slot represents a tool that will be deployed as part of the Setup.
 */
export interface SetupToolSlot {
  /** Unique slot ID within the Setup (e.g., 'rsvp', 'countdown', 'checkin') */
  slotId: string;

  /** Display name for this slot */
  name: string;

  /** Template ID or tool composition to use */
  templateId?: string;

  /** Inline tool composition (if not using a template) */
  composition?: {
    elements: Array<{
      elementId: string;
      instanceId: string;
      config: Record<string, unknown>;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
    connections: Array<{
      from: { instanceId: string; output: string };
      to: { instanceId: string; input: string };
    }>;
    layout: 'grid' | 'flow' | 'tabs' | 'sidebar';
  };

  /** Default configuration for this tool */
  defaultConfig: Record<string, unknown>;

  /** Placement in the space (sidebar/inline/modal/tab) */
  placement: 'sidebar' | 'inline' | 'modal' | 'tab';

  /** Initial visibility (can be changed by orchestration) */
  initiallyVisible: boolean;

  /** Tool description for this slot */
  description?: string;

  /** Icon (lucide icon name) */
  icon?: string;
}

// ============================================================================
// Orchestration Types
// ============================================================================

/**
 * Trigger types for orchestration rules
 */
export type OrchestrationTriggerType =
  | 'tool_event'      // Tool emits an event (e.g., countdown_complete)
  | 'time_relative'   // X minutes before/after a timestamp
  | 'data_condition'  // Shared data matches condition
  | 'manual';         // Leader clicks a button

/**
 * Tool event trigger configuration
 */
export interface ToolEventTriggerConfig {
  type: 'tool_event';
  /** The slot ID of the tool that emits the event */
  sourceSlotId: string;
  /** The event type to listen for */
  eventType: string;
}

/**
 * Time-relative trigger configuration
 */
export interface TimeRelativeTriggerConfig {
  type: 'time_relative';
  /** Field in sharedData that contains the reference timestamp */
  referenceField: string;
  /** Offset in minutes (negative = before, positive = after) */
  offsetMinutes: number;
}

/**
 * Data condition trigger configuration
 */
export interface DataConditionTriggerConfig {
  type: 'data_condition';
  /** Path to the data field in sharedData (dot notation) */
  dataPath: string;
  /** Comparison operator */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
  /** Value to compare against */
  value: unknown;
}

/**
 * Manual trigger configuration
 */
export interface ManualTriggerConfig {
  type: 'manual';
  /** Button label shown to leaders */
  buttonLabel: string;
  /** Confirmation message (optional) */
  confirmMessage?: string;
}

/**
 * Union type for trigger configurations
 */
export type OrchestrationTriggerConfig =
  | ToolEventTriggerConfig
  | TimeRelativeTriggerConfig
  | DataConditionTriggerConfig
  | ManualTriggerConfig;

/**
 * Action types for orchestration rules
 */
export type OrchestrationActionType =
  | 'data_flow'       // Pass data from one tool to another
  | 'visibility'      // Show/hide a tool
  | 'config'          // Update tool configuration
  | 'notification'    // Send a notification
  | 'state';          // Update shared state

/**
 * Data flow action configuration
 */
export interface DataFlowActionConfig {
  type: 'data_flow';
  /** Source slot ID */
  sourceSlotId: string;
  /** Output name from source tool */
  sourceOutput: string;
  /** Target slot ID */
  targetSlotId: string;
  /** Input name on target tool */
  targetInput: string;
  /** Optional transform function name */
  transform?: string;
}

/**
 * Visibility action configuration
 */
export interface VisibilityActionConfig {
  type: 'visibility';
  /** Target slot ID */
  targetSlotId: string;
  /** Whether to show or hide */
  visible: boolean;
}

/**
 * Config update action configuration
 */
export interface ConfigActionConfig {
  type: 'config';
  /** Target slot ID */
  targetSlotId: string;
  /** Configuration updates to apply */
  updates: Record<string, unknown>;
}

/**
 * Notification action configuration
 */
export interface NotificationActionConfig {
  type: 'notification';
  /** Recipients: 'all', 'rsvped', 'checked_in', or specific role */
  recipients: 'all' | 'rsvped' | 'checked_in' | 'admins' | 'role:string';
  /** Notification title */
  title: string;
  /** Notification body (supports {variable} interpolation) */
  body: string;
  /** Optional action URL */
  actionUrl?: string;
}

/**
 * State update action configuration
 */
export interface StateActionConfig {
  type: 'state';
  /** Target slot ID (or '_shared' for shared state) */
  targetSlotId: string;
  /** State updates to apply */
  updates: Record<string, unknown>;
  /** Whether to merge or replace */
  merge: boolean;
}

/**
 * Union type for action configurations
 */
export type OrchestrationActionConfig =
  | DataFlowActionConfig
  | VisibilityActionConfig
  | ConfigActionConfig
  | NotificationActionConfig
  | StateActionConfig;

/**
 * A single orchestration rule
 */
export interface OrchestrationRule {
  /** Unique rule ID within the Setup */
  id: string;

  /** Human-readable rule name */
  name: string;

  /** Description of what this rule does */
  description?: string;

  /** Trigger configuration */
  trigger: OrchestrationTriggerConfig;

  /** Actions to execute when triggered */
  actions: OrchestrationActionConfig[];

  /** Whether this rule is enabled */
  enabled: boolean;

  /** Optional: only run once (vs every time trigger fires) */
  runOnce?: boolean;
}

// ============================================================================
// Setup Template Types
// ============================================================================

/**
 * Configuration field definition for Setup install
 */
export interface SetupConfigField {
  /** Field key */
  key: string;

  /** Display label */
  label: string;

  /** Field type */
  type: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean';

  /** Whether this field is required */
  required: boolean;

  /** Default value */
  defaultValue?: unknown;

  /** Options for select/multiselect */
  options?: Array<{ value: string; label: string }>;

  /** Help text */
  helpText?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/**
 * Setup category
 */
export type SetupCategory =
  | 'event'       // Event management (RSVP, countdown, check-in)
  | 'campaign'    // Multi-phase campaigns (launches, challenges)
  | 'workflow'    // Operational workflows (recruiting, onboarding)
  | 'engagement'  // Engagement patterns (contests, polls)
  | 'governance'; // Decision-making (voting, proposals)

/**
 * Setup template source
 */
export type SetupSource =
  | 'system'      // Built-in HIVE templates
  | 'community'   // User-created templates
  | 'featured';   // Curated by HIVE team

/**
 * Setup template properties
 */
export interface SetupTemplateProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SetupCategory;
  source: SetupSource;

  /** Tools bundled in this Setup */
  tools: SetupToolSlot[];

  /** Orchestration rules */
  orchestration: OrchestrationRule[];

  /** JSON Schema for shared data between tools */
  sharedDataSchema: Record<string, unknown>;

  /** Configuration fields shown at install time */
  configFields: SetupConfigField[];

  /** Required capabilities for this Setup */
  requiredCapabilities: Partial<ToolCapabilities>;

  /** Tags for discovery */
  tags: string[];

  /** Whether this is a system template (immutable) */
  isSystem: boolean;

  /** Whether this template is featured */
  isFeatured: boolean;

  /** Number of times this Setup has been deployed */
  deploymentCount: number;

  /** Creator ID */
  creatorId: string;

  /** Creator name (for display) */
  creatorName?: string;

  /** Campus ID (for campus-specific templates) */
  campusId?: string;

  /** Preview image URL */
  thumbnailUrl?: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SetupTemplate Entity
// ============================================================================

export class SetupTemplate {
  private constructor(private readonly props: SetupTemplateProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get icon(): string {
    return this.props.icon;
  }

  get category(): SetupCategory {
    return this.props.category;
  }

  get source(): SetupSource {
    return this.props.source;
  }

  get tools(): SetupToolSlot[] {
    return [...this.props.tools];
  }

  get orchestration(): OrchestrationRule[] {
    return [...this.props.orchestration];
  }

  get sharedDataSchema(): Record<string, unknown> {
    return { ...this.props.sharedDataSchema };
  }

  get configFields(): SetupConfigField[] {
    return [...this.props.configFields];
  }

  get requiredCapabilities(): Partial<ToolCapabilities> {
    return { ...this.props.requiredCapabilities };
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get deploymentCount(): number {
    return this.props.deploymentCount;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get creatorName(): string | undefined {
    return this.props.creatorName;
  }

  get campusId(): string | undefined {
    return this.props.campusId;
  }

  get thumbnailUrl(): string | undefined {
    return this.props.thumbnailUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get toolCount(): number {
    return this.props.tools.length;
  }

  get ruleCount(): number {
    return this.props.orchestration.length;
  }

  // ============================================================================
  // Domain Methods
  // ============================================================================

  /**
   * Get a tool slot by ID
   */
  getToolSlot(slotId: string): SetupToolSlot | undefined {
    return this.props.tools.find(t => t.slotId === slotId);
  }

  /**
   * Get an orchestration rule by ID
   */
  getRule(ruleId: string): OrchestrationRule | undefined {
    return this.props.orchestration.find(r => r.id === ruleId);
  }

  /**
   * Get all rules triggered by a specific event
   */
  getRulesForEvent(slotId: string, eventType: string): OrchestrationRule[] {
    return this.props.orchestration.filter(rule => {
      if (rule.trigger.type !== 'tool_event') return false;
      const config = rule.trigger as ToolEventTriggerConfig;
      return config.sourceSlotId === slotId && config.eventType === eventType;
    });
  }

  /**
   * Get all manual trigger rules
   */
  getManualRules(): OrchestrationRule[] {
    return this.props.orchestration.filter(rule => rule.trigger.type === 'manual');
  }

  /**
   * Check if a user can edit this template
   */
  canEdit(userId: string): boolean {
    if (this.props.isSystem) return false;
    return this.props.creatorId === userId;
  }

  /**
   * Increment deployment count
   */
  incrementDeploymentCount(): void {
    this.props.deploymentCount += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Update template metadata
   */
  update(
    updates: Partial<
      Pick<SetupTemplateProps, 'name' | 'description' | 'icon' | 'category' | 'tags' | 'thumbnailUrl'>
    >,
  ): void {
    if (this.props.isSystem) {
      throw new Error('Cannot update system templates');
    }

    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.description !== undefined) this.props.description = updates.description;
    if (updates.icon !== undefined) this.props.icon = updates.icon;
    if (updates.category !== undefined) this.props.category = updates.category;
    if (updates.tags !== undefined) this.props.tags = [...updates.tags];
    if (updates.thumbnailUrl !== undefined) this.props.thumbnailUrl = updates.thumbnailUrl;

    this.props.updatedAt = new Date();
  }

  /**
   * Update orchestration rules
   */
  updateOrchestration(orchestration: OrchestrationRule[]): void {
    if (this.props.isSystem) {
      throw new Error('Cannot update orchestration on system templates');
    }

    this.props.orchestration = [...orchestration];
    this.props.updatedAt = new Date();
  }

  /**
   * Set featured status
   */
  setFeatured(featured: boolean): void {
    this.props.isFeatured = featured;
    this.props.updatedAt = new Date();
  }

  /**
   * Get all props for persistence
   */
  toProps(): SetupTemplateProps {
    return { ...this.props };
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  /**
   * Create a new SetupTemplate
   */
  static create(
    props: Omit<SetupTemplateProps, 'createdAt' | 'updatedAt' | 'deploymentCount'> & {
      createdAt?: Date;
      updatedAt?: Date;
      deploymentCount?: number;
    },
  ): Result<SetupTemplate> {
    // Validation
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail<SetupTemplate>('Setup ID is required');
    }

    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<SetupTemplate>('Setup name is required');
    }

    if (props.name.length > 100) {
      return Result.fail<SetupTemplate>('Setup name must be 100 characters or less');
    }

    if (!props.description) {
      return Result.fail<SetupTemplate>('Setup description is required');
    }

    if (props.description.length > 500) {
      return Result.fail<SetupTemplate>('Setup description must be 500 characters or less');
    }

    if (!props.tools || props.tools.length === 0) {
      return Result.fail<SetupTemplate>('Setup must have at least one tool');
    }

    // Validate tool slots have unique IDs
    const slotIds = new Set<string>();
    for (const tool of props.tools) {
      if (slotIds.has(tool.slotId)) {
        return Result.fail<SetupTemplate>(`Duplicate tool slot ID: ${tool.slotId}`);
      }
      slotIds.add(tool.slotId);
    }

    // Validate orchestration rules reference valid slots
    for (const rule of props.orchestration || []) {
      if (rule.trigger.type === 'tool_event') {
        const config = rule.trigger as ToolEventTriggerConfig;
        if (!slotIds.has(config.sourceSlotId)) {
          return Result.fail<SetupTemplate>(
            `Rule "${rule.id}" references unknown slot: ${config.sourceSlotId}`,
          );
        }
      }

      for (const action of rule.actions) {
        if ('targetSlotId' in action && action.targetSlotId !== '_shared') {
          if (!slotIds.has(action.targetSlotId)) {
            return Result.fail<SetupTemplate>(
              `Rule "${rule.id}" action targets unknown slot: ${action.targetSlotId}`,
            );
          }
        }
        if ('sourceSlotId' in action && !slotIds.has(action.sourceSlotId)) {
          return Result.fail<SetupTemplate>(
            `Rule "${rule.id}" action references unknown source slot: ${action.sourceSlotId}`,
          );
        }
      }
    }

    if (!props.creatorId) {
      return Result.fail<SetupTemplate>('Creator ID is required');
    }

    const now = new Date();

    const template = new SetupTemplate({
      ...props,
      orchestration: props.orchestration || [],
      sharedDataSchema: props.sharedDataSchema || {},
      configFields: props.configFields || [],
      requiredCapabilities: props.requiredCapabilities || {},
      tags: props.tags || [],
      isFeatured: props.isFeatured ?? false,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
      deploymentCount: props.deploymentCount ?? 0,
    });

    return Result.ok<SetupTemplate>(template);
  }

  /**
   * Reconstitute from persistence (skip validation for trusted data)
   */
  static reconstitute(props: SetupTemplateProps): SetupTemplate {
    return new SetupTemplate(props);
  }
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Setup template list item DTO (for gallery browsing)
 */
export interface SetupTemplateListDTO {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SetupCategory;
  source: SetupSource;
  toolCount: number;
  ruleCount: number;
  tags: string[];
  isFeatured: boolean;
  deploymentCount: number;
  creatorName?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

/**
 * Setup template detail DTO
 */
export interface SetupTemplateDetailDTO extends SetupTemplateListDTO {
  tools: SetupToolSlot[];
  orchestration: OrchestrationRule[];
  sharedDataSchema: Record<string, unknown>;
  configFields: SetupConfigField[];
  requiredCapabilities: Partial<ToolCapabilities>;
  creatorId: string;
  campusId?: string;
  isSystem: boolean;
  updatedAt: string;
}

/**
 * Convert SetupTemplate entity to list DTO
 */
export function toSetupTemplateListDTO(template: SetupTemplate): SetupTemplateListDTO {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    category: template.category,
    source: template.source,
    toolCount: template.toolCount,
    ruleCount: template.ruleCount,
    tags: template.tags,
    isFeatured: template.isFeatured,
    deploymentCount: template.deploymentCount,
    creatorName: template.creatorName,
    thumbnailUrl: template.thumbnailUrl,
    createdAt: template.createdAt.toISOString(),
  };
}

/**
 * Convert SetupTemplate entity to detail DTO
 */
export function toSetupTemplateDetailDTO(template: SetupTemplate): SetupTemplateDetailDTO {
  return {
    ...toSetupTemplateListDTO(template),
    tools: template.tools,
    orchestration: template.orchestration,
    sharedDataSchema: template.sharedDataSchema,
    configFields: template.configFields,
    requiredCapabilities: template.requiredCapabilities,
    creatorId: template.creatorId,
    campusId: template.campusId,
    isSystem: template.isSystem,
    updatedAt: template.updatedAt.toISOString(),
  };
}
