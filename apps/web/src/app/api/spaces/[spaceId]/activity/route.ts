"use server";

import { z } from "zod";
import { dbAdmin } from "@/lib/firebase-admin";
import { getServerSpaceRepository } from "@hive/core/server";
import { logger } from "@/lib/logger";
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from "@/lib/middleware";
import { HttpStatus } from "@/lib/api-response-types";
import { withCache } from '../../../../../lib/cache-headers';

const GetActivityLogSchema = z.object({
  type: z.string().optional(), // Filter by activity type
  userId: z.string().optional(), // Filter by user who performed action
  targetUserId: z.string().optional(), // Filter by target user
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Activity types that can be logged
 */
const ACTIVITY_TYPES = [
  // Member activities
  'member_joined',
  'member_left',
  'member_removed',
  'member_role_changed',
  'member_suspended',
  'member_unsuspended',
  // Content activities
  'post_created',
  'post_updated',
  'post_deleted',
  'comment_created',
  'comment_deleted',
  'event_created',
  'event_updated',
  'event_cancelled',
  'event_deleted',
  // Moderation activities
  'content_hidden',
  'content_unhidden',
  'content_removed',
  'content_flagged',
  'content_approved',
  // Space activities
  'space_updated',
  'space_settings_changed',
  'tool_deployed',
  'tool_removed',
  // Batch activities
  'batch_invite',
  'batch_updateRoles',
  'batch_remove',
] as const;

type ActivityType = typeof ACTIVITY_TYPES[number] | string;

interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  performedBy: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  targetUser?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  details: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Validate space and check leader permissions for audit log access
 */
async function validateSpaceAndLeaderPermission(spaceId: string, userId: string, campusId: string) {
  const spaceRepo = getServerSpaceRepository();
  const spaceResult = await spaceRepo.findById(spaceId);

  if (spaceResult.isFailure) {
    return { ok: false as const, status: HttpStatus.NOT_FOUND, message: "Space not found" };
  }

  const space = spaceResult.getValue();

  if (space.campusId.id !== campusId) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Access denied" };
  }

  const membershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (membershipSnapshot.empty) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Membership required" };
  }

  const membership = membershipSnapshot.docs[0].data();
  const role = membership.role;

  // Only leaders can view audit log
  if (!["owner", "admin", "moderator"].includes(role)) {
    return { ok: false as const, status: HttpStatus.FORBIDDEN, message: "Only leaders can view activity log" };
  }

  return { ok: true as const, space, membership, role };
}

