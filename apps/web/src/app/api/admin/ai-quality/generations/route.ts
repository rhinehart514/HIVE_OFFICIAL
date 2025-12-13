/**
 * AI Generations List API
 *
 * GET /api/admin/ai-quality/generations
 *
 * Returns list of recent AI generations for inspection.
 * Requires admin authentication.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import { getGenerationTrackerService, type AIGenerationRecord } from '@hive/core';

/**
 * GET /api/admin/ai-quality/generations
 *
 * Query params:
 * - userId: optional filter by user
 * - sessionId: optional filter by session
 * - limit: number of records (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const auth = await validateApiAuth(request, { operation: 'admin-ai-generations' });
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const tracker = getGenerationTrackerService();

    let generations: AIGenerationRecord[];

    if (sessionId) {
      generations = await tracker.getSessionGenerations(sessionId);
    } else if (userId) {
      generations = await tracker.getRecentGenerations(userId, limit);
    } else {
      // Get recent for any user - would need a new method or use Firestore directly
      // For now, return empty if no filter
      generations = [];
    }

    // Transform for response (remove sensitive data, format dates)
    const transformed = generations.map(gen => ({
      id: gen.id,
      userId: gen.userId ? `${gen.userId.slice(0, 8)}...` : 'anonymous', // Truncate for privacy
      sessionId: gen.sessionId,
      prompt: gen.prompt.slice(0, 100) + (gen.prompt.length > 100 ? '...' : ''),
      promptLength: gen.promptLength,
      isIteration: gen.isIteration,

      // Model info
      model: gen.model,
      promptVersion: gen.promptVersion,

      // Output summary
      elementCount: gen.elementCount,
      connectionCount: gen.connectionCount,
      elementTypes: gen.elementTypes,
      layout: gen.layout,

      // Quality
      validation: {
        valid: gen.validation.valid,
        score: gen.validation.score.overall,
        scores: gen.validation.score,
        errorCount: gen.validation.errorCount,
        warningCount: gen.validation.warningCount,
        errorCodes: gen.validation.errorCodes,
      },
      gateDecision: gen.gateDecision,
      modifications: gen.modifications,

      // Performance
      latencyMs: gen.latencyMs,
      tokenCount: gen.tokenCount,
      retryCount: gen.retryCount,
      usedFallback: gen.usedFallback,

      // Outcome
      outcome: gen.outcome,
      timeToFirstAction: gen.timeToFirstAction,

      // Timestamps
      createdAt: gen.createdAt,
      updatedAt: gen.updatedAt,
    }));

    return NextResponse.json({
      generations: transformed,
      count: transformed.length,
      filters: {
        userId,
        sessionId,
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching AI generations', { component: 'ai-quality-generations' }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    );
  }
}
