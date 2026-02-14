import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest
} from "@/lib/middleware";
import { checkSpacePermission } from "@/lib/space-permission-middleware";
import { withCache } from '../../../../../lib/cache-headers';

/**
 * Space Data API - Unified data endpoint for HiveLab space-tier elements
 *
 * GET /api/spaces/[spaceId]/data?type=members|events|feed|stats
 *
 * This endpoint provides data for space-tier elements like:
 * - member-list, member-selector (type=members)
 * - space-events, event-picker (type=events)
 * - space-feed (type=feed)
 * - space-stats (type=stats)
 *
 * Requires space membership. Leaders get additional data.
 */

type DataType = 'members' | 'events' | 'feed' | 'stats';

interface MemberData {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  joinedAt?: string;
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  rsvpCount: number;
  maxCapacity?: number;
}

interface FeedPostData {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

interface StatsData {
  memberCount: number;
  activeMembers: number;
  eventCount: number;
  upcomingEvents: number;
  postCount: number;
  weeklyPosts: number;
}

/**
 * GET /api/spaces/[spaceId]/data - Fetch space data for elements
 */
const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const userId = getUserId(request as AuthenticatedRequest);
  const url = new URL(request.url);

  const dataType = url.searchParams.get('type') as DataType | null;
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  if (!dataType || !['members', 'events', 'feed', 'stats'].includes(dataType)) {
    return respond.error(
      "Valid data type is required (members, events, feed, stats)",
      "INVALID_INPUT",
      { status: 400 }
    );
  }

  // Check member permission - only members can access space data
  const permCheck = await checkSpacePermission(spaceId, userId, 'member');
  if (!permCheck.hasPermission) {
    return respond.error(permCheck.error ?? "Permission denied", permCheck.code ?? "FORBIDDEN", { status: 403 });
  }

  const { role } = permCheck;
  const isLeader = ['owner', 'admin', 'moderator'].includes(role || '');

  try {
    switch (dataType) {
      case 'members': {
        const membersSnapshot = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('spaceMembers')
          .orderBy('joinedAt', 'desc')
          .limit(limit)
          .get();

        const memberIds = membersSnapshot.docs.map(doc => doc.id);

        // Batch fetch user profiles
        const profilePromises = memberIds.map(id =>
          dbAdmin.collection('profiles').doc(id).get()
        );
        const profileDocs = await Promise.all(profilePromises);

        const members: MemberData[] = membersSnapshot.docs.map((doc, index) => {
          const memberData = doc.data();
          const profileData = profileDocs[index].data() || {};

          return {
            id: doc.id,
            name: profileData.displayName || profileData.name || 'Member',
            avatarUrl: profileData.avatarUrl || profileData.photoURL,
            role: memberData.role || 'member',
            joinedAt: memberData.joinedAt?.toDate?.()?.toISOString(),
          };
        });

        return respond.success({
          type: 'members',
          members,
          total: members.length,
          isLeader,
        });
      }

      case 'events': {
        const now = new Date();
        const showPast = url.searchParams.get('showPast') === 'true';

        let query = dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('events')
          .orderBy('startTime', showPast ? 'desc' : 'asc')
          .limit(limit);

        if (!showPast) {
          query = query.where('startTime', '>=', now);
        }

        const eventsSnapshot = await query.get();

        const events: EventData[] = eventsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            startTime: data.startTime?.toDate?.()?.toISOString() || data.startTime,
            endTime: data.endTime?.toDate?.()?.toISOString() || data.endTime,
            location: data.location,
            rsvpCount: data.rsvpCount || 0,
            maxCapacity: data.maxCapacity,
          };
        });

        return respond.success({
          type: 'events',
          events,
          total: events.length,
          isLeader,
        });
      }

      case 'feed': {
        const postsSnapshot = await dbAdmin
          .collection('posts')
          .where('spaceId', '==', spaceId)
          .where('visibility', '==', 'space')
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();

        const posts: FeedPostData[] = postsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            authorId: data.authorId,
            authorName: data.authorName || 'Member',
            authorAvatarUrl: data.authorAvatarUrl,
            content: (data.content || '').slice(0, 200), // Preview only
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            likeCount: data.likeCount || 0,
            commentCount: data.commentCount || 0,
          };
        });

        return respond.success({
          type: 'feed',
          posts,
          total: posts.length,
          isLeader,
        });
      }

      case 'stats': {
        // Get space document for basic counts
        const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
        const spaceData = spaceDoc.data() || {};

        // Get upcoming events count
        const now = new Date();
        const upcomingEventsSnapshot = await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('events')
          .where('startTime', '>=', now)
          .get();

        // Get recent posts count (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentPostsSnapshot = await dbAdmin
          .collection('posts')
          .where('spaceId', '==', spaceId)
          .where('createdAt', '>=', weekAgo)
          .get();

        const stats: StatsData = {
          memberCount: spaceData.memberCount || 0,
          activeMembers: spaceData.activeMembers || Math.floor((spaceData.memberCount || 0) * 0.3),
          eventCount: spaceData.eventCount || 0,
          upcomingEvents: upcomingEventsSnapshot.size,
          postCount: spaceData.postCount || 0,
          weeklyPosts: recentPostsSnapshot.size,
        };

        return respond.success({
          type: 'stats',
          stats,
          isLeader,
        });
      }

      default:
        return respond.error("Invalid data type", "INVALID_INPUT", { status: 400 });
    }
  } catch (error) {
    logger.error('Failed to fetch space data', { error, spaceId, dataType });
    return respond.error("Failed to fetch space data", "FETCH_FAILED", { status: 500 });
  }
});

export const GET = withCache(_GET, 'SHORT');
