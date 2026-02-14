import { getServerSpaceRepository } from "@hive/core/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { withAuthAndErrors, getCampusId, getUserId, type AuthenticatedRequest } from "@/lib/middleware";
import { withCache } from '../../../../../lib/cache-headers';
import {
  canViewEvents,
  canViewMembers,
  canViewPosts,
  enforceVisibilityRules,
} from "@/lib/space-rules-middleware";

/**
 * Space Preview API
 *
 * Returns lightweight preview data for dock hover cards:
 * - Basic space info (name, description)
 * - Member and online counts
 * - Recent chat message
 * - Upcoming event
 * - Deployed tools count
 */

interface SpacePreviewResponse {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  memberCount: number;
  onlineCount: number;
  recentMessage?: {
    user: string;
    content: string;
    time: string;
  };
  upcomingEvent?: {
    name: string;
    date: string;
    rsvpCount: number;
  };
  deployedToolsCount: number;
}

const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const { spaceId } = await params;
  const campusId = getCampusId(request as AuthenticatedRequest);
  const userId = getUserId(request as AuthenticatedRequest);

  if (!spaceId) {
    return respond.error("Space ID is required", "INVALID_INPUT", { status: 400 });
  }

  // Get space basic info from repository
  const spaceRepo = getServerSpaceRepository();
  const result = await spaceRepo.findById(spaceId, { loadPlacedTools: true });

  if (result.isFailure) {
    return respond.error("Space not found", "RESOURCE_NOT_FOUND", { status: 404 });
  }

  const space = result.getValue();

  // Enforce campus isolation
  if (space.campusId.id !== campusId) {
    return respond.error("Access denied - campus mismatch", "FORBIDDEN", { status: 403 });
  }

  const visibilityRules = await enforceVisibilityRules(spaceId, userId);
  if (!visibilityRules.allowed) {
    return respond.error(visibilityRules.reason || "Permission denied", "FORBIDDEN", { status: 403 });
  }
  const canSeePosts = canViewPosts(visibilityRules.visibility.posts, visibilityRules.isMember);
  const canSeeEvents = canViewEvents(visibilityRules.visibility.events, visibilityRules.isMember);
  const canSeeMembers = canViewMembers(visibilityRules.visibility.members, visibilityRules.isMember);

  // Fetch recent message (last 1)
  let recentMessage: SpacePreviewResponse['recentMessage'];
  if (canSeePosts) {
    try {
    const messagesSnap = await dbAdmin
      .collection('spaceMessages')
      .where('spaceId', '==', spaceId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!messagesSnap.empty) {
      const msg = messagesSnap.docs[0].data();
      recentMessage = {
        user: msg.senderName || 'Member',
        content: msg.content?.substring(0, 100) || '',
        time: msg.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }
    } catch (err) {
      logger.warn('Failed to fetch recent message for preview', { spaceId, error: err });
    }
  }

  // Fetch upcoming event (next 1)
  let upcomingEvent: SpacePreviewResponse['upcomingEvent'];
  if (canSeeEvents) {
    try {
    const now = new Date();
    const eventsSnap = await dbAdmin
      .collection('spaceEvents')
      .where('spaceId', '==', spaceId)
      .where('startTime', '>=', now)
      .orderBy('startTime', 'asc')
      .limit(1)
      .get();

    if (!eventsSnap.empty) {
      const evt = eventsSnap.docs[0].data();
      upcomingEvent = {
        name: evt.title || evt.name || 'Upcoming Event',
        date: evt.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
        rsvpCount: evt.rsvpCount || evt.attendeeCount || 0,
      };
    }
    } catch (err) {
      logger.warn('Failed to fetch upcoming event for preview', { spaceId, error: err });
    }
  }

  // Get online count from presence (if available)
  let onlineCount = 0;
  if (canSeeMembers) {
    try {
    const presenceSnap = await dbAdmin
      .collection('spacePresence')
      .doc(spaceId)
      .get();

    if (presenceSnap.exists) {
      const presenceData = presenceSnap.data();
      onlineCount = presenceData?.onlineCount || Object.keys(presenceData?.members || {}).length || 0;
    }
    } catch {
      // Presence is optional, fail silently
    }
  }

  // Get avatar from Firestore if exists (not in DDD yet)
  let avatar: string | undefined;
  try {
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (spaceDoc.exists) {
      const data = spaceDoc.data();
      avatar = data?.avatarUrl || data?.avatar;
    }
  } catch {
    // Avatar is optional
  }

  const preview: SpacePreviewResponse = {
    id: space.id,
    name: space.name.value,
    description: space.description?.value,
    avatar,
    memberCount: canSeeMembers ? (space.memberCount ?? 0) : 0,
    onlineCount,
    recentMessage,
    upcomingEvent,
    deployedToolsCount: space.placedTools?.length ?? 0,
  };

  logger.info('Space preview fetched', { spaceId, hasRecentMessage: !!recentMessage, hasUpcomingEvent: !!upcomingEvent });

  return respond.success(preview);
});

export const GET = withCache(_GET, 'SHORT');
