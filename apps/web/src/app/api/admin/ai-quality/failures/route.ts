/**
 * AI Failures List API
 *
 * GET /api/admin/ai-quality/failures
 *
 * Returns list of recent AI generation failures for debugging.
 * Requires admin authentication.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import { getFailureClassifierService, type FailureType } from '@hive/core';

/**
 * GET /api/admin/ai-quality/failures
 *
 * Query params:
 * - type: optional filter by failure type
 * - limit: number of records (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const auth = await validateApiAuth(request, { operation: 'admin-ai-failures' });
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as FailureType | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    const classifier = getFailureClassifierService();

    let failures;

    if (type) {
      failures = await classifier.getFailuresByType(type, limit);
    } else {
      failures = await classifier.getRecentFailures(limit);
    }

    // Transform for response (truncate long strings, format dates)
    const transformed = failures.map(fail => ({
      id: fail.id,
      generationId: fail.generationId,
      userId: fail.userId ? `${fail.userId.slice(0, 8)}...` : 'anonymous',

      // Context
      prompt: fail.prompt.slice(0, 100) + (fail.prompt.length > 100 ? '...' : ''),
      model: fail.model,
      promptVersion: fail.promptVersion,

      // Failure details
      failureType: fail.failureType,
      errorCode: fail.errorCode,
      errorMessage: fail.errorMessage.slice(0, 200) + (fail.errorMessage.length > 200 ? '...' : ''),
      hasStackTrace: !!fail.stackTrace,
      hasPartialResponse: !!fail.partialResponse,

      // Resolution
      resolvedBy: fail.resolvedBy,
      retryCount: fail.retryCount,
      fallbackSucceeded: fail.fallbackSucceeded,

      // Timing
      durationMs: fail.durationMs,
      createdAt: fail.createdAt,
    }));

    return NextResponse.json({
      failures: transformed,
      count: transformed.length,
      filters: {
        type,
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching AI failures', { component: 'ai-quality-failures' }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      { error: 'Failed to fetch failures' },
      { status: 500 }
    );
  }
}
