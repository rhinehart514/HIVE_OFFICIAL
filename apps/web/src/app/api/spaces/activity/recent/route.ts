import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { withAuthAndErrors, getUserId, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { withCache } from '../../../../../lib/cache-headers';

/**
 * /api/spaces/activity/recent
 *
 * Aggregates recent activity across all user's spaces for the HQ dashboard.
 * Returns a unified feed of messages, events, and posts with real previews.
 */

interface RecentActivityItem {
  id: string;
  spaceId: string;
  spaceName: string;
  spaceHandle?: string;
  spaceAvatarUrl?: string;
  type: 'message' | 'event' | 'post';
  preview: string;
  authorName?: string;
  authorAvatarUrl?: string;
  timestamp: string;
  metadata?: {
    boardId?: string;
    boardName?: string;
    eventId?: string;
    postId?: string;
    messageId?: string;
  };
}

const _GET = withAuthAndErrors(async (request: AuthenticatedRequest, _context, respond) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request);

  if (!campusId) {
    return respond.error('Campus identification required', 'UNAUTHORIZED', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 30);

  // Get user's space memberships
  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .get();

  if (membershipsSnapshot.empty) {
    return respond.success({ items: [], count: 0 });
  }

  const spaceIds = membershipsSnapshot.docs.map(doc => doc.data().spaceId);

  // Get space details
  const spacesSnapshot = await dbAdmin
    .collection('spaces')
    .where('__name__', 'in', spaceIds.slice(0, 10))
    .get();

  const spaceMap = new Map<string, { name: string; handle?: string; avatarUrl?: string }>();
  spacesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    spaceMap.set(doc.id, {
      name: data.name,
      handle: data.handle,
      avatarUrl: data.avatarUrl,
    });
  });

  const activityItems: RecentActivityItem[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch recent messages from spaceMessages
  const messagesSnapshot = await dbAdmin
    .collection('spaceMessages')
    .where('spaceId', 'in', spaceIds.slice(0, 10))
    .where('createdAt', '>=', oneDayAgo)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  for (const doc of messagesSnapshot.docs) {
    const message = doc.data();
    const spaceInfo = spaceMap.get(message.spaceId);
    if (!spaceInfo) continue;
    if (message.senderId === userId) continue;

    const preview = message.content?.substring(0, 100) || 'New message';
    const timestamp = message.createdAt?.toDate?.() || new Date(message.createdAt);

    activityItems.push({
      id: `msg-${doc.id}`,
      spaceId: message.spaceId,
      spaceName: spaceInfo.name,
      spaceHandle: spaceInfo.handle,
      spaceAvatarUrl: spaceInfo.avatarUrl,
      type: 'message',
      preview: preview.length < message.content?.length ? `${preview}...` : preview,
      authorName: message.senderName,
      authorAvatarUrl: message.senderAvatarUrl,
      timestamp: timestamp.toISOString(),
      metadata: {
        boardId: message.boardId,
        messageId: doc.id,
      },
    });
  }

  // Fetch recent events
  const eventsSnapshot = await dbAdmin
    .collection('events')
    .where('spaceId', 'in', spaceIds.slice(0, 10))
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', oneDayAgo)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  for (const doc of eventsSnapshot.docs) {
    const event = doc.data();
    const spaceInfo = spaceMap.get(event.spaceId);
    if (!spaceInfo) continue;

    const startDate = event.startDate?.toDate?.() || new Date(event.startDate);
    const timestamp = event.createdAt?.toDate?.() || new Date(event.createdAt);

    activityItems.push({
      id: `event-${doc.id}`,
      spaceId: event.spaceId,
      spaceName: spaceInfo.name,
      spaceHandle: spaceInfo.handle,
      spaceAvatarUrl: spaceInfo.avatarUrl,
      type: 'event',
      preview: `${event.title} - ${formatEventDate(startDate)}`,
      authorName: event.creatorName,
      timestamp: timestamp.toISOString(),
      metadata: {
        eventId: doc.id,
      },
    });
  }

  // Fetch recent posts using collection group query
  const postsSnapshot = await dbAdmin
    .collectionGroup('posts')
    .where('createdAt', '>=', oneDayAgo)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();

  for (const doc of postsSnapshot.docs) {
    const post = doc.data();
    const pathParts = doc.ref.path.split('/');
    const spaceId = pathParts[1];

    if (!spaceIds.includes(spaceId)) continue;

    const spaceInfo = spaceMap.get(spaceId);
    if (!spaceInfo) continue;
    if (post.authorId === userId) continue;

    const preview = post.title || post.content?.substring(0, 100) || 'New post';
    const timestamp = post.createdAt?.toDate?.() || new Date(post.createdAt);

    activityItems.push({
      id: `post-${doc.id}`,
      spaceId: spaceId,
      spaceName: spaceInfo.name,
      spaceHandle: spaceInfo.handle,
      spaceAvatarUrl: spaceInfo.avatarUrl,
      type: 'post',
      preview,
      authorName: post.authorName,
      authorAvatarUrl: post.authorAvatarUrl,
      timestamp: timestamp.toISOString(),
      metadata: {
        postId: doc.id,
      },
    });

    if (activityItems.filter(i => i.type === 'post').length >= 10) break;
  }

  // Sort by timestamp and dedupe by space
  activityItems.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const seenSpaces = new Set<string>();
  const dedupedItems: RecentActivityItem[] = [];
  for (const item of activityItems) {
    if (!seenSpaces.has(item.spaceId)) {
      dedupedItems.push(item);
      seenSpaces.add(item.spaceId);
    }
    if (dedupedItems.length >= limit) break;
  }

  return respond.success({
    items: dedupedItems,
    count: activityItems.length,
  });
});

function formatEventDate(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (isToday) return `Today at ${time}`;
  if (isTomorrow) return `Tomorrow at ${time}`;

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${time}`;
}

export const GET = withCache(_GET as (req: NextRequest, ctx: unknown) => Promise<Response>, 'SHORT');
