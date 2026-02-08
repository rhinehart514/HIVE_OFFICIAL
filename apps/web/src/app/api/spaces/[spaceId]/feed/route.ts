import { dbAdmin } from "@/lib/firebase-admin";
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from "@/lib/middleware";
import { z } from 'zod';
import { HttpStatus } from "@/lib/api-response-types";
import { getServerSpaceRepository } from "@hive/core/server";
// Ghost Mode for privacy filtering
import { GhostModeService, type GhostModeUser } from '@hive/core/domain/profile/services/ghost-mode.service';
import { ViewerContext } from '@hive/core/domain/shared/value-objects/viewer-context.value';
import { isContentHidden } from '@/lib/content-moderation';

// COST OPTIMIZATION: Pre-fetched user data for ghost mode + display
interface UserCacheEntry {
  id: string;
  fullName?: string;
  photoURL?: string;
  handle?: string;
  ghostMode?: unknown;
  visibility?: unknown;
}

// COST OPTIMIZATION: Pre-fetched tool data
interface ToolCacheEntry {
  id: string;
  name: string;
}

const GetActivityFeedSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  types: z.string().optional(), // comma-separated activity types
  since: z.string().optional(), // ISO date string
  sortBy: z.enum(['recent', 'engagement']).optional().default('recent'),
});

