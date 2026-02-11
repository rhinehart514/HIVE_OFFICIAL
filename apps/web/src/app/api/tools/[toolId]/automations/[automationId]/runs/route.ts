/**
 * Automation Runs API Route
 *
 * Sprint 4: Automations
 *
 * Endpoints:
 * - GET: List recent automation runs (paginated, last 100)
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import type { ToolAutomationRun } from '@hive/core';
import { MAX_AUTOMATION_RUNS_HISTORY } from '@hive/core';
import { withCache } from '../../../../../../../lib/cache-headers';

// ============================================================================
// HELPERS
// ============================================================================

async function verifyAccess(
  deploymentId: string,
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const deploymentRef = dbAdmin.collection('deployedTools').doc(deploymentId);
  const deploymentDoc = await deploymentRef.get();

  if (!deploymentDoc.exists) {
    return { allowed: false, error: 'Tool not found' };
  }

  const deploymentData = deploymentDoc.data();
  const toolOwnerId = deploymentData?.createdBy || deploymentData?.ownerId;

  if (deploymentData?.deployedTo === 'space' && deploymentData?.targetId) {
    const { isSpaceMember } = await import('@/lib/space-members');
    const isMember = await isSpaceMember(deploymentData.targetId, userId);

    if (!isMember && toolOwnerId !== userId) {
      return { allowed: false, error: 'Access denied' };
    }
  }

  return { allowed: true };
}

// ============================================================================
// GET - List Automation Runs
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ toolId: string; automationId: string }> }
) {
  const { toolId: deploymentId, automationId } = await params;
  const userId = getUserId(request);

  try {
    const access = await verifyAccess(deploymentId, userId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.error === 'Tool not found' ? 404 : 403 }
      );
    }

    // Verify automation exists
    const automationRef = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automations')
      .doc(automationId);

    const automationDoc = await automationRef.get();

    if (!automationDoc.exists) {
      return NextResponse.json(
        { error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const afterParam = url.searchParams.get('after');
    const statusParam = url.searchParams.get('status');

    const limit = Math.min(
      parseInt(limitParam || '50', 10),
      MAX_AUTOMATION_RUNS_HISTORY
    );

    // Build query
    let query = dbAdmin
      .collection('deployedTools')
      .doc(deploymentId)
      .collection('automationRuns')
      .where('automationId', '==', automationId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    // Filter by status if provided
    if (statusParam && ['success', 'skipped', 'failed'].includes(statusParam)) {
      query = query.where('status', '==', statusParam);
    }

    // Pagination with cursor
    if (afterParam) {
      const afterDoc = await dbAdmin
        .collection('deployedTools')
        .doc(deploymentId)
        .collection('automationRuns')
        .doc(afterParam)
        .get();

      if (afterDoc.exists) {
        query = query.startAfter(afterDoc);
      }
    }

    const snapshot = await query.get();

    const runs: ToolAutomationRun[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        automationId: data.automationId,
        deploymentId: data.deploymentId,
        timestamp: data.timestamp?.toDate?.()?.toISOString?.() || data.timestamp,
        status: data.status,
        triggerType: data.triggerType,
        triggerData: data.triggerData,
        conditionResults: data.conditionResults,
        actionsExecuted: data.actionsExecuted || [],
        error: data.error,
        duration: data.duration || 0,
      };
    });

    // Calculate summary stats
    const stats = {
      total: runs.length,
      success: runs.filter((r) => r.status === 'success').length,
      skipped: runs.filter((r) => r.status === 'skipped').length,
      failed: runs.filter((r) => r.status === 'failed').length,
      avgDuration:
        runs.length > 0
          ? Math.round(runs.reduce((sum, r) => sum + r.duration, 0) / runs.length)
          : 0,
    };

    // Get cursor for next page
    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = lastDoc ? lastDoc.id : undefined;
    const hasMore = snapshot.docs.length === limit;

    return NextResponse.json({
      runs,
      stats,
      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    logger.error('[automation-runs] Error fetching runs', {
      deploymentId,
      automationId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch automation runs' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const _GET = withAuthAndErrors(handleGet);

export const GET = withCache(_GET, 'SHORT');
