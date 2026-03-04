/**
 * AI Space Seeding Cron
 *
 * Generates contextual creations (polls, brackets, RSVPs) for spaces
 * that lack recent human activity. Keeps the campus alive.
 *
 * POST /api/cron/seed-space-creations
 * Requires CRON_SECRET header.
 *
 * Logic:
 * 1. Find spaces without recent creations (last 7 days)
 * 2. Prioritize by member count (top spaces first)
 * 3. Generate 1 creation per space per run
 * 4. Max 20 spaces per run to stay within function timeout
 * 5. Rate limit: max 3 AI creations per space per week
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { generateSpaceCreation } from '@/lib/ai/space-creation-prompt';
import { createShellToolServer } from '@/lib/shells/create-shell-server';

const CRON_SECRET = process.env.CRON_SECRET;
const MAX_SPACES_PER_RUN = 20;
const MAX_AI_CREATIONS_PER_SPACE_PER_WEEK = 3;
const STALENESS_DAYS = 7;

export async function POST(request: Request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: Array<{ spaceId: string; spaceName: string; success: boolean; toolId?: string; error?: string }> = [];

  try {
    // 1. Find spaces that need seeding
    // Query spaces ordered by member count, with campusId filter
    const spacesSnapshot = await dbAdmin
      .collection('spaces')
      .where('campusId', '==', 'ub') // UB campus for launch
      .orderBy('memberCount', 'desc')
      .limit(100) // Get top 100, we'll filter further
      .get();

    if (spacesSnapshot.empty) {
      return NextResponse.json({ message: 'No spaces found', seeded: 0 });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - STALENESS_DAYS * 24 * 60 * 60 * 1000);

    // 2. Filter to spaces needing seeding
    const spacesToSeed: Array<{ id: string; name: string; description?: string; type?: string; category?: string; campusId: string; tags?: string[]; orgTypeName?: string; upcomingEvent?: { title: string; date?: string; type?: string } }> = [];

    for (const doc of spacesSnapshot.docs) {
      if (spacesToSeed.length >= MAX_SPACES_PER_RUN) break;

      const data = doc.data();
      const lastSeeded = data.metadata?.autoSeededAt
        ? new Date(data.metadata.autoSeededAt)
        : null;
      const aiCreationsThisWeek = data.metadata?.aiCreationsThisWeek ?? 0;

      // Skip if recently seeded (within staleness window)
      if (lastSeeded && lastSeeded > weekAgo) continue;

      // Skip if already at weekly AI creation limit
      if (aiCreationsThisWeek >= MAX_AI_CREATIONS_PER_SPACE_PER_WEEK) continue;

      // Check for recent human creations in this space
      const recentToolsSnapshot = await dbAdmin
        .collection('deployedTools')
        .where('spaceId', '==', doc.id)
        .where('creatorId', '!=', 'hive-system')
        .limit(1)
        .get();

      // Only seed spaces without recent human activity
      // (If humans are creating, let them drive the content)
      if (!recentToolsSnapshot.empty) {
        const latestTool = recentToolsSnapshot.docs[0].data();
        const deployedAt = latestTool.deployedAt ? new Date(latestTool.deployedAt) : null;
        if (deployedAt && deployedAt > weekAgo) continue;
      }

      // Check for upcoming events in this space
      let upcomingEvent: { title: string; date?: string; type?: string } | undefined;
      try {
        const eventsSnapshot = await dbAdmin
          .collection('events')
          .where('spaceId', '==', doc.id)
          .where('startDate', '>=', now)
          .orderBy('startDate', 'asc')
          .limit(1)
          .get();
        if (!eventsSnapshot.empty) {
          const eventData = eventsSnapshot.docs[0].data();
          const startDate = eventData.startDate?.toDate?.() ?? (eventData.startDate ? new Date(eventData.startDate) : null);
          upcomingEvent = {
            title: eventData.title || 'Upcoming event',
            date: startDate ? startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined,
            type: eventData.type ?? undefined,
          };
        }
      } catch {
        // Non-blocking — skip event context if query fails
      }

      spacesToSeed.push({
        id: doc.id,
        name: data.name || 'Unnamed Space',
        description: data.description ?? undefined,
        type: data.type ?? undefined,
        category: data.category ?? undefined,
        campusId: data.campusId || 'ub',
        tags: Array.isArray(data.tags) ? data.tags : undefined,
        orgTypeName: data.orgTypeName ?? undefined,
        upcomingEvent,
      });
    }

    // 3. Generate and create for each space
    for (const space of spacesToSeed) {
      try {
        const creation = await generateSpaceCreation({
          name: space.name,
          description: space.description,
          type: space.type,
          category: space.category,
          tags: space.tags,
          orgTypeName: space.orgTypeName,
          upcomingEvent: space.upcomingEvent,
        });

        if (!creation) {
          results.push({ spaceId: space.id, spaceName: space.name, success: false, error: 'Generation returned null' });
          continue;
        }

        const result = await createShellToolServer({
          title: creation.title,
          description: creation.description,
          shellFormat: creation.shellFormat,
          shellConfig: creation.shellConfig,
          spaceId: space.id,
          campusId: space.campusId,
        });

        if (result.success) {
          // Update space metadata for idempotency
          await dbAdmin.collection('spaces').doc(space.id).update({
            'metadata.autoSeededAt': now.toISOString(),
            'metadata.aiCreationsThisWeek': (await getAiCreationCount(space.id)) + 1,
          });
        }

        results.push({
          spaceId: space.id,
          spaceName: space.name,
          success: result.success,
          toolId: result.toolId || undefined,
          error: result.success ? undefined : 'Tool creation failed',
        });
      } catch (error) {
        results.push({
          spaceId: space.id,
          spaceName: space.name,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;

    logger.info('[cron] seed-space-creations complete', {
      spacesProcessed: results.length,
      successful,
      failed: results.length - successful,
      durationMs: duration,
    });

    return NextResponse.json({
      message: `Seeded ${successful}/${results.length} spaces`,
      seeded: successful,
      total: results.length,
      durationMs: duration,
      results,
    });
  } catch (error) {
    logger.error('[cron] seed-space-creations failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function getAiCreationCount(spaceId: string): Promise<number> {
  try {
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    return spaceDoc.data()?.metadata?.aiCreationsThisWeek ?? 0;
  } catch {
    return 0;
  }
}
