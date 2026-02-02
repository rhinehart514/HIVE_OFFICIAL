/**
 * Automation Executor Service
 *
 * Executes automations when their triggers fire.
 * This is the "brain" that makes automations actually work.
 *
 * Flow:
 * 1. Trigger event happens (member joins, event reminder, etc.)
 * 2. Find matching automations for the space
 * 3. Execute each automation's action
 * 4. Record success/failure for analytics
 *
 * @author HIVE Platform Team
 * @version 1.0.0
 */

import {
  Automation,
  type AutomationTrigger,
  type AutomationAction,
  type AutomationContext,
  type AutomationResult,
} from '../../domain/hivelab/entities/automation';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Trigger event data passed to the executor
 */
export interface TriggerEvent {
  type: AutomationTrigger['type'];
  spaceId: string;
  campusId: string;
  data: {
    // member_join
    memberId?: string;
    memberName?: string;
    memberAvatarUrl?: string;
    // event_reminder
    eventId?: string;
    eventTitle?: string;
    eventStartTime?: Date;
    // keyword
    messageId?: string;
    messageContent?: string;
    authorId?: string;
    boardId?: string;
    // reaction_threshold
    reactionCount?: number;
    reactionType?: string;
  };
}

/**
 * Callbacks for executing actions (injected by the caller)
 */
export interface ActionExecutors {
  sendMessage: (params: {
    spaceId: string;
    boardId: string;
    content: string;
    systemMessage?: boolean;
  }) => Promise<{ messageId: string }>;

  createComponent: (params: {
    spaceId: string;
    boardId: string;
    componentType: string;
    config: Record<string, unknown>;
  }) => Promise<{ componentId: string }>;

  assignRole?: (params: {
    spaceId: string;
    userId: string;
    roleId: string;
  }) => Promise<{ success: boolean }>;

  sendNotification?: (params: {
    userIds: string[];
    title: string;
    body: string;
    link?: string;
  }) => Promise<{ sent: number }>;

  /** Resolve space members by role - returns array of user IDs */
  resolveSpaceMembers?: (params: {
    spaceId: string;
    /** 'leaders' for admins/moderators, 'all' for all active members */
    filter: 'leaders' | 'all';
  }) => Promise<{ userIds: string[] }>;
}

/**
 * Repository interface for fetching automations
 */
export interface AutomationRepository {
  findBySpaceAndTrigger(
    spaceId: string,
    triggerType: AutomationTrigger['type']
  ): Promise<Automation[]>;

  recordExecution(
    automationId: string,
    success: boolean
  ): Promise<void>;
}

// ============================================================================
// SERVICE
// ============================================================================

export class AutomationExecutorService {
  constructor(
    private readonly repository: AutomationRepository,
    private readonly executors: ActionExecutors
  ) {}

