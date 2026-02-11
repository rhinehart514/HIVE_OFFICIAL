/**
 * Capability Inspection API
 *
 * GET /api/tools/capabilities - Return capability presets, lane definitions, and budget defaults
 *
 * Exposes the HiveLab governance model for tooling and UI consumption.
 */

import { NextResponse } from 'next/server';
import {
  CAPABILITY_PRESETS,
  DEFAULT_BUDGETS,
  type CapabilityLane,
  type TrustTier,
} from '@hive/core';
import { withCache } from '../../../../lib/cache-headers';

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// ============================================================================
// Lane Descriptions
// ============================================================================

interface LaneInfo {
  id: CapabilityLane;
  name: string;
  description: string;
  approvalRequired: 'none' | 'leader' | 'admin';
  capabilities: string[];
}

const LANE_INFO: LaneInfo[] = [
  {
    id: 'safe',
    name: 'Safe',
    description: 'UI composition and state management only. No platform side effects.',
    approvalRequired: 'none',
    capabilities: ['read_own_state', 'write_own_state', 'write_shared_state'],
  },
  {
    id: 'scoped',
    name: 'Scoped',
    description: 'Space-private reads for contextual intelligence. Requires leader approval.',
    approvalRequired: 'leader',
    capabilities: ['read_space_context', 'read_space_members'],
  },
  {
    id: 'power',
    name: 'Power',
    description: 'Full platform side effects with budget limits. Explicitly gated.',
    approvalRequired: 'admin',
    capabilities: ['create_posts', 'send_notifications', 'trigger_automations'],
  },
];

// ============================================================================
// Trust Tier Descriptions
// ============================================================================

interface TrustTierInfo {
  id: TrustTier;
  name: string;
  description: string;
  maxLane: CapabilityLane;
  objectAccessLevel: 'none' | 'specific' | 'wildcard';
}

const TRUST_TIER_INFO: TrustTierInfo[] = [
  {
    id: 'unverified',
    name: 'Unverified',
    description: 'New tools without review. Limited to safe capabilities.',
    maxLane: 'safe',
    objectAccessLevel: 'none',
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Community-created tools. Can request scoped capabilities.',
    maxLane: 'scoped',
    objectAccessLevel: 'specific',
  },
  {
    id: 'verified',
    name: 'Verified',
    description: 'HIVE-reviewed tools. Full capability access with wildcards.',
    maxLane: 'power',
    objectAccessLevel: 'wildcard',
  },
  {
    id: 'system',
    name: 'System',
    description: 'Built-in HIVE tools. Unrestricted platform access.',
    maxLane: 'power',
    objectAccessLevel: 'wildcard',
  },
];

// ============================================================================
// GET /api/tools/capabilities
// ============================================================================

async function _GET() {
  return jsonResponse({
    presets: {
      SAFE: CAPABILITY_PRESETS.SAFE,
      SCOPED: CAPABILITY_PRESETS.SCOPED,
      POWER: CAPABILITY_PRESETS.POWER,
    },
    budgets: {
      safe: DEFAULT_BUDGETS.safe,
      scoped: DEFAULT_BUDGETS.scoped,
      power: DEFAULT_BUDGETS.power,
    },
    lanes: LANE_INFO,
    trustTiers: TRUST_TIER_INFO,
    objectAccess: {
      typeIdPattern: '^[a-z0-9_-]+\\.[a-z][a-z0-9_]{2,39}$',
      typeIdExample: 'jacob.meeting_note',
      wildcardAccessRequirement: 'verified or system trust tier',
    },
  });
}

export const GET = withCache(_GET, 'SHORT');
