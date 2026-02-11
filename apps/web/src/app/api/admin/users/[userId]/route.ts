/**
 * Admin User Detail API Routes
 *
 * Individual user administration endpoints:
 * - GET: Get user details with activity
 * - PATCH: Update user (role, status, etc.)
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

// Update schema
const UpdateUserSchema = z.object({
  role: z.enum(['user', 'builder', 'admin']).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
  displayName: z.string().min(1).max(50).optional(),
  note: z.string().max(500).optional(), // Admin note for the action
});

/**
 * GET /api/admin/users/[userId]
 * Get detailed user information with activity
 */
import { withCache } from '@/lib/cache-headers';
const _GET = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { userId } = await context.params;

  if (!userId) {
    return respond.error('User ID is required', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    // Fetch user profile
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();

    if (!userDoc.exists) {
      return respond.error('User not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const userData = userDoc.data();

    // Fetch user's spaces
    const spacesSnapshot = await dbAdmin
      .collection('spaces')
      .where('memberIds', 'array-contains', userId)
      .limit(20)
      .get();

    const spaces = spacesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      role: doc.data().leaderIds?.includes(userId) ? 'leader' : 'member',
    }));

    // Fetch user's tools
    const toolsSnapshot = await dbAdmin
      .collection('tools')
      .where('creatorId', '==', userId)
      .limit(10)
      .get();

    const tools = toolsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      status: doc.data().status,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    // Fetch recent activity (if activity log exists)
    const activitySnapshot = await dbAdmin
      .collection('activityLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const recentActivity = activitySnapshot.docs.map(doc => ({
      id: doc.id,
      action: doc.data().action,
      target: doc.data().target,
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
    }));

    const user = {
      id: userDoc.id,
      email: userData?.email || '',
      displayName: userData?.displayName || '',
      handle: userData?.handle || '',
      avatarUrl: userData?.avatarUrl || null,
      bio: userData?.bio || '',
      role: userData?.role || 'user',
      status: userData?.status || 'active',
      campusId: userData?.campusId,
      schoolId: userData?.schoolId,
      major: userData?.major || null,
      interests: userData?.interests || [],
      createdAt: userData?.createdAt?.toDate?.()?.toISOString() || null,
      lastActive: userData?.lastActive?.toDate?.()?.toISOString() || null,
      onboardingCompleted: userData?.onboardingCompleted || false,
      emailVerified: userData?.emailVerified || false,
      spaces,
      tools,
      recentActivity,
    };

    logger.info('Admin user detail fetched', {
      adminId,
      targetUserId: userId,
    });

    return respond.success({ user });
  } catch (error) {
    logger.error('Admin user detail failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      userId,
    });
    return respond.error('Failed to fetch user details', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * PATCH /api/admin/users/[userId]
 * Update user properties (role, status, etc.)
 */
export const PATCH = withAdminAuthAndErrors<RouteContext>(async (request, context, respond) => {
  const adminId = getUserId(request as AuthenticatedRequest);
  const { userId } = await context.params;

  if (!userId) {
    return respond.error('User ID is required', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  try {
    const body = await request.json();
    const parseResult = UpdateUserSchema.safeParse(body);

    if (!parseResult.success) {
      return respond.error('Invalid request body', 'VALIDATION_ERROR', {
        status: HttpStatus.BAD_REQUEST,
        details: parseResult.error.flatten(),
      });
    }

    const updates = parseResult.data;

    // Check if user exists
    const userDoc = await dbAdmin.collection('profiles').doc(userId).get();

    if (!userDoc.exists) {
      return respond.error('User not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const currentData = userDoc.data();

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: adminId,
    };

    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }

    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    if (updates.displayName !== undefined) {
      updateData.displayName = updates.displayName;
    }

    // Apply updates
    await dbAdmin.collection('profiles').doc(userId).update(updateData);

    // Log admin activity
    await logAdminActivity({
      adminId,
      action: 'user_updated',
      targetType: 'user',
      targetId: userId,
      details: {
        changes: updates,
        previousValues: {
          role: currentData?.role,
          status: currentData?.status,
          displayName: currentData?.displayName,
        },
        note: updates.note,
      },
    });

    logger.info('Admin user updated', {
      adminId,
      targetUserId: userId,
      updates,
    });

    return respond.success({
      message: 'User updated successfully',
      userId,
      updates,
    });
  } catch (error) {
    logger.error('Admin user update failed', {
      error: error instanceof Error ? error.message : String(error),
      adminId,
      userId,
    });
    return respond.error('Failed to update user', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
