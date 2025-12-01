import type { NextRequest } from 'next/server';
import { withAuthAndErrors, type AuthenticatedRequest, getUserId } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import { ApiResponseHelper } from '@/lib/api-response-types';

// GET /api/tools/[toolId]/analytics
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ toolId: string }> },
  respond,
) => {
  const _userId = getUserId(request as AuthenticatedRequest);
  const { toolId } = await params;

  // Ensure tool exists and campus matches
  const toolDoc = await dbAdmin.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const tool = toolDoc.data();
  if (tool?.campusId && tool.campusId !== CURRENT_CAMPUS_ID) {
    return respond.error('Access denied for this campus', 'FORBIDDEN', { status: 403 });
  }

  // Time range
  const url = new URL(request.url);
  const range = (url.searchParams.get('range') as '7d' | '30d' | '90d') || '7d';
  const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch events for this tool in range
  const eventsSnapshot = await dbAdmin
    .collection('analytics_events')
    .where('toolId', '==', toolId)
    .where('timestamp', '>=', since)
    .get();

  const events = eventsSnapshot.docs.map((d) => d.data() as Record<string, unknown>);

  // Build daily usage map
  const dailyMap = new Map<string, { usage: number; users: Set<string> }>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { usage: 0, users: new Set() });
  }

  let totalUsage = 0;
  const activeUsersSet = new Set<string>();
  for (const ev of events) {
    const ts = ev.timestamp && (typeof ev.timestamp === 'string' || typeof ev.timestamp === 'number' || ev.timestamp instanceof Date) ? new Date(ev.timestamp) : new Date();
    const key = ts.toISOString().slice(0, 10);
    if (!dailyMap.has(key)) continue;
    const bucket = dailyMap.get(key)!;
    bucket.usage += 1;
    if (ev.userId && typeof ev.userId === 'string') {
      bucket.users.add(ev.userId);
      activeUsersSet.add(ev.userId);
    }
    totalUsage += 1;
  }

  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, usage: v.usage, users: v.users.size }));

  // Spaces usage from deployments
  const depSnapshot = await dbAdmin
    .collection('deployedTools')
    .where('toolId', '==', toolId)
    .where('status', '==', 'active')
    .get();
  const spaces: Array<{ name: string; usage: number; members: number }> = [];
  for (const d of depSnapshot.docs) {
    const dep = d.data() as Record<string, unknown>;
    if (dep.deployedTo === 'space') {
      const spaceDoc = await dbAdmin.collection('spaces').doc(dep.targetId as string).get();
      const spaceData = spaceDoc.exists ? (spaceDoc.data() as Record<string, unknown>) : null;
      const name = spaceData?.name ? String(spaceData.name) : 'Space';
      const members = spaceData?.members ? Object.keys(spaceData.members as Record<string, unknown>).length : 0;
      spaces.push({ name, usage: (dep.usageCount as number) || 0, members });
    }
  }
  spaces.sort((a, b) => b.usage - a.usage);

  // Feature usage (best-effort from event metadata)
  const featureMap = new Map<string, number>();
  for (const ev of events) {
    const metadata = ev.metadata as Record<string, unknown> | undefined;
    const feature = metadata?.feature || ev.feature;
    if (!feature || typeof feature !== 'string') continue;
    featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
  }
  const features = Array.from(featureMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([feature, count]) => ({ feature, usage: count, percentage: 0 }));

  const featuresTotal = features.reduce((s, f) => s + f.usage, 0) || 1;
  for (const f of features) f.percentage = Math.round((f.usage / featuresTotal) * 100);

  // Reviews for ratings + comments
  const reviewsSnapshot = await dbAdmin
    .collection('toolReviews')
    .where('toolId', '==', toolId)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .where('status', '==', 'published')
    .get();

  const reviews = reviewsSnapshot.docs.map((d) => d.data() as Record<string, unknown>);
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + ((r.rating as number) || 0), 0) / totalReviews) * 10) / 10 : 0;
  const ratingsDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const rating = r.rating as number;
    if (rating >= 1 && rating <= 5) {
      ratingsDist[rating] = (ratingsDist[rating] || 0) + 1;
    }
  }

  const recentComments = reviews
    .sort((a, b) => new Date((b.createdAt as string) || 0).getTime() - new Date((a.createdAt as string) || 0).getTime())
    .slice(0, 5)
    .map((r) => ({
      user: (r.userId as string) || 'User',
      comment: (r.title as string) || (r.content as string) || '',
      rating: (r.rating as number) || 0,
      date: (r.createdAt as string) || ''
    }));

  const payload = {
    overview: {
      totalUsage,
      activeUsers: activeUsersSet.size,
      avgRating,
      downloads: (tool?.installCount || 0),
    },
    usage: {
      daily,
      spaces,
      features,
    },
    feedback: {
      ratings: [1, 2, 3, 4, 5].reverse().map((r) => ({ rating: r, count: ratingsDist[r] || 0 })),
      comments: recentComments,
    },
  };

  return respond.success(payload);
});

