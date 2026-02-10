/**
 * Automation Entity - HiveLab Phase 3
 *
 * Enables space leaders to set up automated workflows triggered by events.
 * Part of the Winter 2025 strategy to make HiveLab "invisible" - leaders
 * describe what they want, and it happens automatically.
 *
 * Trigger Types:
 * - member_join: When a new member joins the space
 * - event_reminder: X minutes before an event
 * - schedule: Cron-based scheduling
 * - keyword: When a keyword is detected in chat
 * - reaction_threshold: When a message gets N reactions
 *
 * Action Types:
 * - send_message: Post a message to a board
 * - create_component: Create poll/countdown/RSVP
 * - assign_role: Assign a role to members
 * - notify: Send a notification
 *
 * @author HIVE Platform Team
 * @version 1.0.0
 */

// ============================================================================
// TRIGGER TYPES
// ============================================================================

/**
 * Trigger when a new member joins the space
 */
export interface MemberJoinTrigger {
  type: 'member_join';
  config: {
    /** Only trigger for members with certain roles */
    forRoles?: string[];
    /** Delay before triggering (ms) */
    delayMs?: number;
  };
}

/**
 * Trigger before events start
 */
export interface EventReminderTrigger {
  type: 'event_reminder';
  config: {
    /** Minutes before event to trigger */
    beforeMinutes: number;
    /** Only for specific event types */
    eventTypes?: string[];
  };
}

/**
 * Trigger on a schedule (cron-like)
 */
export interface ScheduleTrigger {
  type: 'schedule';
  config: {
    /** Cron expression (simplified: daily, weekly, monthly) */
    frequency: 'daily' | 'weekly' | 'monthly';
    /** Time of day (HH:mm) */
    time: string;
    /** Day of week for weekly (0-6, Sunday = 0) */
    dayOfWeek?: number;
    /** Day of month for monthly (1-31) */
    dayOfMonth?: number;
    /** Timezone */
    timezone?: string;
  };
}

/**
 * Trigger when a keyword is detected in chat
 */
export interface KeywordTrigger {
  type: 'keyword';
  config: {
    /** Keywords to match (case-insensitive) */
    keywords: string[];
    /** Match whole word or substring */
    matchType: 'exact' | 'contains';
    /** Only in specific boards */
    boardIds?: string[];
    /** Cooldown between triggers (ms) */
    cooldownMs?: number;
  };
}

/**
 * Trigger when a message reaches a reaction threshold
 */
export interface ReactionThresholdTrigger {
  type: 'reaction_threshold';
  config: {
    /** Number of reactions needed */
    threshold: number;
    /** Specific reaction types (emoji) */
    reactions?: string[];
    /** Only in specific boards */
    boardIds?: string[];
  };
}

/**
 * Trigger when a deployed tool's shared state meets a condition.
 * Bridges space automations with the tool state system.
 */
export interface ToolStateChangeTrigger {
  type: 'tool_state_change';
  config: {
    /** Deployment ID of the tool to watch */
    deploymentId: string;
    /** Dot-path into shared state (e.g. 'counters.poll_001:total') */
    watchPath: string;
    /** Comparison operator */
    operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte';
    /** Threshold value to compare against */
    value: number | string;
  };
}

export type AutomationTrigger =
  | MemberJoinTrigger
  | EventReminderTrigger
  | ScheduleTrigger
  | KeywordTrigger
  | ReactionThresholdTrigger
  | ToolStateChangeTrigger;

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Send a message to a board
 */
export interface SendMessageAction {
  type: 'send_message';
  config: {
    /** Board to send to (or 'general' for default) */
    boardId: string;
    /** Message content (supports {variables}) */
    content: string;
    /** Optional: Send as DM instead */
    asDm?: boolean;
  };
}

/**
 * Create an inline component (poll, countdown, RSVP)
 */
export interface CreateComponentAction {
  type: 'create_component';
  config: {
    /** Board to create in */
    boardId: string;
    /** Component type */
    componentType: 'poll' | 'countdown' | 'rsvp' | 'announcement';
    /** Component-specific config */
    componentConfig: {
      // Poll
      question?: string;
      options?: string[];
      allowMultiple?: boolean;
      // Countdown
      title?: string;
      durationMinutes?: number;
      // RSVP
      eventTitle?: string;
      maxCapacity?: number;
      // Announcement
      message?: string;
      style?: 'info' | 'warning' | 'success';
    };
  };
}

/**
 * Assign a role to a member
 */
