import { z } from "zod";
import { dbAdmin } from '@/lib/firebase-admin';
import {
  getServerSpaceRepository,
  toSpaceMembershipDTO,
  type MembershipDTO,
  type SpaceMembershipDTO,
} from '@hive/core/server';
import { logger } from "@/lib/structured-logger";
import { withAuthAndErrors, withAuthValidationAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";

const updateSpacePreferencesSchema = z.object({
  spaceId: z.string().min(1, "Space ID is required"),
  action: z.enum(['pin', 'unpin', 'mark_visited', 'update_notifications']),
  value: z.unknown().optional()
});

// Using unified MembershipDTO and toSpaceMembershipDTO from @hive/core/server

/**
 * GET /api/spaces/my - Get user's spaces with membership data
 *
 * @deprecated Use /api/spaces/mine instead for the new unified format.
 * This route is maintained for backwards compatibility.
 *
 * Returns spaces with membership info, activity, and widget-specific data.
 * Uses DDD repository for space data, spaceMembers collection for membership.
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);

  logger.info('Fetching spaces for user', { userId, endpoint: '/api/spaces/my' });

  // Get user's memberships using flat collection
  // Note: spaceMembers is separate from EnhancedSpace aggregate
  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(200)
    .get();

  if (membershipsSnapshot.empty) {
    logger.info('No memberships found for user', { userId });
    return respond.success({
      activeSpaces: [],
      pinnedSpaces: [],
      recentActivity: [],
      stats: {
        totalSpaces: 0,
        adminSpaces: 0,
        totalNotifications: 0,
        weeklyActivity: 0
      }
    });
  }

  logger.info('Found memberships', { count: membershipsSnapshot.size, userId });

  // Extract membership data indexed by space ID
  const membershipData = new Map<string, MembershipDTO>();
  const spaceIds: string[] = [];

  for (const doc of membershipsSnapshot.docs) {
    const membership = doc.data();
    const spaceId = membership.spaceId as string | undefined;
    if (spaceId) {
      spaceIds.push(spaceId);
      membershipData.set(spaceId, {
        role: (membership.role as string) || 'member',
        joinedAt: membership.joinedAt?.toDate?.() || null,
        lastVisited: membership.lastVisited?.toDate?.() || new Date(),
        notifications: (membership.notifications as number) || 0,
        pinned: (membership.pinned as boolean) || false
      });
    }
  }

  // Use DDD repository to fetch space details
  const spaceRepo = getServerSpaceRepository();
  const spaces: SpaceMembershipDTO[] = [];

  // Fetch spaces in parallel
  const spacePromises = spaceIds.map(id => spaceRepo.findById(id));
  const spaceResults = await Promise.all(spacePromises);

  for (let i = 0; i < spaceIds.length; i++) {
    const result = spaceResults[i];
    const spaceId = spaceIds[i];
    if (!result || !spaceId) continue;

    if (result.isSuccess) {
      const space = result.getValue();
      // Enforce campus isolation
      if (space.campusId.id !== campusId) continue;

      const membership = membershipData.get(spaceId);
      if (membership) {
        spaces.push(toSpaceMembershipDTO(space, membership));
      }
    }
  }

  // Sort spaces by last visited (most recent first)
  spaces.sort((a, b) =>
    new Date(b.membership.lastVisited).getTime() -
    new Date(a.membership.lastVisited).getTime()
  );

  // Separate pinned spaces
  const pinnedSpaces = spaces.filter(s => s.membership.pinned).slice(0, 4);

  // Get weekly activity from activitySummaries
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStartStr = oneWeekAgo.toISOString().split('T')[0];

  let weeklyActivityCount = 0;
  try {
    const activitySnapshot = await dbAdmin
      .collection('activitySummaries')
      .where('userId', '==', userId)
      .where('date', '>=', weekStartStr)
      .get();

    // Sum up all activity metrics for the week
    for (const doc of activitySnapshot.docs) {
      const data = doc.data();
      weeklyActivityCount += (data.contentCreated || 0) +
        (data.socialInteractions || 0) +
        (data.spacesVisited?.length || 0);
    }
  } catch {
    // Activity collection may not exist yet - use 0
  }

  // Calculate stats
  const stats = {
    totalSpaces: spaces.length,
    adminSpaces: spaces.filter(s =>
      ['admin', 'owner'].includes(s.membership.role.toLowerCase())
    ).length,
    totalNotifications: spaces.reduce((sum, s) => sum + s.membership.notifications, 0),
    weeklyActivity: weeklyActivityCount
  };

  // Recent activity placeholder
  const recentActivity = spaces.slice(0, 3).map(space => ({
    spaceId: space.id,
    spaceName: space.name,
    type: 'post',
    content: 'Recent activity in this space',
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
  }));

  logger.info('Returning spaces for user', { spaceCount: spaces.length, userId });

  return respond.success({
    activeSpaces: spaces,
    pinnedSpaces,
    recentActivity,
    stats
  });
});

/**
 * PATCH /api/spaces/my - Update user space preferences
 *
 * Updates membership preferences (pin/unpin, notifications, etc.)
 * in the spaceMembers collection.
 */
type UpdatePreferencesData = z.infer<typeof updateSpacePreferencesSchema>;

export const PATCH = withAuthValidationAndErrors(
  updateSpacePreferencesSchema,
  async (request, context, body: UpdatePreferencesData, respond) => {
    const { spaceId, action, value } = body;
    const userId = getUserId(request as AuthenticatedRequest);

    // Find membership document in flat collection
    const membershipSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (membershipSnapshot.empty) {
      return respond.error("Membership not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    const membershipRef = membershipSnapshot.docs[0]?.ref;
    if (!membershipRef) {
      return respond.error("Membership not found", "RESOURCE_NOT_FOUND", { status: 404 });
    }

    // Build updates based on action
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    switch (action) {
      case 'pin':
        updates.pinned = true;
        break;
      case 'unpin':
        updates.pinned = false;
        break;
      case 'mark_visited':
        updates.lastVisited = new Date();
        break;
      case 'update_notifications':
        updates.notifications = value || 0;
        break;
      default:
        return respond.error("Invalid action", "INVALID_INPUT", { status: 400 });
    }

    await membershipRef.update(updates);

    logger.info('Updated membership preference', { spaceId, action, userId });

    return respond.success({
      message: `Space ${action} successful`
    });
  }
);