// Activity types for space activity feed
export interface ActivityItem {
  id: string;
  type: 'post' | 'event' | 'member_join' | 'member_leave' | 'tool_deploy' | 'tool_remove' | 'event_rsvp' | 'space_update';
  spaceId: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    handle?: string;
  };
  content: unknown; // Specific to activity type
  metadata?: {
    isHighlighted?: boolean;
    isPinned?: boolean;
    [key: string]: unknown;
  };
}

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", {
      status: HttpStatus.BAD_REQUEST,
    });
  }

    const { searchParams } = new URL(request.url);
    const { limit, offset, types, since, sortBy } = GetActivityFeedSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    // Parse activity types filter
    const activityTypes = types ? types.split(',') : ['post', 'event', 'member_join', 'tool_deploy', 'event_rsvp'];
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

    // Use DDD repository for space validation
    const spaceRepo = getServerSpaceRepository();
    const spaceResult = await spaceRepo.findById(spaceId);

    if (spaceResult.isFailure) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    const space = spaceResult.getValue();

    // Enforce campus isolation
    if (space.campusId.id !== campusId) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    // Check membership
    const membershipSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('spaceId', '==', spaceId)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    if (membershipSnapshot.empty) {
      // Allow public spaces to be viewable without membership
      if (!space.isPublic) {
        return respond.error('You must be a member to view this space feed', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
      }
    }

    // GHOST MODE: Build viewer context for privacy checks
    const viewerContext = ViewerContext.authenticated({
      userId,
      campusId,
      memberOfSpaceIds: [spaceId]
    });

    // ============================================================================
    // COST OPTIMIZATION: Fetch all activity snapshots in parallel
    // ============================================================================
    const [postsSnapshot, eventsSnapshot, membersSnapshot, deploymentsSnapshot] = await Promise.all([
      activityTypes.includes('post')
        ? dbAdmin
            .collection("spaces")
            .doc(spaceId)
            .collection("posts")
            .where("createdAt", ">=", sinceDate)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get()
        : Promise.resolve(null),
      activityTypes.includes('event')
        ? dbAdmin
            .collection("spaces")
            .doc(spaceId)
            .collection("events")
            .where("createdAt", ">=", sinceDate)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get()
        : Promise.resolve(null),
      activityTypes.includes('member_join')
        ? dbAdmin
            .collection("spaceMembers")
            .where("spaceId", "==", spaceId)
            .where("isActive", "==", true)
            .where("joinedAt", ">=", sinceDate)
            .orderBy("joinedAt", "desc")
            .limit(limit)
            .get()
        : Promise.resolve(null),
      activityTypes.includes('tool_deploy')
        ? dbAdmin
            .collection("deployments")
            .where("spaceId", "==", spaceId)
            .where("deployedAt", ">=", sinceDate)
            .orderBy("deployedAt", "desc")
            .limit(limit)
            .get()
        : Promise.resolve(null),
    ]);

    // ============================================================================
    // COST OPTIMIZATION: Collect ALL user IDs upfront, batch fetch once
    // This eliminates N+1 queries for ghost mode + user info (was 2N reads per activity)
    // ============================================================================
    const allUserIds = new Set<string>();
    const allToolIds = new Set<string>();

    // Collect user IDs from posts
    if (postsSnapshot) {
      for (const doc of postsSnapshot.docs) {
        const data = doc.data();
        if (data.authorId && (!data.campusId || data.campusId === campusId) && !isContentHidden(data)) {
          allUserIds.add(data.authorId);
        }
      }
    }

    // Collect user IDs from events
    if (eventsSnapshot) {
      for (const doc of eventsSnapshot.docs) {
        const data = doc.data();
        if (data.organizerId && (!data.campusId || data.campusId === campusId) && !isContentHidden(data)) {
          allUserIds.add(data.organizerId);
        }
      }
    }

    // Collect user IDs from member joins
    if (membersSnapshot) {
      for (const doc of membersSnapshot.docs) {
        const data = doc.data();
        if (data.userId && (!data.campusId || data.campusId === campusId)) {
          allUserIds.add(data.userId);
        }
      }
    }

    // Collect user IDs and tool IDs from deployments
    if (deploymentsSnapshot) {
      for (const doc of deploymentsSnapshot.docs) {
        const data = doc.data();
        if (data.userId) allUserIds.add(data.userId);
        if (data.toolId) allToolIds.add(data.toolId);
      }
    }

    // ============================================================================
    // COST OPTIMIZATION: Batch fetch ALL users in one query (N+1 → 1)
    // ============================================================================
    const userCache = new Map<string, UserCacheEntry | null>();
    const ghostModeCache = new Map<string, boolean>(); // userId → shouldHide

    if (allUserIds.size > 0) {
      const userRefs = Array.from(allUserIds).map(id => dbAdmin.collection('users').doc(id));
      const userDocs = await dbAdmin.getAll(...userRefs);

      for (const doc of userDocs) {
        if (doc.exists) {
          const data = doc.data();
          userCache.set(doc.id, {
            id: doc.id,
            fullName: data?.fullName,
            photoURL: data?.photoURL,
            handle: data?.handle,
            ghostMode: data?.ghostMode,
            visibility: data?.visibility,
          });

          // Pre-compute ghost mode check for each user
          const ghostUser: GhostModeUser = {
            id: doc.id,
            ghostMode: data?.ghostMode,
            visibility: data?.visibility,
          };
          ghostModeCache.set(doc.id, GhostModeService.shouldHideActivity(ghostUser, viewerContext, [spaceId]));
        } else {
          userCache.set(doc.id, null);
          ghostModeCache.set(doc.id, false); // User not found, don't hide
        }
      }
    }

    // ============================================================================
    // COST OPTIMIZATION: Batch fetch ALL tools in one query (N+1 → 1)
    // ============================================================================
    const toolCache = new Map<string, ToolCacheEntry | null>();

    if (allToolIds.size > 0) {
      const toolRefs = Array.from(allToolIds).map(id => dbAdmin.collection('tools').doc(id));
      const toolDocs = await dbAdmin.getAll(...toolRefs);

      for (const doc of toolDocs) {
        if (doc.exists) {
          const data = doc.data();
          toolCache.set(doc.id, {
            id: doc.id,
            name: data?.name || 'Unknown Tool',
          });
        } else {
          toolCache.set(doc.id, null);
        }
      }
    }

    // ============================================================================
    // Helper functions using pre-fetched caches (O(1) lookups)
    // ============================================================================
    const shouldHideUserActivity = (targetUserId: string): boolean => {
      return ghostModeCache.get(targetUserId) || false;
    };

    const getUserInfo = (targetUserId: string) => {
      const cached = userCache.get(targetUserId);
      if (!cached) {
        return { id: targetUserId, name: 'Unknown User', avatar: undefined, handle: undefined };
      }
      return {
        id: cached.id,
        name: cached.fullName || 'Unknown User',
        avatar: cached.photoURL,
        handle: cached.handle,
      };
    };

    const getToolName = (toolId: string): string => {
      return toolCache.get(toolId)?.name || 'Unknown Tool';
    };

    // ============================================================================
    // Process activities using cached data (no more per-item fetches)
    // ============================================================================
    const activities: ActivityItem[] = [];

    // Process Posts
    if (postsSnapshot) {
      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        // SECURITY: Skip posts from other campuses
        if (postData.campusId && postData.campusId !== campusId) continue;
        // SECURITY: Skip hidden/moderated/removed content
        if (isContentHidden(postData)) continue;
        // GHOST MODE: Check using pre-computed cache
        if (shouldHideUserActivity(postData.authorId)) continue;

        activities.push({
          id: `post_${postDoc.id}`,
          type: 'post',
          spaceId,
          timestamp: postData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          user: getUserInfo(postData.authorId),
          content: {
            id: postDoc.id,
            title: postData.title,
            content: postData.content,
            type: postData.type,
            likesCount: postData.likesCount || 0,
            repliesCount: postData.repliesCount || 0,
            isPinned: postData.isPinned || false,
          },
          metadata: {
            isPinned: postData.isPinned || false,
            isHighlighted: postData.type === 'announcement',
          }
        });
      }
    }

    // Process Events
    if (eventsSnapshot) {
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        // SECURITY: Skip events from other campuses
        if (eventData.campusId && eventData.campusId !== campusId) continue;
        // SECURITY: Skip hidden/moderated/removed content
        if (isContentHidden(eventData)) continue;
        // GHOST MODE: Check using pre-computed cache
        if (shouldHideUserActivity(eventData.organizerId)) continue;

        activities.push({
          id: `event_${eventDoc.id}`,
          type: 'event',
          spaceId,
          timestamp: eventData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          user: getUserInfo(eventData.organizerId),
          content: {
            id: eventDoc.id,
            title: eventData.title,
            description: eventData.description,
            startDate: eventData.startDate?.toDate?.()?.toISOString(),
            location: eventData.location,
            currentAttendees: eventData.currentAttendees || 0,
            maxAttendees: eventData.maxAttendees,
            type: eventData.type,
            isFeatured: eventData.isFeatured || false,
          },
          metadata: {
            isHighlighted: eventData.isFeatured || false,
          }
        });
      }
    }

    // Process Member Joins
    if (membersSnapshot) {
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        if (memberData.campusId && memberData.campusId !== campusId) continue;

        const memberId = memberData.userId;
        // GHOST MODE: Check using pre-computed cache
        if (shouldHideUserActivity(memberId)) continue;

        activities.push({
          id: `member_join_${memberId}`,
          type: 'member_join',
          spaceId,
          timestamp: memberData.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          user: getUserInfo(memberId),
          content: {
            role: memberData.role || 'member',
            isNewMember: true,
          }
        });
      }
    }

    // Process Tool Deployments
    if (deploymentsSnapshot) {
      for (const deploymentDoc of deploymentsSnapshot.docs) {
        const deploymentData = deploymentDoc.data();
        // GHOST MODE: Check using pre-computed cache
        if (shouldHideUserActivity(deploymentData.userId)) continue;

        activities.push({
          id: `tool_deploy_${deploymentDoc.id}`,
          type: 'tool_deploy',
          spaceId,
          timestamp: deploymentData.deployedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          user: getUserInfo(deploymentData.userId),
          content: {
            toolId: deploymentData.toolId,
            toolName: getToolName(deploymentData.toolId),
            deploymentId: deploymentDoc.id,
            status: deploymentData.status,
            configuration: deploymentData.configuration,
          }
        });
      }
    }

    // Sort activities based on sortBy parameter
    if (sortBy === 'engagement') {
      // Sort by engagement score (likes + replies + isPinned bonus)
      activities.sort((a, b) => {
        const getEngagementScore = (item: ActivityItem): number => {
          const content = item.content as Record<string, unknown>;
          let score = 0;
          // Posts/events have likes and replies
          score += (content.likesCount as number) || 0;
          score += ((content.repliesCount as number) || 0) * 2; // Comments weighted higher
          // Pinned items get a bonus
          if (item.metadata?.isPinned) score += 100;
          if (item.metadata?.isHighlighted) score += 50;
          // Events with attendees
          score += (content.currentAttendees as number) || 0;
          return score;
        };
        return getEngagementScore(b) - getEngagementScore(a);
      });
    } else {
      // Default: sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    return respond.success({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: activities.length > offset + limit,
      pagination: {
        limit,
        offset,
        nextOffset: activities.length > offset + limit ? offset + limit : null,
      },
      summary: {
        totalActivities: activities.length,
        typeBreakdown: activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        lastActivity: activities[0]?.timestamp || null,
      },
      meta: {
        sortBy,
        sinceDate: sinceDate.toISOString(),
        activityTypes,
      }
    });
});