/**
 * GET /api/spaces/[spaceId]/activity
 *
 * Get space activity audit log
 * Shows all actions performed in the space for accountability and debugging
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  const validation = await validateSpaceAndLeaderPermission(spaceId, userId, campusId);
  if (!validation.ok) {
    const code = validation.status === HttpStatus.NOT_FOUND ? "RESOURCE_NOT_FOUND" : "FORBIDDEN";
    return respond.error(validation.message, code, { status: validation.status });
  }

  const queryParams = GetActivityLogSchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  // Build query for space activity collection
  let activityQuery: FirebaseFirestore.Query = dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('activity')
    .orderBy('timestamp', 'desc');

  // Apply filters
  if (queryParams.type) {
    activityQuery = activityQuery.where('type', '==', queryParams.type);
  }

  if (queryParams.userId) {
    activityQuery = activityQuery.where('performedBy', '==', queryParams.userId);
  }

  if (queryParams.targetUserId) {
    activityQuery = activityQuery.where('targetUserId', '==', queryParams.targetUserId);
  }

  if (queryParams.startDate) {
    activityQuery = activityQuery.where('timestamp', '>=', new Date(queryParams.startDate));
  }

  if (queryParams.endDate) {
    activityQuery = activityQuery.where('timestamp', '<=', new Date(queryParams.endDate));
  }

  // Note: We fetch more to get accurate total, then paginate
  const activitySnapshot = await activityQuery.limit(queryParams.limit + queryParams.offset + 1).get();

  const activities: ActivityLogEntry[] = [];
  const userCache = new Map<string, { id: string; name: string; avatar?: string } | null>();

  // Helper to get user info with caching
  const getUser = async (uid: string): Promise<{ id: string; name: string; avatar?: string } | null> => {
    if (userCache.has(uid)) {
      return userCache.get(uid) || null;
    }
    try {
      const userDoc = await dbAdmin.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        const user = {
          id: uid,
          name: data?.fullName || data?.displayName || 'Unknown',
          avatar: data?.photoURL,
        };
        userCache.set(uid, user);
        return user;
      }
    } catch {
      // Ignore errors
    }
    userCache.set(uid, null);
    return null;
  };

  // Process activity documents
  let index = 0;
  for (const doc of activitySnapshot.docs) {
    // Skip until offset
    if (index < queryParams.offset) {
      index++;
      continue;
    }
    // Stop at limit
    if (activities.length >= queryParams.limit) {
      break;
    }

    const data = doc.data();
    const timestamp = data.timestamp?.toDate?.()?.toISOString() ||
                     (data.timestamp instanceof Date ? data.timestamp.toISOString() : data.timestamp);

    const entry: ActivityLogEntry = {
      id: doc.id,
      type: data.type,
      performedBy: data.performedBy ? await getUser(data.performedBy) : null,
      details: data.details || {},
      timestamp,
      metadata: data.metadata,
    };

    // Add target user if applicable
    if (data.targetUserId) {
      entry.targetUser = await getUser(data.targetUserId);
    }

    activities.push(entry);
    index++;
  }

  // Also fetch from moderation log for moderation actions
  const moderationSnapshot = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('moderationLog')
    .orderBy('timestamp', 'desc')
    .limit(queryParams.limit)
    .get();

  for (const doc of moderationSnapshot.docs) {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate?.()?.toISOString() ||
                     (data.timestamp instanceof Date ? data.timestamp.toISOString() : data.timestamp);

    // Map moderation actions to activity types
    const typeMap: Record<string, string> = {
      'hide': 'content_hidden',
      'unhide': 'content_unhidden',
      'remove': 'content_removed',
      'flag': 'content_flagged',
      'approve': 'content_approved',
    };

    const entry: ActivityLogEntry = {
      id: `mod_${doc.id}`,
      type: typeMap[data.action] || `moderation_${data.action}`,
      performedBy: data.moderatorId ? await getUser(data.moderatorId) : null,
      details: {
        contentId: data.contentId,
        contentType: data.contentType,
        action: data.action,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        reason: data.reason,
        isBulkAction: data.isBulkAction,
      },
      timestamp,
    };

    activities.push(entry);
  }

  // Sort combined activities by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply limit again after combining
  const paginatedActivities = activities.slice(0, queryParams.limit);

  // Get activity type summary
  const typeSummary: Record<string, number> = {};
  for (const activity of activities) {
    typeSummary[activity.type] = (typeSummary[activity.type] || 0) + 1;
  }

  logger.info('Activity log fetched', {
    spaceId,
    userId,
    totalActivities: activities.length,
    endpoint: '/api/spaces/[spaceId]/activity'
  });

  return respond.success({
    activities: paginatedActivities,
    total: activities.length,
    pagination: {
      limit: queryParams.limit,
      offset: queryParams.offset,
      hasMore: activities.length > queryParams.offset + queryParams.limit,
    },
    summary: {
      byType: typeSummary,
      availableTypes: ACTIVITY_TYPES,
    },
    filters: {
      type: queryParams.type,
      userId: queryParams.userId,
      targetUserId: queryParams.targetUserId,
      dateRange: queryParams.startDate || queryParams.endDate ? {
        start: queryParams.startDate,
        end: queryParams.endDate,
      } : null,
    },
  });
});

export const GET = withCache(_GET, 'SHORT');
