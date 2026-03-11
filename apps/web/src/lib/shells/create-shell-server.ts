/**
 * Server-side shell tool creation
 *
 * Creates shell tools (poll/bracket/rsvp) programmatically via Admin SDK.
 * Used by AI seeding cron and launch seed script.
 * No auth required — runs as system actor.
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { createPlacementDocument, buildPlacementCompositeId } from '@/lib/tool-placement';
import { logger } from '@/lib/logger';
import type { ShellFormat, PollConfig, BracketConfig, RSVPConfig, PollState, BracketState, RSVPState } from './types';

// System actor ID for AI-generated content
export const HIVE_SYSTEM_USER = 'hive-system';

export interface CreateShellToolParams {
  title: string;
  description?: string;
  shellFormat: Exclude<ShellFormat, 'custom'>;
  shellConfig: PollConfig | BracketConfig | RSVPConfig;
  spaceId: string;
  campusId: string;
  /** Defaults to HIVE_SYSTEM_USER */
  createdBy?: string;
}

export interface CreateShellToolResult {
  toolId: string;
  success: boolean;
}

// ============================================================================
// INITIAL STATE BUILDERS (mirror of client-side versions)
// ============================================================================

function buildInitialPollState(config: PollConfig): PollState {
  return {
    votes: {},
    voteCounts: config.options.map(() => 0),
    closed: false,
  };
}

function buildInitialBracketState(config: BracketConfig): BracketState {
  const entries = config.entries;
  const matchups = [];
  for (let i = 0; i < entries.length; i += 2) {
    if (i + 1 < entries.length) {
      matchups.push({
        id: `r1-m${Math.floor(i / 2)}`,
        round: 1,
        entryA: entries[i],
        entryB: entries[i + 1],
        votes: {},
      });
    }
  }
  return {
    matchups,
    currentRound: 1,
    totalRounds: Math.ceil(Math.log2(entries.length)),
    completed: false,
  };
}

function buildInitialRSVPState(): RSVPState {
  return {
    attendees: {},
    count: 0,
  };
}

function buildInitialState(format: Exclude<ShellFormat, 'custom'>, config: PollConfig | BracketConfig | RSVPConfig) {
  switch (format) {
    case 'poll': return buildInitialPollState(config as PollConfig);
    case 'bracket': return buildInitialBracketState(config as BracketConfig);
    case 'rsvp': return buildInitialRSVPState();
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function createShellToolServer(params: CreateShellToolParams): Promise<CreateShellToolResult> {
  const {
    title,
    description,
    shellFormat,
    shellConfig,
    spaceId,
    campusId,
    createdBy = HIVE_SYSTEM_USER,
  } = params;

  const now = new Date();

  try {
    // 1. Create tool document in Firestore
    const toolDoc = {
      name: title,
      description: description ?? null,
      type: 'shell',
      shellFormat,
      shellConfig,
      status: 'published',
      visibility: 'public',
      ownerId: createdBy,
      campusId,
      elements: [],
      connections: [],
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      useCount: 0,
      provenance: {
        creatorId: createdBy,
        createdAt: now.toISOString(),
        lineage: [],
        forkCount: 0,
        deploymentCount: 1,
        trustTier: 'system' as const,
      },
      metadata: {
        toolType: 'shell',
        aiGenerated: createdBy === HIVE_SYSTEM_USER,
        autoSeededAt: createdBy === HIVE_SYSTEM_USER ? now.toISOString() : null,
      },
    };

    const toolRef = await dbAdmin.collection('tools').add(toolDoc);
    const toolId = toolRef.id;

    // 2. Write initial state to RTDB
    const rtdb = admin.database();
    const stateRef = rtdb.ref(`shell_states/${toolId}`);
    const initialState = buildInitialState(shellFormat, shellConfig);
    await stateRef.set(initialState);

    // 3. Place in space
    const deploymentId = `ai_seed_${Date.now()}`;
    await createPlacementDocument({
      deployedTo: 'space',
      targetId: spaceId,
      toolId,
      deploymentId,
      placedBy: createdBy,
      campusId,
      placement: 'sidebar',
      visibility: 'all',
      name: title,
      description: description ?? null,
    });

    const compositeId = buildPlacementCompositeId(deploymentId, toolId);
    await dbAdmin.collection('deployedTools').doc(compositeId).set({
      toolId,
      deployedBy: createdBy,
      deployedTo: 'space',
      targetId: spaceId,
      surface: 'tools',
      status: 'published',
      deployedAt: now.toISOString(),
      usageCount: 0,
      targetType: 'space',
      creatorId: createdBy,
      spaceId,
      campusId,
      shellFormat,
    });

    logger.info('[ai-seed] Created shell tool', { toolId, shellFormat, spaceId, title });

    return { toolId, success: true };
  } catch (error) {
    logger.error('[ai-seed] Failed to create shell tool', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      shellFormat,
      title,
    });
    return { toolId: '', success: false };
  }
}
