/**
 * Notification Generation Service
 *
 * Creates notifications when events occur across the platform.
 * Events: comments, likes, mentions, space membership, etc.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { deliverNotification } from '@/lib/notification-delivery-service';

// Notification types that can be generated
export type NotificationType =
  | 'comment'           // Someone commented on your post
  | 'comment_reply'     // Someone replied to your comment
  | 'like'              // Someone liked your post
  | 'mention'           // Someone mentioned you
  | 'space_invite'      // You were invited to a space
  | 'space_join'        // Someone joined your space (for leaders)
  | 'space_role_change' // Your role changed in a space
  | 'builder_approved'  // Your builder request was approved
  | 'builder_rejected'  // Your builder request was rejected
  | 'event_reminder'    // Event starting soon
  | 'event_rsvp'        // Someone RSVPd to your event
  | 'connection_new'    // New connection
  | 'tool_deployed'     // Tool was deployed to your space
  | 'system';           // System notification

// Notification categories for filtering
export type NotificationCategory =
  | 'social'       // Likes, comments, mentions
  | 'spaces'       // Space membership, invites
  | 'events'       // Event reminders, RSVPs
  | 'connections'  // New connections
  | 'tools'        // Tool deployments
  | 'system';      // System announcements

interface CreateNotificationParams {
  userId: string;              // Who receives the notification
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body?: string;
  actionUrl?: string;          // Where to navigate when clicked
  metadata?: {
    actorId?: string;          // Who triggered the notification
    actorName?: string;
    spaceId?: string;
    spaceName?: string;
    postId?: string;
    commentId?: string;
    eventId?: string;
    toolId?: string;
    [key: string]: unknown;
  };
}

interface NotificationPreferences {
  enabled: boolean;
  categories: {
    social: boolean;
    spaces: boolean;
    events: boolean;
    connections: boolean;
    tools: boolean;
    system: boolean;
  };
  quietHoursStart?: number; // Hour (0-23)
  quietHoursEnd?: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  categories: {
    social: true,
    spaces: true,
    events: true,
    connections: true,
    tools: true,
    system: true,
  },
};

/**
 * Get user's notification preferences
 */
