/**
 * Automation Action Executors
 *
 * Sprint 4: Automations
 *
 * Implements the actual logic for executing automation actions:
 * - notify: Send email (Resend) or push notification (FCM)
 * - mutate: Update tool state in Firestore
 * - triggerTool: Trigger another tool's automation
 */

import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import type {
  ToolAutomationAction,
  NotifyEmailAction,
  NotifyPushAction,
  MutateAction,
  TriggerToolAction,
  ToolSharedState,
} from '../types';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// ACTION RESULT TYPES
// ============================================================================

export interface ActionResult {
  success: boolean;
  actionType: string;
  output?: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// EMAIL ACTION (via Resend)
// ============================================================================

async function executeEmailNotify(
  action: NotifyEmailAction,
  context: ExecutionContext
): Promise<ActionResult> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY not configured, skipping email');
    return {
      success: false,
      actionType: 'notify:email',
      error: 'Email service not configured',
    };
  }

  try {
    // Resolve recipients based on 'to' field
    const recipients = await resolveRecipients(action.to, action.roleName, context);

    if (recipients.length === 0) {
      return {
        success: false,
        actionType: 'notify:email',
        error: 'No recipients found',
      };
    }

    // Interpolate subject and body
    const subject = interpolateTemplate(action.subject || 'HIVE Notification', context);
    const body = interpolateTemplate(action.body || '', context);

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HIVE <notifications@hive.campus>',
        to: recipients,
        subject,
        html: body,
        tags: [
          { name: 'automation_id', value: context.automationId },
          { name: 'deployment_id', value: context.deploymentId },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as { id?: string };

    logger.info('Email notification sent', {
      automationId: context.automationId,
      recipients: recipients.length,
      messageId: result.id || 'unknown',
    });

    return {
      success: true,
      actionType: 'notify:email',
      output: {
        emailId: result.id || 'unknown',
        recipientCount: recipients.length,
      },
    };
  } catch (error) {
    logger.error('Email notification failed', {
      error: error instanceof Error ? error.message : String(error),
      automationId: context.automationId,
    });

    return {
      success: false,
      actionType: 'notify:email',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// PUSH NOTIFICATION ACTION (via FCM)
// ============================================================================

async function executePushNotify(
  action: NotifyPushAction,
  context: ExecutionContext
): Promise<ActionResult> {
  try {
    // Resolve recipients
    const userIds = await resolveRecipientUserIds(action.to, action.roleName, context);

    if (userIds.length === 0) {
      return {
        success: false,
        actionType: 'notify:push',
        error: 'No recipients found',
      };
    }

    // Fetch FCM tokens for users
    const tokensSnapshot = await db
      .collection('userFcmTokens')
      .where('userId', 'in', userIds.slice(0, 10)) // Firestore 'in' limit
      .get();

    const tokens = tokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(Boolean);

    if (tokens.length === 0) {
      return {
        success: false,
        actionType: 'notify:push',
        error: 'No FCM tokens found for recipients',
      };
    }

    // Interpolate title and body
    const title = interpolateTemplate(action.title, context);
    const body = interpolateTemplate(action.body, context);

    // Send via FCM
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        automationId: context.automationId,
        deploymentId: context.deploymentId,
        link: action.link || '',
      },
    });

    logger.info('Push notification sent', {
      automationId: context.automationId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    return {
      success: response.successCount > 0,
      actionType: 'notify:push',
      output: {
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    };
  } catch (error) {
    logger.error('Push notification failed', {
      error: error instanceof Error ? error.message : String(error),
      automationId: context.automationId,
    });

    return {
      success: false,
      actionType: 'notify:push',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MUTATE ACTION
// ============================================================================

async function executeMutate(
  action: MutateAction,
  context: ExecutionContext
): Promise<ActionResult> {
  try {
    const stateRef = db
      .collection('deployedTools')
      .doc(context.deploymentId)
      .collection('sharedState')
      .doc('current');

    // Get current state
    const stateDoc = await stateRef.get();
    const currentState = stateDoc.exists
      ? (stateDoc.data() as ToolSharedState)
      : {
          counters: {},
          collections: {},
          timeline: [],
          computed: {},
          version: 0,
          lastModified: new Date().toISOString(),
        };

    // Apply mutation
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(action.mutation)) {
      // Handle special mutation operators
      if (typeof value === 'object' && value !== null) {
        const op = value as { $increment?: number; $set?: unknown; $push?: unknown };

        if ('$increment' in op && typeof op.$increment === 'number') {
          // Increment counter
          const currentValue = getNestedValue(currentState, key) as number || 0;
          setNestedValue(updates, key, currentValue + op.$increment);
        } else if ('$set' in op) {
          // Set value directly
          setNestedValue(updates, key, op.$set);
        } else if ('$push' in op) {
          // Push to array
          const currentArray = (getNestedValue(currentState, key) as unknown[]) || [];
          setNestedValue(updates, key, [...currentArray, op.$push]);
        } else {
          // Plain object value
          setNestedValue(updates, key, value);
        }
      } else {
        // Plain value
        setNestedValue(updates, key, value);
      }
    }

    // Merge updates with current state
    const newState = deepMerge(currentState, updates);
    newState.version = (currentState.version || 0) + 1;
    newState.lastModified = new Date().toISOString();

    // Write to Firestore
    await stateRef.set(newState);

    logger.info('State mutated', {
      automationId: context.automationId,
      deploymentId: context.deploymentId,
      mutations: Object.keys(action.mutation),
    });

    return {
      success: true,
      actionType: 'mutate',
      output: {
        version: newState.version,
        mutatedKeys: Object.keys(action.mutation),
      },
    };
  } catch (error) {
    logger.error('Mutation failed', {
      error: error instanceof Error ? error.message : String(error),
      automationId: context.automationId,
    });

    return {
      success: false,
      actionType: 'mutate',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRIGGER TOOL ACTION
// ============================================================================

async function executeTriggerTool(
  action: TriggerToolAction,
  context: ExecutionContext
): Promise<ActionResult> {
  try {
    // Emit event to the target tool's event queue
    // This allows the target tool's automations to pick it up
    const eventRef = db
      .collection('deployedTools')
      .doc(action.deploymentId)
      .collection('events')
      .doc();

    await eventRef.set({
      id: eventRef.id,
      event: action.event,
      data: action.data || {},
      source: {
        type: 'automation',
        automationId: context.automationId,
        deploymentId: context.deploymentId,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: false,
    });

    logger.info('Tool event triggered', {
      automationId: context.automationId,
      targetDeploymentId: action.deploymentId,
      event: action.event,
    });

    return {
      success: true,
      actionType: 'triggerTool',
      output: {
        eventId: eventRef.id,
        targetDeploymentId: action.deploymentId,
        event: action.event,
      },
    };
  } catch (error) {
    logger.error('Trigger tool failed', {
      error: error instanceof Error ? error.message : String(error),
      automationId: context.automationId,
    });

    return {
      success: false,
      actionType: 'triggerTool',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

export interface ExecutionContext {
  automationId: string;
  deploymentId: string;
  state: ToolSharedState | null;
  triggerData?: Record<string, unknown>;
}

export async function executeAction(
  action: ToolAutomationAction,
  context: ExecutionContext
): Promise<ActionResult> {
  switch (action.type) {
    case 'notify':
      if (action.channel === 'email') {
        return executeEmailNotify(action as NotifyEmailAction, context);
      } else if (action.channel === 'push') {
        return executePushNotify(action as NotifyPushAction, context);
      }
      return {
        success: false,
        actionType: 'notify',
        error: `Unknown notification channel: ${(action as { channel: string }).channel}`,
      };

    case 'mutate':
      return executeMutate(action, context);

    case 'triggerTool':
      return executeTriggerTool(action, context);

    default:
      return {
        success: false,
        actionType: 'unknown',
        error: `Unknown action type: ${(action as { type: string }).type}`,
      };
  }
}

export async function executeAllActions(
  actions: ToolAutomationAction[],
  context: ExecutionContext
): Promise<{ success: boolean; results: ActionResult[] }> {
  const results: ActionResult[] = [];
  let allSuccessful = true;

  for (const action of actions) {
    const result = await executeAction(action, context);
    results.push(result);

    if (!result.success) {
      allSuccessful = false;
      // Continue executing remaining actions even if one fails
      logger.warn('Action failed, continuing with remaining actions', {
        actionType: action.type,
        error: result.error,
      });
    }
  }

  return {
    success: allSuccessful,
    results,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function resolveRecipients(
  to: string,
  roleName: string | undefined,
  context: ExecutionContext
): Promise<string[]> {
  // 'user' - single user triggering the automation
  if (to === 'user') {
    const userId = context.triggerData?.userId as string | undefined;
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      const email = userDoc.data()?.email;
      return email ? [email] : [];
    }
    return [];
  }

  // 'role' - members with a specific role
  if (to === 'role' && roleName) {
    return resolveRoleMembers(roleName, context);
  }

  // 'all' - all members (dangerous, limit this)
  if (to === 'all') {
    logger.warn('Sending to all members is rate-limited');
    // In production, this would fetch from space membership
    return [];
  }

  // Direct email address
  if (to.includes('@')) {
    return [to];
  }

  return [];
}

async function resolveRecipientUserIds(
  to: string,
  roleName: string | undefined,
  context: ExecutionContext
): Promise<string[]> {
  if (to === 'user') {
    const userId = context.triggerData?.userId as string | undefined;
    return userId ? [userId] : [];
  }

  if (to === 'role' && roleName) {
    // Query space membership by role to get user IDs
    return resolveRoleMemberIds(roleName, context);
  }

  return [];
}

/**
 * Resolve user IDs for members with a specific role in the deployment's space.
 * Used for push notifications where we need user IDs to look up FCM tokens.
 */
async function resolveRoleMemberIds(
  roleName: string,
  context: ExecutionContext
): Promise<string[]> {
  try {
    // Get the deployment to find the space ID
    const deploymentDoc = await db.collection('deployedTools').doc(context.deploymentId).get();
    if (!deploymentDoc.exists) {
      logger.warn('Deployment not found for role resolution', { deploymentId: context.deploymentId });
      return [];
    }

    const deploymentData = deploymentDoc.data();
    const spaceId = deploymentData?.spaceId ||
      (deploymentData?.deployedTo === 'space' ? deploymentData?.targetId : null);

    if (!spaceId) {
      logger.warn('No space ID found for role resolution', { deploymentId: context.deploymentId });
      return [];
    }

    // Query space members with the specified role
    const membersSnapshot = await db
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('role', '==', roleName)
      .where('isActive', '==', true)
      .limit(100) // Safety limit
      .get();

    if (membersSnapshot.empty) {
      logger.info('No members found with role', { spaceId, roleName });
      return [];
    }

    const userIds = membersSnapshot.docs
      .map(doc => doc.data().userId as string)
      .filter(Boolean);

    logger.info('Resolved role member IDs', {
      spaceId,
      roleName,
      count: userIds.length,
    });

    return userIds;
  } catch (error) {
    logger.error('Failed to resolve role member IDs', {
      error: error instanceof Error ? error.message : String(error),
      roleName,
      deploymentId: context.deploymentId,
    });
    return [];
  }
}

/**
 * Resolve email addresses for members with a specific role in the deployment's space.
 * Used for email notifications where we need actual email addresses.
 */
async function resolveRoleMembers(
  roleName: string,
  context: ExecutionContext
): Promise<string[]> {
  try {
    // First get the user IDs for the role
    const userIds = await resolveRoleMemberIds(roleName, context);

    if (userIds.length === 0) {
      return [];
    }

    // Fetch user emails - batch in chunks of 10 (Firestore 'in' limit)
    const emails: string[] = [];
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 10) {
      chunks.push(userIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const usersSnapshot = await db
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      for (const userDoc of usersSnapshot.docs) {
        const email = userDoc.data()?.email as string | undefined;
        if (email) {
          emails.push(email);
        }
      }
    }

    logger.info('Resolved role member emails', {
      roleName,
      userCount: userIds.length,
      emailCount: emails.length,
    });

    return emails;
  } catch (error) {
    logger.error('Failed to resolve role member emails', {
      error: error instanceof Error ? error.message : String(error),
      roleName,
      deploymentId: context.deploymentId,
    });
    return [];
  }
}

function interpolateTemplate(template: string, context: ExecutionContext): string {
  let result = template;

  // Replace state variables
  if (context.state) {
    result = result.replace(/\{\{state\.(.+?)\}\}/g, (_, path) => {
      const value = getNestedValue(context.state, path);
      return value !== undefined ? String(value) : '';
    });
  }

  // Replace trigger data variables
  if (context.triggerData) {
    result = result.replace(/\{\{trigger\.(.+?)\}\}/g, (_, path) => {
      const value = getNestedValue(context.triggerData, path);
      return value !== undefined ? String(value) : '';
    });
  }

  // Replace date/time variables
  const now = new Date();
  result = result.replace(/\{\{now\}\}/g, now.toISOString());
  result = result.replace(/\{\{today\}\}/g, now.toLocaleDateString());

  return result;
}

function getNestedValue(obj: unknown, path: string): unknown {
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

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

function deepMerge(target: ToolSharedState, source: Record<string, unknown>): ToolSharedState {
  const result: ToolSharedState = {
    counters: { ...target.counters },
    collections: { ...target.collections },
    timeline: [...target.timeline],
    computed: { ...target.computed },
    version: target.version,
    lastModified: target.lastModified,
  };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const typedKey = key as keyof ToolSharedState;

    if (typedKey === 'counters' && typeof sourceValue === 'object' && sourceValue !== null) {
      result.counters = { ...result.counters, ...(sourceValue as Record<string, number>) };
    } else if (typedKey === 'collections' && typeof sourceValue === 'object' && sourceValue !== null) {
      result.collections = { ...result.collections, ...(sourceValue as Record<string, Record<string, unknown>>) };
    } else if (typedKey === 'computed' && typeof sourceValue === 'object' && sourceValue !== null) {
      result.computed = { ...result.computed, ...(sourceValue as Record<string, unknown>) };
    } else if (typedKey === 'timeline' && Array.isArray(sourceValue)) {
      result.timeline = sourceValue as typeof result.timeline;
    } else if (typedKey === 'version' && typeof sourceValue === 'number') {
      result.version = sourceValue;
    } else if (typedKey === 'lastModified' && typeof sourceValue === 'string') {
      result.lastModified = sourceValue;
    }
  }

  return result;
}
