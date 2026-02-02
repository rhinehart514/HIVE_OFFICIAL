import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

/**
 * /api/spaces/attention
 *
 * Aggregates action items across all user's spaces:
 * - Events requiring RSVP (user hasn't responded)
 * - Open polls (user hasn't voted)
 * - Unread mentions
 * - Approaching deadlines
 *
 * Returns items sorted by urgency and deadline.
 */

interface AttentionItem {
  id: string;
  type: 'vote' | 'rsvp' | 'deadline' | 'mention';
  spaceId: string;
  spaceName: string;
  spaceAvatarUrl?: string;
  title: string;
  urgency: 'low' | 'medium' | 'high';
  deadline?: string;
  metadata?: {
    eventId?: string;
    pollId?: string;
    messageId?: string;
    componentId?: string;
  };
}

// GET - Fetch attention items for user
export const GET = withAuthAndErrors(async (request: AuthenticatedRequest) => {
  const userId = getUserId(request);
  const campusId = getCampusId(request); // Guaranteed by auth middleware - no fallback needed

  // Get user's space memberships
  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .get();

  if (membershipsSnapshot.empty) {
    return NextResponse.json({
      items: [],
      count: 0,
    });
  }

  const spaceIds = membershipsSnapshot.docs.map(doc => doc.data().spaceId);

  // Get space details for names/avatars
  const spacesSnapshot = await dbAdmin
    .collection('spaces')
    .where('__name__', 'in', spaceIds.slice(0, 10)) // Firestore 'in' limit
    .get();

  const spaceMap = new Map<string, { name: string; avatarUrl?: string }>();
  spacesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    spaceMap.set(doc.id, { name: data.name, avatarUrl: data.avatarUrl });
  });

  const attentionItems: AttentionItem[] = [];
  const now = new Date();

  // Fetch pending RSVPs (events requiring response)
  const eventsSnapshot = await dbAdmin
    .collection('events')
    .where('spaceId', 'in', spaceIds.slice(0, 10))
    .where('campusId', '==', campusId)
    .where('requiredRSVP', '==', true)
    .where('startDate', '>=', now)
    .orderBy('startDate', 'asc')
    .limit(20)
    .get();

  // Check which events user has already RSVP'd to
  // RSVPs are stored as subcollections: events/${eventId}/rsvps/${userId}
  const rsvpdEventIds = new Set<string>();

  // Batch check RSVPs for each event
  const rsvpChecks = eventsSnapshot.docs.map(async (doc) => {
    const rsvpDoc = await dbAdmin
      .collection('events')
      .doc(doc.id)
      .collection('rsvps')
      .doc(userId)
      .get();
    if (rsvpDoc.exists) {
      rsvpdEventIds.add(doc.id);
    }
  });
  await Promise.all(rsvpChecks);

  for (const doc of eventsSnapshot.docs) {
    if (rsvpdEventIds.has(doc.id)) continue; // Already RSVP'd

    const event = doc.data();
    const spaceInfo = spaceMap.get(event.spaceId);
    const startDate = event.startDate?.toDate?.() || new Date(event.startDate);
    const deadline = event.rsvpDeadline?.toDate?.() || startDate;

    // Calculate urgency based on deadline proximity
    let urgency: 'low' | 'medium' | 'high' = 'low';
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDeadline < 24) urgency = 'high';
    else if (hoursUntilDeadline < 72) urgency = 'medium';

    attentionItems.push({
      id: `rsvp-${doc.id}`,
      type: 'rsvp',
      spaceId: event.spaceId,
      spaceName: spaceInfo?.name || 'Unknown Space',
      spaceAvatarUrl: spaceInfo?.avatarUrl,
      title: event.title,
      urgency,
      deadline: deadline.toISOString(),
      metadata: { eventId: doc.id },
    });
  }

  // TODO: Polls are stored via DDD domain services in chat messages
  // Future enhancement: Add poll attention items when we have a queryable index

  // Fetch unread mentions
  const mentionsSnapshot = await dbAdmin
    .collection('notifications')
    .where('userId', '==', userId)
    .where('type', '==', 'mention')
    .where('read', '==', false)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  for (const doc of mentionsSnapshot.docs) {
    const mention = doc.data();
    const spaceInfo = spaceMap.get(mention.spaceId);

    // Mentions are always medium urgency (attention-grabbing but not deadline-driven)
    attentionItems.push({
      id: `mention-${doc.id}`,
      type: 'mention',
      spaceId: mention.spaceId,
      spaceName: spaceInfo?.name || 'Unknown Space',
      spaceAvatarUrl: spaceInfo?.avatarUrl,
      title: mention.preview || 'You were mentioned',
      urgency: 'medium',
      metadata: { messageId: mention.sourceId },
    });
  }

  // Sort by urgency (high first) then deadline (soonest first)
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  attentionItems.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;

    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  return NextResponse.json({
    items: attentionItems.slice(0, 20), // Cap at 20 items
    count: attentionItems.length,
  });
});
