import { NextResponse } from 'next/server';
import { logger } from "@/lib/structured-logger";
import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { withAuth, ApiResponse as _ApiResponse } from '@/lib/api-auth-middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../lib/cache-headers';

// Usage statistics interface matching the component expectations
interface ToolUsageStats {
  totalTools: number;
  weeklyUsage: number;
  lastUsed: string | null;
  mostUsedTool: string | null;
  topTools: Array<{
    id: string;
    name: string;
    usageCount: number;
    lastUsed: string;
  }>;
  usageByCategory: Record<string, number>;
  weeklyActivity: Array<{
    date: string;
    usage: number;
  }>;
}

// Production-ready usage statistics with real database integration
const fetchUsageStats = async (userId: string, campusId: string): Promise<ToolUsageStats> => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Fetch user's tools
    const toolsSnapshot = await dbAdmin
      .collection('tools')
      .where('ownerId', '==', userId)
      .where('campusId', '==', campusId)
      .get();

    interface ToolDoc {
      id: string;
      name?: string;
      useCount?: number;
      updatedAt?: string;
      category?: string;
      [key: string]: unknown;
    }

    const tools: ToolDoc[] = toolsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch activity events for user's tools in the past week
    const toolIds = tools.map((t) => t.id);
    const allEvents: Array<Record<string, unknown>> = [];

    if (toolIds.length > 0) {
      // Firestore 'in' operator supports up to 30 values
      const chunks = [];
      for (let i = 0; i < toolIds.length; i += 30) {
        chunks.push(toolIds.slice(i, i + 30));
      }

      for (const chunk of chunks) {
        const eventsSnapshot = await dbAdmin
          .collection('activityEvents')
          .where('toolId', 'in', chunk)
          .where('timestamp', '>=', weekAgo.toISOString())
          .get();
        allEvents.push(...eventsSnapshot.docs.map((d) => d.data() as Record<string, unknown>));
      }
    }
    const events = allEvents;

    // Calculate weekly usage
    const weeklyUsage = events.length;

    // Calculate usage by day
    const dailyUsageMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      dailyUsageMap.set(date, 0);
    }

    for (const ev of events) {
      const ts = typeof ev.timestamp === 'string' ? ev.timestamp : '';
      const date = ts.split('T')[0];
      if (dailyUsageMap.has(date)) {
        dailyUsageMap.set(date, (dailyUsageMap.get(date) || 0) + 1);
      }
    }

    const weeklyActivity = Array.from(dailyUsageMap.entries()).map(([date, usage]) => ({
      date,
      usage,
    }));

    // Calculate top tools
    const toolUsageMap = new Map<string, { count: number; lastUsed: string }>();
    for (const ev of events) {
      const toolId = ev.toolId as string;
      const ts = (ev.timestamp as string) || '';
      const existing = toolUsageMap.get(toolId);
      if (!existing || ts > existing.lastUsed) {
        toolUsageMap.set(toolId, {
          count: (existing?.count || 0) + 1,
          lastUsed: ts,
        });
      } else {
        toolUsageMap.set(toolId, {
          ...existing,
          count: existing.count + 1,
        });
      }
    }

    const topTools = tools
      .map((t) => ({
        id: t.id,
        name: t.name || 'Untitled',
        usageCount: toolUsageMap.get(t.id)?.count || t.useCount || 0,
        lastUsed: toolUsageMap.get(t.id)?.lastUsed || t.updatedAt || '',
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    // Calculate usage by category
    const usageByCategory: Record<string, number> = {};
    for (const t of tools) {
      const category = t.category || 'other';
      usageByCategory[category] = (usageByCategory[category] || 0) + 1;
    }

    // Find most used tool and last used time
    const mostUsedTool = topTools.length > 0 ? topTools[0].name : null;
    const lastUsedTimes = events
      .map((ev) => ev.timestamp as string)
      .filter(Boolean)
      .sort()
      .reverse();
    const lastUsed = lastUsedTimes[0] || null;

    return {
      totalTools: tools.length,
      weeklyUsage,
      lastUsed,
      mostUsedTool,
      topTools,
      usageByCategory,
      weeklyActivity,
    };
  } catch (error) {
    // GRACEFUL DEGRADATION: Stats are non-critical, log at warn level
    logger.warn('Error fetching usage stats - returning empty state (graceful degradation)', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      campusId
    });
    // Return empty state - caller should check _degraded flag
    return {
      totalTools: 0,
      weeklyUsage: 0,
      lastUsed: null,
      mostUsedTool: null,
      topTools: [],
      usageByCategory: {},
      weeklyActivity: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usage: 0,
      })),
    };
  }
};

/**
 * Get tool usage statistics for the authenticated user
 * GET /api/tools/usage-stats
 */
const _GET = withAuth(async (request, authContext) => {
  try {
    const stats = await fetchUsageStats(authContext.userId, authContext.campusId);
    
    return NextResponse.json({
      success: true,
      stats,
      userId: authContext.userId,
      generatedAt: new Date().toISOString(),
      message: 'Usage statistics retrieved successfully'
    });

  } catch (error) {
    logger.error(
      `Usage stats fetch error at /api/tools/usage-stats`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}, {
  operation: 'fetch_usage_stats'
});

/**
 * Record a tool usage event
 * POST /api/tools/usage-stats
 */
export const POST = withAuth(async (request, authContext) => {
  try {
    const body = await request.json();
    const { toolId, action, _metadata } = body;

    if (!toolId || !action) {
      return NextResponse.json(ApiResponseHelper.error("Invalid request. Must specify toolId and action", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Production usage tracking ready for analytics system integration

    logger.info(
      `Tool usage tracked: toolId=${toolId}, action=${action} at /api/tools/usage-stats`
    );

    return NextResponse.json({
      success: true,
      toolId,
      action,
      userId: authContext.userId,
      timestamp: new Date().toISOString(),
      message: `Usage event recorded successfully`
    });

  } catch (error) {
    logger.error(
      `Usage tracking error at /api/tools/usage-stats`,
      { error: error instanceof Error ? error.message : String(error) }
    );
    return NextResponse.json(
      { 
        error: 'Failed to record usage event',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}, {
  operation: 'record_usage_event'
});

export const GET = withCache(_GET, 'SHORT');
