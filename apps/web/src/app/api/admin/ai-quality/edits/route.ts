/**
 * AI Edits List API
 *
 * GET /api/admin/ai-quality/edits
 *
 * Returns list of user edits on AI-generated tools.
 * This is the "gold signal" for understanding where AI misses the mark.
 * Requires admin authentication.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import { getEditTrackerService } from '@hive/core';

/**
 * GET /api/admin/ai-quality/edits
 *
 * Query params:
 * - generationId: optional filter by generation
 * - limit: number of records (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const auth = await validateApiAuth(request, { operation: 'admin-ai-edits' });
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const editTracker = getEditTrackerService();

    let edits;

    if (generationId) {
      // Get edits for a specific generation
      const record = await editTracker.getEditsForGeneration(generationId);
      edits = record ? [record] : [];
    } else {
      // Get recent edits
      edits = await editTracker.getRecentEdits(limit);
    }

    // Transform for response
    const transformed = edits.map(edit => ({
      id: edit.id,
      generationId: edit.generationId,
      userId: edit.userId ? `${edit.userId.slice(0, 8)}...` : 'unknown',

      // Summary
      summary: edit.summary,
      editCount: edit.editCount,

      // Timing
      timeToFirstEditMs: edit.timeToFirstEditMs,
      totalEditTimeMs: edit.totalEditTimeMs,

      // Outcome
      finalOutcome: edit.finalOutcome,

      // Individual edits (limit to first 20 for response size)
      edits: edit.edits.slice(0, 20).map(e => ({
        type: e.type,
        elementType: e.elementType,
        instanceId: e.instanceId,
        field: e.field,
        // Only include value summaries, not full values
        hasOldValue: e.oldValue !== undefined,
        hasNewValue: e.newValue !== undefined,
      })),
      hasMoreEdits: edit.edits.length > 20,
      totalEdits: edit.edits.length,

      // Timestamps
      createdAt: edit.createdAt,
      completedAt: edit.completedAt,
    }));

    return NextResponse.json({
      edits: transformed,
      count: transformed.length,
      filters: {
        generationId,
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching AI edits', { component: 'ai-quality-edits' }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      { error: 'Failed to fetch edits' },
      { status: 500 }
    );
  }
}