async function getUserPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const userDoc = await dbAdmin.collection('users').doc(userId).get();
    if (!userDoc.exists) return DEFAULT_PREFERENCES;

    const userData = userDoc.data();
    return userData?.notificationPreferences || DEFAULT_PREFERENCES;
  } catch (error) {
    logger.error('Error getting notification preferences', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Check if notification should be sent based on preferences
 */
function shouldSendNotification(
  preferences: NotificationPreferences,
  category: NotificationCategory
): boolean {
  // Check if notifications are globally enabled
  if (!preferences.enabled) return false;

  // Check category-specific preference
  if (!preferences.categories[category]) return false;

  // Check quiet hours
  if (preferences.quietHoursStart !== undefined && preferences.quietHoursEnd !== undefined) {
    const now = new Date();
    const currentHour = now.getHours();

    if (preferences.quietHoursStart < preferences.quietHoursEnd) {
      // Normal range (e.g., 22-08 doesn't wrap)
      if (currentHour >= preferences.quietHoursStart && currentHour < preferences.quietHoursEnd) {
        return false;
      }
    } else {
      // Wrapped range (e.g., 22-08 wraps around midnight)
      if (currentHour >= preferences.quietHoursStart || currentHour < preferences.quietHoursEnd) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  const { userId, type, category, title, body, actionUrl, metadata } = params;

  try {
    // Don't notify users about their own actions
    if (metadata?.actorId === userId) {
      return null;
    }

    // Check user preferences
    const preferences = await getUserPreferences(userId);
    if (!shouldSendNotification(preferences, category)) {
      logger.debug('Notification blocked by preferences', { userId, type, category });
      return null;
    }

    // Check for duplicate notifications (same type/actor within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const existingQuery = await dbAdmin.collection('notifications')
      .where('userId', '==', userId)
      .where('type', '==', type)
      .where('metadata.actorId', '==', metadata?.actorId || '')
      .where('timestamp', '>=', oneHourAgo)
      .limit(1)
      .get();

    if (!existingQuery.empty && type !== 'system') {
      logger.debug('Duplicate notification prevented', { userId, type, actorId: metadata?.actorId });
      return null;
    }

    // Create the notification
    const notificationData = {
      userId,
      type,
      category,
      title,
      body: body || '',
      actionUrl: actionUrl || '',
      isRead: false,
      timestamp: new Date().toISOString(),
      campusId: CURRENT_CAMPUS_ID,
      metadata: metadata || {},
    };

    const docRef = await dbAdmin.collection('notifications').add(notificationData);

    logger.info('Notification created', {
      notificationId: docRef.id,
      userId,
      type,
      category
    });

    // Trigger delivery asynchronously (don't block)
    deliverNotification(docRef.id, notificationData, userId).catch(err => {
      logger.warn('Notification delivery failed', {
        notificationId: docRef.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return docRef.id;
  } catch (error) {
    logger.error('Error creating notification', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      type,
    });
    return null;
  }
}

/**
 * Create notifications for multiple users (e.g., space members)
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<number> {
  let created = 0;

  // Process in batches of 10 to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const promises = batch.map(userId =>
      createNotification({ ...params, userId })
    );

    const results = await Promise.all(promises);
    created += results.filter(Boolean).length;
  }

  return created;
}

// =============================================================================
// Convenience functions for specific notification types
// =============================================================================

/**
 * Notify post author about a new comment
 */
export async function notifyNewComment(params: {
  postAuthorId: string;
  commenterId: string;
  commenterName: string;
  postId: string;
  spaceId: string;
  spaceName: string;
  commentPreview: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.postAuthorId,
    type: 'comment',
    category: 'social',
    title: `${params.commenterName} commented on your post`,
    body: params.commentPreview.slice(0, 100) + (params.commentPreview.length > 100 ? '...' : ''),
    actionUrl: `/spaces/${params.spaceId}/posts/${params.postId}`,
    metadata: {
      actorId: params.commenterId,
      actorName: params.commenterName,
      postId: params.postId,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
    },
  });
}

/**
 * Notify comment author about a reply
 */
export async function notifyCommentReply(params: {
  originalCommentAuthorId: string;
  replierId: string;
  replierName: string;
  postId: string;
  commentId: string;
  spaceId: string;
  replyPreview: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.originalCommentAuthorId,
    type: 'comment_reply',
    category: 'social',
    title: `${params.replierName} replied to your comment`,
    body: params.replyPreview.slice(0, 100) + (params.replyPreview.length > 100 ? '...' : ''),
    actionUrl: `/spaces/${params.spaceId}/posts/${params.postId}#comment-${params.commentId}`,
    metadata: {
      actorId: params.replierId,
      actorName: params.replierName,
      postId: params.postId,
      commentId: params.commentId,
      spaceId: params.spaceId,
    },
  });
}

/**
 * Notify post author about a like
 */
export async function notifyPostLike(params: {
  postAuthorId: string;
  likerId: string;
  likerName: string;
  postId: string;
  spaceId: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.postAuthorId,
    type: 'like',
    category: 'social',
    title: `${params.likerName} liked your post`,
    actionUrl: `/spaces/${params.spaceId}/posts/${params.postId}`,
    metadata: {
      actorId: params.likerId,
      actorName: params.likerName,
      postId: params.postId,
      spaceId: params.spaceId,
    },
  });
}

/**
 * Notify user about a mention
 */
export async function notifyMention(params: {
  mentionedUserId: string;
  mentionerId: string;
  mentionerName: string;
  contextType: 'post' | 'comment';
  contextId: string;
  spaceId: string;
  contextPreview: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.mentionedUserId,
    type: 'mention',
    category: 'social',
    title: `${params.mentionerName} mentioned you`,
    body: params.contextPreview.slice(0, 100) + (params.contextPreview.length > 100 ? '...' : ''),
    actionUrl: `/spaces/${params.spaceId}/${params.contextType}s/${params.contextId}`,
    metadata: {
      actorId: params.mentionerId,
      actorName: params.mentionerName,
      contextType: params.contextType,
      contextId: params.contextId,
      spaceId: params.spaceId,
    },
  });
}

/**
 * Notify user about space invite
 */
export async function notifySpaceInvite(params: {
  invitedUserId: string;
  inviterId: string;
  inviterName: string;
  spaceId: string;
  spaceName: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.invitedUserId,
    type: 'space_invite',
    category: 'spaces',
    title: `${params.inviterName} invited you to ${params.spaceName}`,
    body: 'Click to view the space and accept the invite',
    actionUrl: `/spaces/${params.spaceId}`,
    metadata: {
      actorId: params.inviterId,
      actorName: params.inviterName,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
    },
  });
}

/**
 * Notify space leader about new member
 */
export async function notifySpaceJoin(params: {
  leaderUserId: string;
  newMemberId: string;
  newMemberName: string;
  spaceId: string;
  spaceName: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.leaderUserId,
    type: 'space_join',
    category: 'spaces',
    title: `${params.newMemberName} joined ${params.spaceName}`,
    actionUrl: `/spaces/${params.spaceId}/members`,
    metadata: {
      actorId: params.newMemberId,
      actorName: params.newMemberName,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
    },
  });
}

/**
 * Notify user about role change in space
 */
export async function notifyRoleChange(params: {
  userId: string;
  changerId: string;
  changerName: string;
  spaceId: string;
  spaceName: string;
  newRole: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.userId,
    type: 'space_role_change',
    category: 'spaces',
    title: `Your role in ${params.spaceName} changed to ${params.newRole}`,
    body: `Changed by ${params.changerName}`,
    actionUrl: `/spaces/${params.spaceId}`,
    metadata: {
      actorId: params.changerId,
      actorName: params.changerName,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
      newRole: params.newRole,
    },
  });
}

