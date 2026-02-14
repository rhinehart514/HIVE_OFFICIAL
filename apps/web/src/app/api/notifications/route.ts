import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { withCache } from '../../../lib/cache-headers';

// Zod schemas for notification actions
const NotificationActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('mark_read'),
    notificationIds: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  }),
  z.object({
    action: z.literal('mark_all_read'),
  }),
  z.object({
    action: z.literal('delete'),
    notificationIds: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  }),
]);

const NotificationUpdateSchema = z.object({
  notificationId: z.string().min(1, 'Notification ID is required'),
  isRead: z.boolean(),
});

// Local type definition for notifications
interface HiveNotification {
  id: string;
  userId: string;
  title: string;
  body?: string;
  type: string;
  category: string;
  isRead: boolean;
  readAt?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string; // Deep link URL for navigation
}

// Real notification fetching from Firebase
async function getUserNotifications(
  userId: string,
  limit: number,
  unreadOnly: boolean,
  category?: string
): Promise<{ notifications: HiveNotification[], unreadCount: number }> {
  try {
    let query = dbAdmin.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc');

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    if (unreadOnly) {
      query = query.where('isRead', '==', false);
    }

    const snapshot = await query.limit(limit).get();
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as HiveNotification[];

    // Get unread count separately
    const unreadSnapshot = await dbAdmin.collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .count()
      .get();
    
    const unreadCount = unreadSnapshot.data().count;

    return { notifications, unreadCount };
  } catch (error) {
    logger.error('Error fetching user notifications', { error: { error: error instanceof Error ? error.message : String(error) }, userId });
    return { notifications: [], unreadCount: 0 };
  }
}

const _GET = withAuthAndErrors(async (request: AuthenticatedRequest, _context, respond) => {
  const userId = getUserId(request);
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const unreadOnly = searchParams.get('unread') === 'true';
  const category = searchParams.get('category') || undefined;

  const { notifications, unreadCount } = await getUserNotifications(
    userId,
    limit,
    unreadOnly,
    category
  );

  return respond.success({
    notifications,
    unreadCount,
    hasMore: notifications.length === limit
  });
});

export const POST = withAuthAndErrors(async (request: AuthenticatedRequest, _context, respond) => {
  const userId = getUserId(request);
  const body = NotificationActionSchema.parse(await request.json());

  if (body.action === 'mark_read') {
    const notificationIds = Array.isArray(body.notificationIds)
      ? body.notificationIds
      : [body.notificationIds];

    const batch = dbAdmin.batch();
    for (const notificationId of notificationIds) {
      const notificationRef = dbAdmin.collection('notifications').doc(notificationId);
      batch.update(notificationRef, { 
        isRead: true, 
        readAt: new Date().toISOString() 
      });
    }
    await batch.commit();

    logger.info('Marked notifications as read', { notificationId: notificationIds.join(','), userId });

    return respond.success({ message: 'Notifications marked as read' });
  }

  if (body.action === 'mark_all_read') {
    const unreadNotifications = await dbAdmin.collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    const batch = dbAdmin.batch();
    unreadNotifications.docs.forEach(doc => {
      batch.update(doc.ref, { 
        isRead: true, 
        readAt: new Date().toISOString() 
      });
    });
    await batch.commit();

    logger.info('Marked all notifications as read', { userId, count: unreadNotifications.size });

    return respond.success({
      message: 'All notifications marked as read',
      updatedCount: unreadNotifications.size
    });
  }

  if (body.action === 'delete' && 'notificationIds' in body) {
    const notificationIds = Array.isArray(body.notificationIds)
      ? body.notificationIds
      : [body.notificationIds];

    const batch = dbAdmin.batch();
    for (const notificationId of notificationIds) {
      const notificationRef = dbAdmin.collection('notifications').doc(notificationId);
      batch.delete(notificationRef);
    }
    await batch.commit();

    logger.info('Deleted notifications', { notificationId: notificationIds.join(','), userId });

    return respond.success({ message: 'Notifications deleted' });
  }

  return respond.error('Invalid action', 'INVALID_INPUT', { status: 400 });
});

export const PUT = withAuthAndErrors(async (request: AuthenticatedRequest, _context, respond) => {
  const userId = getUserId(request);
  const { notificationId, isRead } = NotificationUpdateSchema.parse(await request.json());

  const notificationRef = dbAdmin.collection('notifications').doc(notificationId);
  const notificationDoc = await notificationRef.get();
  
  if (!notificationDoc.exists) {
    return respond.error('Notification not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const notificationData = notificationDoc.data();
  if (notificationData?.userId !== userId) {
    return respond.error('Unauthorized access to notification', 'FORBIDDEN', { status: 403 });
  }

  const updates: Partial<HiveNotification> = { isRead } as Partial<HiveNotification>;
  if (isRead && !notificationData?.readAt) {
    (updates as Record<string, unknown>).readAt = new Date().toISOString();
  }
  
  await notificationRef.update(updates);

  logger.info('Updated notification read status', { notificationId, userId });

  return respond.success({ message: 'Notification updated successfully' });
});

export const GET = withCache(_GET as (req: NextRequest, ctx: unknown) => Promise<Response>, 'PRIVATE');
