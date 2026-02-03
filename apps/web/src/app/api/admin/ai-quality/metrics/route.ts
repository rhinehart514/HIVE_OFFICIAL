/**
 * AI Quality Metrics API
 *
 * GET /api/admin/ai-quality/metrics
 *
 * Returns aggregated metrics for AI generation quality.
 * Requires admin authentication.
 *
 * SECURITY: campusId is derived from admin's authenticated session, not query params.
 * Admins can only view metrics for their associated campus unless they are super_admin.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import {
  getGenerationTrackerService,
  getFailureClassifierService,
  getEditTrackerService,
} from '@hive/core';

/**
 * GET /api/admin/ai-quality/metrics
 *
 * Query params:
 * - period: 'hour' | 'day' | 'week' | 'month' (default: 'day')
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin auth
    const auth = await validateApiAuth(request, { operation: 'admin-ai-metrics' });
    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'day') as 'hour' | 'day' | 'week' | 'month';

    // SECURITY: Use campusId from admin's authenticated session, not query params
    // This prevents admins from accessing metrics for campuses they don't manage
    const campusId = auth.campusId;

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    switch (period) {
      case 'hour':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Get metrics from all services
    const tracker = getGenerationTrackerService();
    const failureClassifier = getFailureClassifierService();
    const editTracker = getEditTrackerService();

    const [generationMetrics, failureStats, editPatterns] = await Promise.all([
      tracker.getMetrics(startDate, now, campusId),
      failureClassifier.getFailureStats(startDate, now, campusId),
      editTracker.getEditPatterns(startDate, now),
    ]);

    // Combine into unified response
    const metrics = {
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        granularity: period,
      },

      // Generation metrics
      generation: {
        total: generationMetrics.totalGenerations,
        uniqueUsers: generationMetrics.uniqueUsers,
        avgQualityScore: generationMetrics.avgQualityScore,
        scoreDistribution: generationMetrics.scoreDistribution,
        acceptanceRate: Math.round(generationMetrics.acceptanceRate * 100),
        partialAcceptRate: Math.round(generationMetrics.partialAcceptanceRate * 100),
        rejectionRate: Math.round(generationMetrics.rejectionRate * 100),
        deploymentRate: Math.round(generationMetrics.deploymentRate * 100),
        editRate: Math.round(generationMetrics.editRate * 100),
        abandonmentRate: Math.round(generationMetrics.abandonmentRate * 100),
      },

      // Performance metrics
      performance: {
        avgLatencyMs: generationMetrics.avgLatencyMs,
        p50LatencyMs: generationMetrics.p50LatencyMs,
        p95LatencyMs: generationMetrics.p95LatencyMs,
        p99LatencyMs: generationMetrics.p99LatencyMs,
        fallbackRate: Math.round(generationMetrics.fallbackRate * 100),
      },

      // Failure metrics
      failures: {
        total: failureStats.totalFailures,
        byType: failureStats.byType,
        byResolution: failureStats.byResolution,
        topErrors: failureStats.topErrors.slice(0, 5),
        avgRetries: failureStats.avgRetries,
        fallbackSuccessRate: Math.round(failureStats.fallbackSuccessRate * 100),
      },

      // Edit patterns (user corrections)
      edits: {
        totalSessions: editPatterns.totalEditSessions,
        avgEditsPerSession: Math.round(editPatterns.avgEditsPerSession * 10) / 10,
        avgElementsAdded: Math.round(editPatterns.avgElementsAdded * 10) / 10,
        avgElementsRemoved: Math.round(editPatterns.avgElementsRemoved * 10) / 10,
        avgConfigChanges: Math.round(editPatterns.avgConfigChanges * 10) / 10,
        mostRemovedElements: editPatterns.mostRemovedElements.slice(0, 5),
        mostAddedElements: editPatterns.mostAddedElements.slice(0, 5),
        outcomeDistribution: {
          deployed: Math.round(editPatterns.outcomeDistribution.deployed * 100),
          saved: Math.round(editPatterns.outcomeDistribution.saved * 100),
          discarded: Math.round(editPatterns.outcomeDistribution.discarded * 100),
        },
      },

      // Element usage
      elementUsage: generationMetrics.elementUsage,
      avgElementsPerTool: Math.round(generationMetrics.avgElementsPerTool * 10) / 10,

      // Top validation errors
      topValidationErrors: generationMetrics.topValidationErrors.slice(0, 10),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Error fetching AI quality metrics', { component: 'ai-quality-metrics' }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
