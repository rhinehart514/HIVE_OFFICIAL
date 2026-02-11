/**
 * Admin Announcements API
 *
 * GET: List all announcements
 * POST: Create a new announcement (send immediately or schedule)
 *
 * Campus-wide messaging for important communications.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withCache } from '../../../../lib/cache-headers';

const AnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  audience: z.enum(['all', 'builders', 'admins', 'space_members']),
  targetSpaceId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(), // ISO date string
});

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'builders' | 'admins' | 'space_members';
  targetSpaceId?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledFor?: FirebaseFirestore.Timestamp;
  sentAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  createdBy: string;
  campusId: string;
  recipientCount?: number;
  error?: string;
}

/**
 * GET /api/admin/announcements
 * List all announcements
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const status = searchParams.get('status');

  try {
    let query = dbAdmin
      .collection('adminAnnouncements')
      .where('campusId', '==', campusId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    const announcements = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        audience: data.audience,
        targetSpaceId: data.targetSpaceId,
        status: data.status,
        scheduledFor: data.scheduledFor?.toDate?.()?.toISOString(),
        sentAt: data.sentAt?.toDate?.()?.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        createdBy: data.createdBy,
        recipientCount: data.recipientCount,
      };
    });

    logger.info('Announcements fetched', { count: announcements.length });

    return respond.success({ announcements });
  } catch (error) {
    logger.error('Failed to fetch announcements', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to fetch announcements', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * POST /api/admin/announcements
 * Create and optionally send an announcement
 */
export const POST = withAdminAuthAndErrors(async (request, _context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const body = await request.json();
  const validationResult = AnnouncementSchema.safeParse(body);

  if (!validationResult.success) {
    return respond.error('Invalid announcement data', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: validationResult.error.flatten(),
    });
  }

  const data = validationResult.data;

  try {
    const now = FieldValue.serverTimestamp();
    const isScheduled = !!data.scheduledFor;

    // Create announcement document
    const announcementData: Partial<Announcement> = {
      title: data.title,
      body: data.body,
      audience: data.audience,
      targetSpaceId: data.targetSpaceId,
      status: isScheduled ? 'scheduled' : 'sent',
      createdBy: adminId,
      campusId,
    };

    if (isScheduled) {
      announcementData.scheduledFor = new Date(data.scheduledFor!) as unknown as FirebaseFirestore.Timestamp;
    } else {
      announcementData.sentAt = now as unknown as FirebaseFirestore.Timestamp;
    }

    const docRef = await dbAdmin.collection('adminAnnouncements').add({
      ...announcementData,
      createdAt: now,
    });

    // If sending immediately, trigger notification delivery
    if (!isScheduled) {
      try {
        // Create notification entries for users using batched writes
        // Batch notifications in groups of 500 (Firestore limit)
        const BATCH_SIZE = 500;
        let userIds: string[] = [];

        // Collect user IDs based on audience
        switch (data.audience) {
          case 'all': {
            const usersSnap = await dbAdmin
              .collection('users')
              .where('campusId', '==', campusId)
              .where('status', '==', 'active')
              .select()
              .get();
            userIds = usersSnap.docs.map(d => d.id);
            break;
          }
          case 'builders': {
            const buildersSnap = await dbAdmin
              .collection('users')
              .where('campusId', '==', campusId)
              .where('role', '==', 'builder')
              .where('status', '==', 'active')
              .select()
              .get();
            userIds = buildersSnap.docs.map(d => d.id);
            break;
          }
          case 'admins': {
            const adminsSnap = await dbAdmin
              .collection('users')
              .where('campusId', '==', campusId)
              .where('role', 'in', ['admin', 'super_admin'])
              .where('status', '==', 'active')
              .select()
              .get();
            userIds = adminsSnap.docs.map(d => d.id);
            break;
          }
          case 'space_members': {
            if (data.targetSpaceId) {
              const membersSnap = await dbAdmin
                .collection('spaceMemberships')
                .where('spaceId', '==', data.targetSpaceId)
                .where('status', '==', 'active')
                .select('userId')
                .get();
              userIds = membersSnap.docs.map(d => d.data().userId);
            }
            break;
          }
        }

        // Update announcement with recipient count
        const recipientCount = userIds.length;
        await docRef.update({ recipientCount });

        // Create notifications in batches
        const timestamp = new Date().toISOString();
        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
          const batch = dbAdmin.batch();
          const chunk = userIds.slice(i, i + BATCH_SIZE);

          for (const userId of chunk) {
            const notifRef = dbAdmin.collection('notifications').doc();
            batch.set(notifRef, {
              userId,
              type: 'system',
              category: 'system',
              title: data.title,
              body: data.body,
              actionUrl: '/notifications',
              read: false,
              timestamp,
              campusId,
              metadata: {
                announcementId: docRef.id,
                audience: data.audience,
              },
            });
          }

          await batch.commit();
        }

        logger.info('Announcement sent with notifications', {
          announcementId: docRef.id,
          audience: data.audience,
          recipientCount,
          notificationsCreated: userIds.length,
          adminId,
        });
      } catch (deliveryError) {
        logger.error('Failed to deliver announcement notifications', {
          announcementId: docRef.id,
          error: deliveryError instanceof Error ? deliveryError.message : String(deliveryError),
        });
        // Update announcement status to indicate partial failure
        await docRef.update({ status: 'failed', error: 'Notification delivery failed' });
      }
    } else {
      logger.info('Announcement scheduled', {
        announcementId: docRef.id,
        scheduledFor: data.scheduledFor,
        adminId,
      });
    }

    return respond.success({
      id: docRef.id,
      message: isScheduled ? 'Announcement scheduled' : 'Announcement sent',
      status: isScheduled ? 'scheduled' : 'sent',
    });
  } catch (error) {
    logger.error('Failed to create announcement', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to create announcement', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