export interface AssignRoleAction {
  type: 'assign_role';
  config: {
    /** Role to assign */
    roleId: string;
    /** Target (triggering user or specific) */
    target: 'triggering_user' | 'specific';
    /** Specific user ID if target is 'specific' */
    userId?: string;
  };
}

/**
 * Send a notification
 */
export interface NotifyAction {
  type: 'notify';
  config: {
    /** Recipients */
    recipients: 'leaders' | 'all_members' | 'specific';
    /** Specific user IDs if recipients is 'specific' */
    userIds?: string[];
    /** Notification title */
    title: string;
    /** Notification body */
    body: string;
    /** Link to navigate to */
    link?: string;
  };
}

export type AutomationAction =
  | SendMessageAction
  | CreateComponentAction
  | AssignRoleAction
  | NotifyAction;

// ============================================================================
// AUTOMATION ENTITY
// ============================================================================

/**
 * Statistics for an automation
 */
export interface AutomationStats {
  /** Total times triggered */
  timesTriggered: number;
  /** Last trigger timestamp */
  lastTriggered?: Date;
  /** Times action completed successfully */
  successCount: number;
  /** Times action failed */
  failureCount: number;
}

/**
 * Automation entity properties
 */
export interface AutomationProps {
  id: string;
  spaceId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  /** Human-readable name */
  name: string;
  /** Optional description */
  description?: string;
  /** Whether the automation is active */
  enabled: boolean;

  /** What triggers the automation */
  trigger: AutomationTrigger;
  /** What action to perform */
  action: AutomationAction;

  /** Statistics */
  stats: AutomationStats;

  /** Creation source for analytics */
  creationSource?: 'chat_intent' | 'slash_command' | 'dashboard' | 'template';
  /** Original prompt if created via chat */
  creationPrompt?: string;
}

/**
 * Automation entity for space automations
 */
export class Automation {
  private constructor(private readonly props: AutomationProps) {}

  // ============================================================================
  // GETTERS
  // ============================================================================

