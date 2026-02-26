/**
 * Inngest Client
 *
 * Event-driven automation engine for HiveLab.
 * Handles tool automations, notification delivery, and scheduled tasks.
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'hive',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ============================================================================
// Event Types
// ============================================================================

export type HiveEvents = {
  // Tool state changes (fired from /api/tools/execute)
  'tool/action.executed': {
    data: {
      toolId: string;
      deploymentId: string;
      elementId: string;
      action: string;
      userId: string;
      spaceId?: string;
      campusId: string;
      sharedStateUpdate?: Record<string, unknown>;
      userStateUpdate?: Record<string, unknown>;
    };
  };

  // Tool deployed to a space
  'tool/deployed': {
    data: {
      toolId: string;
      toolName: string;
      spaceId: string;
      spaceName: string;
      deployedByUserId: string;
      deployedByName?: string;
      campusId: string;
      memberIds: string[];
    };
  };

  // Notification delivery (durable, retryable)
  'notification/deliver': {
    data: {
      notificationId: string;
      userId: string;
      title: string;
      body: string;
      category: string;
      actionUrl?: string;
    };
  };

  // Scheduled automation trigger
  'automation/scheduled': {
    data: {
      automationId: string;
      deploymentId: string;
      toolId: string;
      spaceId?: string;
      campusId: string;
    };
  };

  // Threshold automation check
  'automation/threshold.check': {
    data: {
      automationId: string;
      deploymentId: string;
      toolId: string;
      path: string;
      operator: string;
      value: number;
      currentValue: number;
      campusId: string;
    };
  };
};
