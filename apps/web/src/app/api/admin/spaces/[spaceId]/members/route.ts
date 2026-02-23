/**
 * Admin Space Members API
 *
 * GET: List all members of a space with roles and metadata
 * PATCH: Update a member's role or status
 *
 * Campus-filtered: School admins only see members from their campus.
 */

import { z } from 'zod';
import { logger } from '@/lib/structured-logger';
import {
  withAdminAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { getAdminRecord, hasAdminRole } from '@/lib/admin-auth';
import { withCache } from '../../../../../../lib/cache-headers';

type RouteContext = { params: Promise<{ spaceId: string }> };

const MembersQuerySchema = z.object({
  role: z.enum(['all', 'admin', 'leader', 'member']).optional().default('all'),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 50),
  offset: z.string().optional().transform(v => v ? parseInt(v, 10) : 0),
});

const UpdateMemberSchema = z.object({
  memberId: z.string(),
  action: z.enum(['promote', 'demote', 'remove', 'suspend']),
  role: z.enum(['admin', 'leader', 'member']).optional(),
  reason: z.string().optional(),
});

interface SpaceMember {
  id: string;
  memberId: string;
  userId: string;
  displayName: string;
  handle?: string;
  email?: string;
  avatarUrl?: string;
  role: 'admin' | 'leader' | 'member';
  joinedAt: string;
  isFoundingMember: boolean;
  lastActiveAt?: string;
  messageCount?: number;
}

/**
 * GET /api/admin/spaces/[spaceId]/members
 * List all members of a space
 */
const _GET = withAdminAuthAndErrors(async (request, context: RouteContext, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const queryResult = MembersQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) {
    return respond.error('Invalid query parameters', 'VALIDATION_ERROR', {
      status: HttpStatus.BAD_REQUEST,
      details: queryResult.error.flatten(),
    });
  }

  const query = queryResult.data;

  try {
    // Verify space exists and belongs to campus
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const spaceData = spaceDoc.data();
    if (spaceData?.campusId !== campusId) {
      return respond.error('Access denied', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    // Fetch members
    const membersQuery = dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      // campusId single-field index is exempted — skip Firestore filter
      .where('isActive', '==', true)
      .orderBy('joinedAt', 'desc');

    const membersSnapshot = await membersQuery.get();

    // Get profile data for each member
    const members: SpaceMember[] = [];

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();

      // Apply role filter
      if (query.role !== 'all' && memberData.role !== query.role) {
        continue;
      }

      // Fetch profile
      const profileDoc = await dbAdmin.collection('profiles').doc(memberData.userId).get();
      const profileData = profileDoc.exists ? profileDoc.data() : null;

      // Count messages by this user in this space
      const messagesSnapshot = await dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('messages')
        .where('authorId', '==', memberData.userId)
        .count()
        .get();
      const messageCount = messagesSnapshot.data().count;

      members.push({
        id: memberDoc.id,
        memberId: memberDoc.id,
        userId: memberData.userId,
        displayName: profileData?.displayName || 'Unknown',
        handle: profileData?.handle,
        email: profileData?.email,
        avatarUrl: profileData?.avatarUrl,
        role: memberData.role || 'member',
        joinedAt: memberData.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        isFoundingMember: memberData.isFoundingMember || false,
        lastActiveAt: profileData?.lastActiveAt?.toDate?.()?.toISOString(),
        messageCount,
      });
    }

    // Apply pagination
    const total = members.length;
    const paginatedMembers = members.slice(query.offset, query.offset + query.limit);

    // Calculate role breakdown
    const roleBreakdown = {
      admin: members.filter(m => m.role === 'admin').length,
      leader: members.filter(m => m.role === 'leader').length,
      member: members.filter(m => m.role === 'member').length,
    };

    logger.info('Admin fetched space members', {
      spaceId,
      total,
    });

    return respond.success({
      space: {
        id: spaceId,
        name: spaceData?.name,
      },
      members: paginatedMembers,
      roleBreakdown,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + paginatedMembers.length < total,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch space members', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
    });
    return respond.error('Failed to fetch space members', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

/**
 * PATCH /api/admin/spaces/[spaceId]/members
 * Update a member's role or remove them
 */
export const PATCH = withAuthValidationAndErrors(
  UpdateMemberSchema,
  async (
    request,
    context: RouteContext,
    body: z.infer<typeof UpdateMemberSchema>,
    respond
  ) => {
    const adminId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await context.params;

    // Check admin permission
    const adminRecord = await getAdminRecord(adminId);
    if (!adminRecord || !hasAdminRole(adminRecord.role, 'moderator')) {
      return respond.error('Moderator access required', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
      });
    }

    const { memberId, action, role, reason } = body;

    try {
      // Verify space exists and belongs to campus
      const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
      if (!spaceDoc.exists) {
        return respond.error('Space not found', 'NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const spaceData = spaceDoc.data();
      if (spaceData?.campusId !== campusId) {
        return respond.error('Access denied', 'FORBIDDEN', {
          status: HttpStatus.FORBIDDEN,
        });
      }

      // Find member record
      const memberDoc = await dbAdmin.collection('spaceMembers').doc(memberId).get();
      if (!memberDoc.exists) {
        return respond.error('Member not found', 'NOT_FOUND', {
          status: HttpStatus.NOT_FOUND,
        });
      }

      const memberData = memberDoc.data();
      if (memberData?.spaceId !== spaceId) {
        return respond.error('Member not in this space', 'VALIDATION_ERROR', {
          status: HttpStatus.BAD_REQUEST,
        });
      }

      const now = new Date();
      const updateData: Record<string, unknown> = {
        updatedAt: now,
        updatedBy: adminId,
      };

      switch (action) {
        case 'promote':
        case 'demote':
          if (!role) {
            return respond.error('Role required for promote/demote action', 'VALIDATION_ERROR', {
              status: HttpStatus.BAD_REQUEST,
            });
          }
          updateData.role = role;
          break;

        case 'remove':
          updateData.isActive = false;
          updateData.removedAt = now;
          updateData.removedBy = adminId;
          updateData.removeReason = reason || 'Admin removal';
          break;

        case 'suspend':
          updateData.isSuspended = true;
          updateData.suspendedAt = now;
          updateData.suspendedBy = adminId;
          updateData.suspendReason = reason || 'Admin suspension';
          break;
      }

      await dbAdmin.collection('spaceMembers').doc(memberId).update(updateData);

      // Update member count if removed
      if (action === 'remove') {
        await dbAdmin.collection('spaces').doc(spaceId).update({
          memberCount: (spaceData?.memberCount || 1) - 1,
          updatedAt: now,
        });
      }

      logger.info(`Admin ${action} space member`, {
        spaceId,
        memberId,
        adminId,
        action,
        role,
      });

      return respond.success({
        message: `Member ${action}d successfully`,
        memberId,
        action,
        newRole: role,
      });
    } catch (error) {
      logger.error(`Failed to ${action} space member`, {
        error: error instanceof Error ? error.message : String(error),
        spaceId,
        memberId,
        action,
      });
      return respond.error(`Failed to ${action} member`, 'INTERNAL_ERROR', {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export const GET = withCache(_GET, 'PRIVATE');