  /**
   * Process a trigger event and execute matching automations
   */
  async processTrigger(event: TriggerEvent): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];

    // Find automations that match this trigger
    const automations = await this.repository.findBySpaceAndTrigger(
      event.spaceId,
      event.type
    );

    // Filter to only enabled automations
    const activeAutomations = automations.filter(a => a.enabled);

    if (activeAutomations.length === 0) {
      return results;
    }

    // Execute each automation
    for (const automation of activeAutomations) {
      const context: AutomationContext = {
        automation,
        spaceId: event.spaceId,
        triggerData: event.data,
      };

      try {
        const result = await this.executeAutomation(automation, context);
        results.push(result);

        // Record success/failure
        await this.repository.recordExecution(automation.id, result.success);
      } catch (error) {
        const errorResult: AutomationResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.push(errorResult);
        await this.repository.recordExecution(automation.id, false);
      }
    }

    return results;
  }

  /**
   * Execute a single automation
   */
  private async executeAutomation(
    automation: Automation,
    context: AutomationContext
  ): Promise<AutomationResult> {
    const action = automation.action;

    switch (action.type) {
      case 'send_message':
        return this.executeSendMessage(action, context);

      case 'create_component':
        return this.executeCreateComponent(action, context);

      case 'assign_role':
        return this.executeAssignRole(action, context);

      case 'notify':
        return this.executeNotify(action, context);

      default:
        return {
          success: false,
          error: `Unknown action type: ${(action as { type: string }).type}`,
        };
    }
  }

  /**
   * Execute send_message action
   */
  private async executeSendMessage(
    action: AutomationAction & { type: 'send_message' },
    context: AutomationContext
  ): Promise<AutomationResult> {
    // Interpolate variables in the message content
    const content = this.interpolateContent(action.config.content, context);

    const result = await this.executors.sendMessage({
      spaceId: context.spaceId,
      boardId: action.config.boardId,
      content,
      systemMessage: true, // Mark as automation-generated
    });

    return {
      success: true,
      output: { messageId: result.messageId },
    };
  }

  /**
   * Execute create_component action
   */
  private async executeCreateComponent(
    action: AutomationAction & { type: 'create_component' },
    context: AutomationContext
  ): Promise<AutomationResult> {
    // Interpolate any string values in the config
    const interpolatedConfig = this.interpolateObject(
      action.config.componentConfig,
      context
    );

    const result = await this.executors.createComponent({
      spaceId: context.spaceId,
      boardId: action.config.boardId,
      componentType: action.config.componentType,
      config: interpolatedConfig,
    });

    return {
      success: true,
      output: { componentId: result.componentId },
    };
  }

  /**
   * Execute assign_role action
   */
  private async executeAssignRole(
    action: AutomationAction & { type: 'assign_role' },
    context: AutomationContext
  ): Promise<AutomationResult> {
    if (!this.executors.assignRole) {
      return { success: false, error: 'Role assignment not available' };
    }

    // Determine target user
    let targetUserId: string;
    if (action.config.target === 'triggering_user') {
      if (!context.triggerData.memberId && !context.triggerData.authorId) {
        return { success: false, error: 'No triggering user found' };
      }
      targetUserId = context.triggerData.memberId || context.triggerData.authorId!;
    } else {
      if (!action.config.userId) {
        return { success: false, error: 'No target user specified' };
      }
      targetUserId = action.config.userId;
    }

    const result = await this.executors.assignRole({
      spaceId: context.spaceId,
      userId: targetUserId,
      roleId: action.config.roleId,
    });

    return {
      success: result.success,
      output: { assigned: result.success },
    };
  }

  /**
   * Execute notify action
   */
  private async executeNotify(
    action: AutomationAction & { type: 'notify' },
    context: AutomationContext
  ): Promise<AutomationResult> {
    if (!this.executors.sendNotification) {
      return { success: false, error: 'Notifications not available' };
    }

    // Determine recipients
    let userIds: string[] = [];
    const recipients = action.config.recipients;

    if (recipients === 'specific' && action.config.userIds) {
      userIds = action.config.userIds;
    } else if (recipients === 'leaders' || recipients === 'all_members') {
      // Resolve members from space
      if (!this.executors.resolveSpaceMembers) {
        return { success: false, error: 'Member resolution not available' };
      }

      const filter = recipients === 'leaders' ? 'leaders' : 'all';
      const resolved = await this.executors.resolveSpaceMembers({
        spaceId: context.spaceId,
        filter,
      });
      userIds = resolved.userIds;

      if (userIds.length === 0) {
        return { success: true, output: { notificationsSent: 0 } };
      }
    } else {
      return { success: false, error: `Unknown recipient type: ${recipients}` };
    }

    const result = await this.executors.sendNotification({
      userIds,
      title: this.interpolateContent(action.config.title, context),
      body: this.interpolateContent(action.config.body, context),
      link: action.config.link,
    });

    return {
      success: true,
      output: { notificationsSent: result.sent },
    };
  }

  /**
   * Interpolate variables in content string
   * Supports: {member}, {member.name}, {event.title}, {trigger.beforeMinutes}
   */
  private interpolateContent(content: string, context: AutomationContext): string {
    return content
      // Member variables
      .replace(/\{member\}/g, context.triggerData.memberName || 'Member')
      .replace(/\{member\.name\}/g, context.triggerData.memberName || 'Member')
      .replace(/\{member\.id\}/g, context.triggerData.memberId || '')
      // Event variables
      .replace(/\{event\}/g, context.triggerData.eventTitle || 'Event')
      .replace(/\{event\.title\}/g, context.triggerData.eventTitle || 'Event')
      .replace(/\{event\.id\}/g, context.triggerData.eventId || '')
      // Trigger config variables
      .replace(/\{trigger\.beforeMinutes\}/g, String(
        (context.automation.trigger as { config?: { beforeMinutes?: number } })?.config?.beforeMinutes || ''
      ))
      // Message variables
      .replace(/\{message\}/g, context.triggerData.messageContent || '')
      .replace(/\{message\.content\}/g, context.triggerData.messageContent || '');
  }

  /**
   * Interpolate variables in an object (recursively for strings)
   */
  private interpolateObject(
    obj: Record<string, unknown>,
    context: AutomationContext
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateContent(value, context);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.interpolateObject(value as Record<string, unknown>, context);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create an automation executor with the given dependencies
 */
export function createAutomationExecutor(
  repository: AutomationRepository,
  executors: ActionExecutors
): AutomationExecutorService {
  return new AutomationExecutorService(repository, executors);
}