/**
 * Notify user about builder request approval
 */
export async function notifyBuilderApproved(params: {
  userId: string;
  adminId: string;
  adminName: string;
  spaceId: string;
  spaceName: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.userId,
    type: 'builder_approved',
    category: 'spaces',
    title: `You're now a leader of ${params.spaceName}!`,
    body: 'Your builder request has been approved',
    actionUrl: `/spaces/${params.spaceId}`,
    metadata: {
      actorId: params.adminId,
      actorName: params.adminName,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
    },
  });
}

/**
 * Notify user about builder request rejection
 */
export async function notifyBuilderRejected(params: {
  userId: string;
  adminId: string;
  adminName: string;
  spaceId: string;
  spaceName: string;
  reason?: string;
}): Promise<string | null> {
  return createNotification({
    userId: params.userId,
    type: 'builder_rejected',
    category: 'spaces',
    title: `Builder request for ${params.spaceName} was not approved`,
    body: params.reason || 'Contact support for more information',
    actionUrl: `/spaces/${params.spaceId}`,
    metadata: {
      actorId: params.adminId,
      actorName: params.adminName,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
      reason: params.reason,
    },
  });
}

/**
 * Notify user about event RSVP (for event organizers)
 */
export async function notifyEventRsvp(params: {
  organizerId: string;
  attendeeId: string;
  attendeeName: string;
  eventId: string;
  eventTitle: string;
  spaceId: string;
  rsvpStatus: 'going' | 'interested' | 'not_going';
}): Promise<string | null> {
  if (params.rsvpStatus === 'not_going') return null;

  return createNotification({
    userId: params.organizerId,
    type: 'event_rsvp',
    category: 'events',
    title: `${params.attendeeName} is ${params.rsvpStatus === 'going' ? 'attending' : 'interested in'} ${params.eventTitle}`,
    actionUrl: `/spaces/${params.spaceId}/events/${params.eventId}`,
    metadata: {
      actorId: params.attendeeId,
      actorName: params.attendeeName,
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      spaceId: params.spaceId,
      rsvpStatus: params.rsvpStatus,
    },
  });
}

/**
 * Notify user about new connection
 */
export async function notifyNewConnection(params: {
  userId: string;
  connectionId: string;
  connectionName: string;
  connectionHandle: string;
  reason: string; // e.g., "You're both in Computer Science Club"
}): Promise<string | null> {
  return createNotification({
    userId: params.userId,
    type: 'connection_new',
    category: 'connections',
    title: `You connected with ${params.connectionName}`,
    body: params.reason,
    actionUrl: `/user/${params.connectionHandle}`,
    metadata: {
      actorId: params.connectionId,
      actorName: params.connectionName,
      connectionHandle: params.connectionHandle,
      reason: params.reason,
    },
  });
}

/**
 * Notify space members about tool deployment
 */
export async function notifyToolDeployment(params: {
  memberIds: string[];
  deployerId: string;
  deployerName: string;
  toolId: string;
  toolName: string;
  spaceId: string;
  spaceName: string;
}): Promise<number> {
  const notificationParams: Omit<CreateNotificationParams, 'userId'> = {
    type: 'tool_deployed',
    category: 'tools',
    title: `New tool in ${params.spaceName}: ${params.toolName}`,
    body: `Deployed by ${params.deployerName}`,
    actionUrl: `/spaces/${params.spaceId}?tool=${params.toolId}`,
    metadata: {
      actorId: params.deployerId,
      actorName: params.deployerName,
      toolId: params.toolId,
      toolName: params.toolName,
      spaceId: params.spaceId,
      spaceName: params.spaceName,
    },
  };

  // Don't notify the deployer
  const recipientIds = params.memberIds.filter(id => id !== params.deployerId);
  return createBulkNotifications(recipientIds, notificationParams);
}

/**
 * Send a system notification to specific users
 */
export async function sendSystemNotification(params: {
  userIds: string[];
  title: string;
  body: string;
  actionUrl?: string;
}): Promise<number> {
  const notificationParams: Omit<CreateNotificationParams, 'userId'> = {
    type: 'system',
    category: 'system',
    title: params.title,
    body: params.body,
    actionUrl: params.actionUrl,
  };

  return createBulkNotifications(params.userIds, notificationParams);
}
