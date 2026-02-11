import { withErrors } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { getEarnedBadges, getNextBadge } from '@hive/core';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/verify/[slug] — Public verified leadership record
 *
 * Slug format: {handle}-{spaceHandle}
 * Returns aggregated leadership metrics for public display.
 */
const _GET = withErrors(async (
  _request,
  { params }: { params: Promise<{ slug: string }> },
  respond,
) => {
  const { slug } = await params;

  if (!slug) {
    return respond.error('Slug is required', 'INVALID_INPUT', { status: 400 });
  }

  // Parse slug: handle-spaceHandle (split on first dash)
  const dashIndex = slug.indexOf('-');
  if (dashIndex === -1) {
    return respond.error('Invalid slug format. Expected: handle-spaceHandle', 'INVALID_INPUT', { status: 400 });
  }

  const handle = slug.slice(0, dashIndex);
  const spaceHandle = slug.slice(dashIndex + 1);

  if (!handle || !spaceHandle) {
    return respond.error('Both handle and space handle are required', 'INVALID_INPUT', { status: 400 });
  }

  try {
    // Find user by handle
    const usersSnap = await dbAdmin
      .collection('users')
      .where('handle', '==', handle)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return respond.error('User not found', 'NOT_FOUND', { status: 404 });
    }

    const userDoc = usersSnap.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Find space by handle
    const spacesSnap = await dbAdmin
      .collection('spaces')
      .where('handle', '==', spaceHandle)
      .limit(1)
      .get();

    if (spacesSnap.empty) {
      return respond.error('Space not found', 'NOT_FOUND', { status: 404 });
    }

    const spaceDoc = spacesSnap.docs[0];
    const spaceData = spaceDoc.data();
    const spaceId = spaceDoc.id;

    // Verify membership and leadership role
    const memberSnap = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', spaceId)
      .limit(1)
      .get();

    if (memberSnap.empty) {
      return respond.error('User is not a member of this space', 'NOT_FOUND', { status: 404 });
    }

    const memberData = memberSnap.docs[0].data();
    const role = memberData.role;
    const isLeader = ['owner', 'admin', 'moderator'].includes(role);

    if (!isLeader) {
      return respond.error('User is not a leader of this space', 'NOT_LEADER', { status: 404 });
    }

    // Aggregate metrics in parallel
    const [eventsSnap, toolsSnap, postsSnap, totalMembersSnap] = await Promise.all([
      // Events created by this leader in this space
      dbAdmin
        .collection('events')
        .where('spaceId', '==', spaceId)
        .where('organizerId', '==', userId)
        .get(),
      // Tools deployed to this space by this leader
      dbAdmin
        .collection('tools')
        .where('creatorId', '==', userId)
        .where('deployedSpaces', 'array-contains', spaceId)
        .get()
        .catch(() => ({ size: 0 })),
      // Posts/messages by this leader in this space
      dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('boards')
        .doc('main')
        .collection('posts')
        .where('authorId', '==', userId)
        .get()
        .catch(() => ({ size: 0 })),
      // Total members in space
      dbAdmin
        .collection('spaceMembers')
        .where('spaceId', '==', spaceId)
        .where('isActive', '!=', false)
        .get(),
    ]);

    // Calculate tenure
    const joinedAt = memberData.joinedAt?.toDate?.() || memberData.joinedAt;
    const tenureDays = joinedAt
      ? Math.floor((Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Evaluate badges
    const leaderMetrics = {
      eventsCreated: eventsSnap.size,
      toolsDeployed: typeof toolsSnap.size === 'number' ? toolsSnap.size : 0,
      messagesPosted: typeof postsSnap.size === 'number' ? postsSnap.size : 0,
      membersLed: totalMembersSnap.size || 0,
      tenureDays,
    };

    const earnedBadges = getEarnedBadges(leaderMetrics);
    const nextBadge = getNextBadge(leaderMetrics);

    const record = {
      user: {
        handle: userData.handle,
        fullName: userData.fullName || userData.displayName || handle,
        avatarUrl: userData.avatarUrl || null,
        reputation: userData.reputation || 0,
      },
      space: {
        handle: spaceData.handle,
        name: spaceData.name,
        memberCount: totalMembersSnap.size || spaceData.memberCount || 0,
        category: spaceData.category || null,
        avatarUrl: spaceData.avatarUrl || null,
      },
      leadership: {
        role,
        joinedAt: joinedAt ? new Date(joinedAt).toISOString() : null,
        tenureDays,
        isVerified: true,
      },
      metrics: {
        eventsCreated: eventsSnap.size,
        toolsDeployed: typeof toolsSnap.size === 'number' ? toolsSnap.size : 0,
        messagesPosted: typeof postsSnap.size === 'number' ? postsSnap.size : 0,
        membersLed: totalMembersSnap.size || 0,
      },
      badges: {
        earned: earnedBadges.map((b: { id: string; name: string; description: string; tier: string; icon: string }) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          tier: b.tier,
          icon: b.icon,
        })),
        next: nextBadge ? {
          name: nextBadge.badge.name,
          description: nextBadge.badge.description,
          progress: Math.round(nextBadge.progress * 100),
          current: nextBadge.current,
          threshold: nextBadge.threshold,
        } : null,
        total: earnedBadges.length,
      },
      generatedAt: new Date().toISOString(),
    };

    logger.info('Leadership record accessed', {
      component: 'verify-api',
      handle,
      spaceHandle,
    });

    return respond.success(record);
  } catch (error) {
    logger.error('Failed to generate leadership record', {
      component: 'verify-api',
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return respond.error('Failed to generate record', 'INTERNAL_ERROR', { status: 500 });
  }
});

export const GET = withCache(_GET, 'LONG');
