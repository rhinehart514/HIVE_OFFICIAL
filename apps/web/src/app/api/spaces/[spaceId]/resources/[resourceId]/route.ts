/**
 * Individual Resource API
 * GET, PUT, DELETE operations for a single resource
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { getDefaultCampusId } from '@/lib/campus-context';
import { z } from 'zod';
import { withCache } from '../../../../../../lib/cache-headers';

// Update schema
const UpdateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  url: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  isPinned: z.boolean().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

type RouteContext = {
  params: Promise<{ spaceId: string; resourceId: string }>;
};

// GET - Fetch single resource
const _GET = withSecureAuth(
  async (request: Request, token: { uid: string }, context: RouteContext) => {
    try {
      const { spaceId, resourceId } = await context.params;
      const campusId = getDefaultCampusId();

      // Get resource
      const resourceDoc = await dbAdmin.collection('resources').doc(resourceId).get();

      if (!resourceDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      const resourceData = resourceDoc.data();

      // Verify it belongs to the space and campus
      if (resourceData?.spaceId !== spaceId || resourceData?.campusId !== campusId) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      // Check if deleted
      if (resourceData?.isDeleted) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      // Increment view count (fire and forget)
      dbAdmin.collection('resources').doc(resourceId).update({
        viewCount: FieldValue.increment(1),
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        resource: {
          id: resourceDoc.id,
          ...resourceData,
        },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Get resource error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch resource' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// PUT - Update resource
export const PUT = withSecureAuth(
  async (request: Request, token: { uid: string }, context: RouteContext) => {
    try {
      const { spaceId, resourceId } = await context.params;
      const userId = token.uid;
      const campusId = getDefaultCampusId();

      // Parse body
      const body = await request.json();
      const validation = UpdateResourceSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const updates = validation.data;

      // Get resource
      const resourceDoc = await dbAdmin.collection('resources').doc(resourceId).get();

      if (!resourceDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      const resourceData = resourceDoc.data();

      // Verify ownership
      if (resourceData?.spaceId !== spaceId || resourceData?.campusId !== campusId) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      // Check permission - must be creator, or space admin/moderator
      const isCreator = resourceData.createdBy === userId;

      if (!isCreator) {
        const memberSnap = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
          .where('campusId', '==', campusId)
          .limit(1)
          .get();

        if (memberSnap.empty) {
          return NextResponse.json(
            { success: false, error: 'Permission denied' },
            { status: 403 }
          );
        }

        const memberData = memberSnap.docs[0].data();
        if (!['owner', 'admin', 'moderator'].includes(memberData.role)) {
          return NextResponse.json(
            { success: false, error: 'Permission denied' },
            { status: 403 }
          );
        }
      }

      // If trying to pin, verify user has permission
      if (updates.isPinned !== undefined && updates.isPinned !== resourceData.isPinned) {
        const memberSnap = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
          .where('campusId', '==', campusId)
          .limit(1)
          .get();

        if (!memberSnap.empty) {
          const memberData = memberSnap.docs[0].data();
          if (!['owner', 'admin', 'moderator'].includes(memberData.role)) {
            delete updates.isPinned; // Remove pin update if not authorized
          }
        }
      }

      // Update resource
      const now = new Date().toISOString();
      await dbAdmin.collection('resources').doc(resourceId).update({
        ...updates,
        updatedAt: now,
        updatedBy: userId,
      });

      logger.info('Resource updated', { resourceId, spaceId, userId });

      return NextResponse.json({
        success: true,
        resource: {
          id: resourceId,
          ...resourceData,
          ...updates,
          updatedAt: now,
        },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Update resource error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to update resource' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// DELETE - Delete resource (soft delete)
export const DELETE = withSecureAuth(
  async (request: Request, token: { uid: string }, context: RouteContext) => {
    try {
      const { spaceId, resourceId } = await context.params;
      const userId = token.uid;
      const campusId = getDefaultCampusId();

      // Get resource
      const resourceDoc = await dbAdmin.collection('resources').doc(resourceId).get();

      if (!resourceDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      const resourceData = resourceDoc.data();

      // Verify ownership
      if (resourceData?.spaceId !== spaceId || resourceData?.campusId !== campusId) {
        return NextResponse.json(
          { success: false, error: 'Resource not found' },
          { status: 404 }
        );
      }

      // Check permission - must be creator, or space admin/moderator
      const isCreator = resourceData.createdBy === userId;

      if (!isCreator) {
        const memberSnap = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
          .where('campusId', '==', campusId)
          .limit(1)
          .get();

        if (memberSnap.empty) {
          return NextResponse.json(
            { success: false, error: 'Permission denied' },
            { status: 403 }
          );
        }

        const memberData = memberSnap.docs[0].data();
        if (!['owner', 'admin', 'moderator'].includes(memberData.role)) {
          return NextResponse.json(
            { success: false, error: 'Permission denied' },
            { status: 403 }
          );
        }
      }

      // Soft delete
      const now = new Date().toISOString();
      await dbAdmin.collection('resources').doc(resourceId).update({
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
      });

      // Update space resource count
      await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .update({
          resourceCount: FieldValue.increment(-1),
          updatedAt: now,
        });

      logger.info('Resource deleted', { resourceId, spaceId, userId });

      return NextResponse.json({
        success: true,
        message: 'Resource deleted',
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Delete resource error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to delete resource' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

export const GET = withCache(_GET, 'SHORT');
