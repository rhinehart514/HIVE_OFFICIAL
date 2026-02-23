import { type NextRequest } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withCache } from '../../../../lib/cache-headers';

/**
 * GET /api/feed/global
 *
 * Public global activity feed — aggregates recent activity across ALL spaces.
 * No auth required (public feed makes the platform feel alive).
 * Returns: new members, events created, tools deployed, messages (summarized), RSVPs.
 */

export interface GlobalFeedItem {
  id: string;
  type: 'member_joined' | 'event_created' | 'tool_deployed' | 'message_summary' | 'rsvp' | 'tool_created' | 'space_created';
  headline: string;
  detail?: string;
  spaceId?: string;
  spaceName?: string;
  spaceHandle?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  toolId?: string;
  toolName?: string;
  eventId?: string;
  eventTitle?: string;
  timestamp: string;
}

async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const before = searchParams.get('before'); // ISO timestamp for pagination

  const items: GlobalFeedItem[] = [];
  const cutoff = before ? new Date(before) : new Date();
  const windowStart = new Date(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    // 1. New members joining spaces
    const membersSnap = await dbAdmin
      .collection('spaceMembers')
      .where('joinedAt', '>=', windowStart)
      .where('joinedAt', '<', cutoff)
      .orderBy('joinedAt', 'desc')
      .limit(15)
      .get();

    for (const doc of membersSnap.docs) {
      const d = doc.data();
      items.push({
        id: `member-${doc.id}`,
        type: 'member_joined',
        headline: `${d.displayName || d.userName || 'Someone'} joined ${d.spaceName || 'a space'}`,
        spaceId: d.spaceId,
        spaceName: d.spaceName,
        spaceHandle: d.spaceHandle,
        actorName: d.displayName || d.userName,
        actorAvatarUrl: d.avatarUrl,
        timestamp: toISO(d.joinedAt),
      });
    }

    // 2. Events created
    const eventsSnap = await dbAdmin
      .collection('events')
      .where('createdAt', '>=', windowStart)
      .where('createdAt', '<', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    for (const doc of eventsSnap.docs) {
      const d = doc.data();
      items.push({
        id: `event-${doc.id}`,
        type: 'event_created',
        headline: `New event: ${d.title || 'Untitled'}`,
        detail: d.description?.substring(0, 120),
        spaceId: d.spaceId,
        spaceName: d.spaceName,
        actorName: d.creatorName,
        eventId: doc.id,
        eventTitle: d.title,
        timestamp: toISO(d.createdAt),
      });
    }

    // 3. Tools created (from analytics_events)
    const toolEventsSnap = await dbAdmin
      .collection('analytics_events')
      .where('eventType', 'in', ['tool_created', 'tool_deployed'])
      .where('timestamp', '>=', windowStart)
      .where('timestamp', '<', cutoff)
      .orderBy('timestamp', 'desc')
      .limit(15)
      .get();

    for (const doc of toolEventsSnap.docs) {
      const d = doc.data();
      const isDeployed = d.eventType === 'tool_deployed';
      items.push({
        id: `tool-${doc.id}`,
        type: isDeployed ? 'tool_deployed' : 'tool_created',
        headline: isDeployed
          ? `${d.metadata?.toolName || 'A creation'} was deployed`
          : `${d.metadata?.toolName || 'A new creation'} was created`,
        toolId: d.toolId,
        toolName: d.metadata?.toolName,
        spaceId: d.spaceId || undefined,
        timestamp: toISO(d.timestamp),
      });
    }

    // 4. Recent messages (summarized — just counts per space, not content)
    const messagesSnap = await dbAdmin
      .collection('spaceMessages')
      .where('createdAt', '>=', windowStart)
      .where('createdAt', '<', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    // Group messages by space and summarize
    const messagesBySpace = new Map<string, { count: number; spaceName: string; spaceHandle?: string; latest: Date }>();
    for (const doc of messagesSnap.docs) {
      const d = doc.data();
      const sid = d.spaceId;
      if (!sid) continue;
      const ts = toDate(d.createdAt);
      const existing = messagesBySpace.get(sid);
      if (existing) {
        existing.count++;
        if (ts > existing.latest) existing.latest = ts;
      } else {
        messagesBySpace.set(sid, { count: 1, spaceName: d.spaceName || 'a space', spaceHandle: d.spaceHandle, latest: ts });
      }
    }

    for (const [spaceId, summary] of messagesBySpace) {
      items.push({
        id: `msgs-${spaceId}-${summary.latest.getTime()}`,
        type: 'message_summary',
        headline: `${summary.count} new message${summary.count > 1 ? 's' : ''} in ${summary.spaceName}`,
        spaceId,
        spaceName: summary.spaceName,
        spaceHandle: summary.spaceHandle,
        timestamp: summary.latest.toISOString(),
      });
    }

    // 5. RSVPs (from analytics_events)
    const rsvpSnap = await dbAdmin
      .collection('analytics_events')
      .where('eventType', '==', 'event_rsvp')
      .where('timestamp', '>=', windowStart)
      .where('timestamp', '<', cutoff)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    for (const doc of rsvpSnap.docs) {
      const d = doc.data();
      items.push({
        id: `rsvp-${doc.id}`,
        type: 'rsvp',
        headline: `Someone RSVP'd to ${d.metadata?.eventTitle || 'an event'}`,
        eventId: d.metadata?.eventId,
        eventTitle: d.metadata?.eventTitle,
        spaceId: d.spaceId || undefined,
        timestamp: toISO(d.timestamp),
      });
    }

    // Sort by timestamp descending and limit
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const result = items.slice(0, limit);

    return Response.json({
      success: true,
      data: {
        items: result,
        count: result.length,
        hasMore: items.length > limit,
        oldestTimestamp: result.length > 0 ? result[result.length - 1].timestamp : null,
      },
    });
  } catch (error) {
    logger.error('Global feed error', { error: error instanceof Error ? error.message : String(error) });
    return Response.json({
      success: true,
      data: { items: [], count: 0, hasMore: false, oldestTimestamp: null },
    });
  }
}

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  if (typeof val === 'object' && 'toDate' in (val as Record<string, unknown>)) return (val as { toDate: () => Date }).toDate();
  return new Date();
}

function toISO(val: unknown): string {
  return toDate(val).toISOString();
}

export const GET = withCache(handleGet as (req: NextRequest, ctx: unknown) => Promise<Response>, 'SHORT');
