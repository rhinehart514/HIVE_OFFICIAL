/**
 * Tool Lifecycle Cron Endpoint
 *
 * Transitions deployed tools through lifecycle stages based on scheduled dates:
 * - scheduled → active (when activateAt <= now)
 * - active → sunset (when sunsetAt <= now)
 * - sunset → archived (when archiveAt <= now, sets visible: false)
 *
 * POST /api/cron/tool-lifecycle
 *
 * Requires CRON_SECRET header for security.
 */

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { withCache } from '../../../../lib/cache-headers';

const CRON_SECRET = process.env.CRON_SECRET;

interface TransitionResult {
  deploymentId: string;
  spaceId: string | null;
  fromStage: string;
  toStage: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: TransitionResult[] = [];
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    // Process transitions across both placed_tools and deployedTools

    // 1. Query placed_tools with lifecycle transitions
    await processPlacedTools(nowIso, now, results);

    // 2. Query deployedTools with lifecycle transitions
    await processDeployedTools(nowIso, now, results);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logger.info('Tool lifecycle cron processed', {
      total: results.length,
      success: successCount,
      failed: failCount,
    });

    return NextResponse.json({
      processed: results.length,
      success: successCount,
      failed: failCount,
      results,
      timestamp: nowIso,
    });
  } catch (error) {
    logger.error('Tool lifecycle cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processPlacedTools(
  nowIso: string,
  _now: Date,
  results: TransitionResult[]
): Promise<void> {
  const spacesSnapshot = await dbAdmin.collection('spaces').get();

  for (const spaceDoc of spacesSnapshot.docs) {
    const spaceId = spaceDoc.id;

    // Get placed_tools that have lifecycle transitions
    const placedToolsSnapshot = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('placed_tools')
      .where('lifecycle.stage', 'in', ['scheduled', 'active', 'sunset'])
      .get();

    if (placedToolsSnapshot.empty) continue;

    for (const toolDoc of placedToolsSnapshot.docs) {
      const data = toolDoc.data();
      const lifecycle = data.lifecycle as {
        stage: string;
        transitions?: Record<string, string>;
        sunsetMessage?: string;
      };

      if (!lifecycle?.transitions) continue;

      const transition = evaluateTransition(lifecycle.stage, lifecycle.transitions, nowIso);
      if (!transition) continue;

      try {
        const updates: Record<string, unknown> = {
          'lifecycle.stage': transition.toStage,
        };

        // Archive = hide from space
        if (transition.toStage === 'archived') {
          updates.visible = false;
          updates.status = 'archived';
        }

        // Activate = make visible
        if (transition.toStage === 'active') {
          updates.visible = true;
          updates.status = 'active';
        }

        await toolDoc.ref.update(updates);

        results.push({
          deploymentId: toolDoc.id,
          spaceId,
          fromStage: transition.fromStage,
          toStage: transition.toStage,
          success: true,
        });

        logger.info('Tool lifecycle transition', {
          deploymentId: toolDoc.id,
          spaceId,
          from: transition.fromStage,
          to: transition.toStage,
        });
      } catch (error) {
        results.push({
          deploymentId: toolDoc.id,
          spaceId,
          fromStage: lifecycle.stage,
          toStage: transition.toStage,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

async function processDeployedTools(
  nowIso: string,
  _now: Date,
  results: TransitionResult[]
): Promise<void> {
  const deploymentsSnapshot = await dbAdmin
    .collection('deployedTools')
    .where('lifecycle.stage', 'in', ['scheduled', 'active', 'sunset'])
    .get();

  for (const toolDoc of deploymentsSnapshot.docs) {
    const data = toolDoc.data();
    const lifecycle = data.lifecycle as {
      stage: string;
      transitions?: Record<string, string>;
      sunsetMessage?: string;
    };

    if (!lifecycle?.transitions) continue;

    const transition = evaluateTransition(lifecycle.stage, lifecycle.transitions, nowIso);
    if (!transition) continue;

    try {
      const updates: Record<string, unknown> = {
        'lifecycle.stage': transition.toStage,
      };

      if (transition.toStage === 'archived') {
        updates.visible = false;
        updates.status = 'archived';
      }

      if (transition.toStage === 'active') {
        updates.status = 'active';
      }

      await toolDoc.ref.update(updates);

      results.push({
        deploymentId: toolDoc.id,
        spaceId: data.targetId || null,
        fromStage: transition.fromStage,
        toStage: transition.toStage,
        success: true,
      });

      logger.info('Tool lifecycle transition (deployedTools)', {
        deploymentId: toolDoc.id,
        from: transition.fromStage,
        to: transition.toStage,
      });
    } catch (error) {
      results.push({
        deploymentId: toolDoc.id,
        spaceId: data.targetId || null,
        fromStage: lifecycle.stage,
        toStage: transition.toStage,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function evaluateTransition(
  currentStage: string,
  transitions: Record<string, string>,
  nowIso: string
): { fromStage: string; toStage: string } | null {
  // Check transitions in order: activate → sunset → archive
  if (currentStage === 'scheduled' && transitions.activateAt && transitions.activateAt <= nowIso) {
    return { fromStage: 'scheduled', toStage: 'active' };
  }

  if (currentStage === 'active' && transitions.sunsetAt && transitions.sunsetAt <= nowIso) {
    return { fromStage: 'active', toStage: 'sunset' };
  }

  if (currentStage === 'sunset' && transitions.archiveAt && transitions.archiveAt <= nowIso) {
    return { fromStage: 'sunset', toStage: 'archived' };
  }

  return null;
}

// Support GET for Vercel Cron
async function _GET(request: Request) {
  return POST(request);
}

export const GET = withCache(_GET, 'PRIVATE');
