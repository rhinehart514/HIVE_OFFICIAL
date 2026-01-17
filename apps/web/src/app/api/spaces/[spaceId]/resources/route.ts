/**
 * Space Resources API
 * CRUD operations for space resources (files, links, documents)
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withSecureAuth } from '@/lib/api-auth-secure';
import { logger } from '@/lib/logger';
import { getDefaultCampusId } from '@/lib/campus-context';
import { z } from 'zod';

// Resource types
export type ResourceType = 'link' | 'file' | 'document' | 'image' | 'video';

// Resource schema
const CreateResourceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['link', 'file', 'document', 'image', 'video']),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  isPinned: z.boolean().default(false),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

// GET - List resources for a space
export const GET = withSecureAuth(
  async (
    request: Request,
    token: { uid: string },
    context: { params: Promise<{ spaceId: string }> }
  ) => {
    try {
      const { spaceId } = await context.params;
      const userId = token.uid;
      const campusId = getDefaultCampusId();
      const { searchParams } = new URL(request.url);

      // Parse query params
      const type = searchParams.get('type') as ResourceType | null;
      const category = searchParams.get('category');
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
      const cursor = searchParams.get('cursor');

      // Verify space exists and user has access
      const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
      if (!spaceDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Space not found' },
          { status: 404 }
        );
      }

      const spaceData = spaceDoc.data();

      // Check if space is private and user is member
      if (spaceData?.visibility === 'private') {
        const memberDoc = await dbAdmin
          .collection('spaceMembers')
          .where('spaceId', '==', spaceId)
          .where('userId', '==', userId)
          .where('campusId', '==', campusId)
          .limit(1)
          .get();

        if (memberDoc.empty) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }

      // Build query
      let query = dbAdmin
        .collection('resources')
        .where('spaceId', '==', spaceId)
        .where('campusId', '==', campusId)
        .where('isDeleted', '==', false);

      if (type) {
        query = query.where('type', '==', type);
      }

      if (category) {
        query = query.where('category', '==', category);
      }

      // Order: pinned first, then by createdAt
      query = query
        .orderBy('isPinned', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit + 1);

      if (cursor) {
        const cursorDoc = await dbAdmin.collection('resources').doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      const snapshot = await query.get();

      const resources = snapshot.docs.slice(0, limit).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const hasMore = snapshot.docs.length > limit;
      const nextCursor = hasMore ? resources[resources.length - 1]?.id : null;

      // Get categories for filtering
      const categoriesSnap = await dbAdmin
        .collection('resources')
        .where('spaceId', '==', spaceId)
        .where('campusId', '==', campusId)
        .where('isDeleted', '==', false)
        .select('category')
        .get();

      const categories = [
        ...new Set(
          categoriesSnap.docs
            .map((d) => d.data().category)
            .filter(Boolean)
        ),
      ];

      return NextResponse.json({
        success: true,
        resources,
        pagination: {
          limit,
          hasMore,
          nextCursor,
        },
        categories,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Fetch resources error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch resources' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);

// POST - Create a new resource
export const POST = withSecureAuth(
  async (
    request: Request,
    token: { uid: string },
    context: { params: Promise<{ spaceId: string }> }
  ) => {
    try {
      const { spaceId } = await context.params;
      const userId = token.uid;
      const campusId = getDefaultCampusId();

      // Parse and validate body
      const body = await request.json();
      const validation = CreateResourceSchema.safeParse(body);

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

      const data = validation.data;

      // Verify space exists
      const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
      if (!spaceDoc.exists) {
        return NextResponse.json(
          { success: false, error: 'Space not found' },
          { status: 404 }
        );
      }

      // Verify user is a member with appropriate role
      const memberSnap = await dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('userId', '==', userId)
        .where('campusId', '==', campusId)
        .limit(1)
        .get();

      if (memberSnap.empty) {
        return NextResponse.json(
          { success: false, error: 'You must be a member to add resources' },
          { status: 403 }
        );
      }

      const memberData = memberSnap.docs[0].data();
      const canPin =
        data.isPinned &&
        ['owner', 'admin', 'moderator'].includes(memberData.role);

      // Get user info for author data
      const userDoc = await dbAdmin.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Create resource
      const now = new Date().toISOString();
      const resource = {
        ...data,
        isPinned: canPin ? data.isPinned : false,
        spaceId,
        campusId,
        createdBy: userId,
        createdByName: userData?.displayName || 'HIVE User',
        createdByHandle: userData?.handle || 'user',
        createdByAvatar: userData?.photoURL,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        viewCount: 0,
        downloadCount: 0,
      };

      const docRef = await dbAdmin.collection('resources').add(resource);

      // Update space resource count
      await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .update({
          resourceCount: FieldValue.increment(1),
          updatedAt: now,
        });

      logger.info('Resource created', { resourceId: docRef.id, spaceId, userId });

      return NextResponse.json({
        success: true,
        resource: {
          id: docRef.id,
          ...resource,
        },
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Create resource error', { error: errMsg });
      return NextResponse.json(
        { success: false, error: 'Failed to create resource' },
        { status: 500 }
      );
    }
  },
  {
    allowAnonymous: false,
    rateLimit: { type: 'api' },
  }
);