  get id(): string { return this.props.id; }
  get spaceId(): string { return this.props.spaceId; }
  get createdBy(): string { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get enabled(): boolean { return this.props.enabled; }
  get trigger(): AutomationTrigger { return this.props.trigger; }
  get action(): AutomationAction { return this.props.action; }
  get stats(): AutomationStats { return { ...this.props.stats }; }
  get creationSource(): string | undefined { return this.props.creationSource; }
  get creationPrompt(): string | undefined { return this.props.creationPrompt; }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create a new automation
   */
  static create(params: {
    id: string;
    spaceId: string;
    createdBy: string;
    name: string;
    description?: string;
    trigger: AutomationTrigger;
    action: AutomationAction;
    creationSource?: AutomationProps['creationSource'];
    creationPrompt?: string;
  }): Automation {
    const now = new Date();
    return new Automation({
      id: params.id,
      spaceId: params.spaceId,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
      name: params.name,
      description: params.description,
      enabled: true, // Start enabled by default
      trigger: params.trigger,
      action: params.action,
      stats: {
        timesTriggered: 0,
        successCount: 0,
        failureCount: 0,
      },
      creationSource: params.creationSource,
      creationPrompt: params.creationPrompt,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: AutomationProps): Automation {
    return new Automation(props);
  }

  /**
   * Create a welcome message automation (common pattern)
   */
  static createWelcomeMessage(params: {
    id: string;
    spaceId: string;
    createdBy: string;
    message: string;
    boardId?: string;
  }): Automation {
    return Automation.create({
      id: params.id,
      spaceId: params.spaceId,
      createdBy: params.createdBy,
      name: 'Welcome Message',
      description: 'Automatically welcome new members when they join',
      trigger: {
        type: 'member_join',
        config: {},
      },
      action: {
        type: 'send_message',
        config: {
          boardId: params.boardId || 'general',
          content: params.message,
        },
      },
      creationSource: 'template',
    });
  }

  /**
   * Create an event reminder automation (common pattern)
   */
  static createEventReminder(params: {
    id: string;
    spaceId: string;
    createdBy: string;
    beforeMinutes: number;
    boardId?: string;
  }): Automation {
    return Automation.create({
      id: params.id,
      spaceId: params.spaceId,
      createdBy: params.createdBy,
      name: `Event Reminder (${params.beforeMinutes} min)`,
      description: `Remind members ${params.beforeMinutes} minutes before events`,
      trigger: {
        type: 'event_reminder',
        config: {
          beforeMinutes: params.beforeMinutes,
        },
      },
      action: {
        type: 'send_message',
        config: {
          boardId: params.boardId || 'general',
          content: '📅 Reminder: {event.title} starts in {trigger.beforeMinutes} minutes!',
        },
      },
      creationSource: 'template',
    });
  }

  // ============================================================================
  // DOMAIN METHODS
  // ============================================================================

  /**
   * Enable the automation
   */
  enable(): Automation {
    if (this.props.enabled) return this;
    return new Automation({
      ...this.props,
      enabled: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Disable the automation
   */
  disable(): Automation {
    if (!this.props.enabled) return this;
    return new Automation({
      ...this.props,
      enabled: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Toggle enabled state
   */
  toggle(): Automation {
    return new Automation({
      ...this.props,
      enabled: !this.props.enabled,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the automation name
   */
  rename(name: string): Automation {
    return new Automation({
      ...this.props,
      name,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the automation description
   */
  updateDescription(description: string): Automation {
    return new Automation({
      ...this.props,
      description,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the trigger configuration
   */
  updateTrigger(trigger: AutomationTrigger): Automation {
    return new Automation({
      ...this.props,
      trigger,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the action configuration
   */
  updateAction(action: AutomationAction): Automation {
    return new Automation({
      ...this.props,
      action,
      updatedAt: new Date(),
    });
  }

  /**
   * Record a trigger execution
   */
  recordTrigger(success: boolean): Automation {
    return new Automation({
      ...this.props,
      stats: {
        timesTriggered: this.props.stats.timesTriggered + 1,
        lastTriggered: new Date(),
        successCount: success
          ? this.props.stats.successCount + 1
          : this.props.stats.successCount,
        failureCount: success
          ? this.props.stats.failureCount
          : this.props.stats.failureCount + 1,
      },
      updatedAt: new Date(),
    });
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Check if the automation can be triggered
   */
  canTrigger(): boolean {
    return this.props.enabled;
  }

  /**
   * Validate the automation configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!this.props.name || this.props.name.length < 1) {
      errors.push('Name is required');
    }
    if (this.props.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }

    // Validate trigger
    if (!this.props.trigger || !this.props.trigger.type) {
      errors.push('Trigger is required');
    }

    // Validate action
    if (!this.props.action || !this.props.action.type) {
      errors.push('Action is required');
    }

    // Type-specific validation
    if (this.props.trigger.type === 'event_reminder') {
      const config = this.props.trigger.config;
      if (config.beforeMinutes < 1 || config.beforeMinutes > 10080) {
        errors.push('Event reminder must be between 1 minute and 1 week before');
      }
    }

    if (this.props.action.type === 'send_message') {
      const config = this.props.action.config;
      if (!config.content || config.content.length < 1) {
        errors.push('Message content is required');
      }
      if (config.content.length > 2000) {
        errors.push('Message content must be 2000 characters or less');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): AutomationProps {
    return { ...this.props };
  }

  /**
   * Convert to DTO for API responses
   */
  toDTO(): AutomationDTO {
    return {
      id: this.props.id,
      spaceId: this.props.spaceId,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      name: this.props.name,
      description: this.props.description,
      enabled: this.props.enabled,
      trigger: this.props.trigger,
      action: this.props.action,
      stats: {
        timesTriggered: this.props.stats.timesTriggered,
        lastTriggered: this.props.stats.lastTriggered?.toISOString(),
        successCount: this.props.stats.successCount,
        failureCount: this.props.stats.failureCount,
      },
    };
  }
}

// ============================================================================
// DTO TYPE
// ============================================================================

/**
 * Automation Data Transfer Object for API responses
 */
export interface AutomationDTO {
  id: string;
  spaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
  stats: {
    timesTriggered: number;
    lastTriggered?: string;
    successCount: number;
    failureCount: number;
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Context provided to automation execution
 */
export interface AutomationContext {
  /** The automation being executed */
  automation: Automation;
  /** Space ID */
  spaceId: string;
  /** Trigger-specific data */
  triggerData: {
    // member_join
    memberId?: string;
    memberName?: string;
    // event_reminder
    eventId?: string;
    eventTitle?: string;
    eventStartTime?: Date;
    // keyword
    messageId?: string;
    messageContent?: string;
    authorId?: string;
    // reaction_threshold
    reactionCount?: number;
    // tool_state_change
    deploymentId?: string;
    watchPath?: string;
    currentValue?: number | string;
  };
}

/**
 * Result of automation execution
 */
export interface AutomationResult {
  success: boolean;
  error?: string;
  /** Action-specific output */
  output?: {
    // send_message
    messageId?: string;
    // create_component
    componentId?: string;
    // assign_role
    assigned?: boolean;
    // notify
    notificationsSent?: number;
  };
}
