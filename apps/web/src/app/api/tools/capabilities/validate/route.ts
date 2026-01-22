/**
 * Capability Validation API
 *
 * POST /api/tools/capabilities/validate - Validate capability request against trust tier
 *
 * Request body:
 * {
 *   capabilities: Partial<ToolCapabilities>,
 *   trustTier: TrustTier
 * }
 *
 * Response:
 * {
 *   valid: boolean,
 *   errors: string[],
 *   lane: CapabilityLane,
 *   budgets: ToolBudgets
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateCapabilityRequest,
  getCapabilityLane,
  getDefaultBudgets,
  type ToolCapabilities,
  type TrustTier,
} from '@hive/core';

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// Validation
// ============================================================================

const VALID_TRUST_TIERS = new Set<TrustTier>([
  'unverified',
  'community',
  'verified',
  'system',
]);

function isValidTrustTier(tier: unknown): tier is TrustTier {
  return typeof tier === 'string' && VALID_TRUST_TIERS.has(tier as TrustTier);
}

// ============================================================================
// POST /api/tools/capabilities/validate
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { capabilities, trustTier } = body as {
      capabilities?: Partial<ToolCapabilities>;
      trustTier?: unknown;
    };

    // Validate input
    if (!capabilities || typeof capabilities !== 'object') {
      return errorResponse('capabilities object is required');
    }

    if (!isValidTrustTier(trustTier)) {
      return errorResponse(
        `trustTier must be one of: ${Array.from(VALID_TRUST_TIERS).join(', ')}`
      );
    }

    // Validate capabilities against trust tier
    const { valid, errors } = validateCapabilityRequest(capabilities, trustTier);

    // Determine the capability lane
    const lane = getCapabilityLane(capabilities);

    // Get default budgets for the lane
    const budgets = getDefaultBudgets(capabilities);

    // Additional validation: check if requested lane is allowed for trust tier
    const additionalErrors: string[] = [];

    if (trustTier === 'unverified') {
      if (lane === 'scoped' || lane === 'power') {
        additionalErrors.push(
          `Unverified tools cannot request ${lane} capabilities. Maximum allowed: safe`
        );
      }
    }

    if (trustTier === 'community') {
      if (lane === 'power') {
        additionalErrors.push(
          'Community tools cannot request power capabilities. Maximum allowed: scoped'
        );
      }
    }

    const allErrors = [...errors, ...additionalErrors];

    return jsonResponse({
      valid: valid && additionalErrors.length === 0,
      errors: allErrors,
      lane,
      budgets,
      summary: {
        requestedLane: lane,
        trustTier,
        allowedLane: getAllowedLane(trustTier),
        isWithinAllowedLane: isLaneAllowed(lane, trustTier),
      },
    });
  } catch {
    return errorResponse('Invalid request body', 400);
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getAllowedLane(trustTier: TrustTier): string {
  switch (trustTier) {
    case 'unverified':
      return 'safe';
    case 'community':
      return 'scoped';
    case 'verified':
    case 'system':
      return 'power';
    default:
      return 'safe';
  }
}

function isLaneAllowed(lane: string, trustTier: TrustTier): boolean {
  const laneOrder = { safe: 0, scoped: 1, power: 2 };
  const allowedLane = getAllowedLane(trustTier);
  return laneOrder[lane as keyof typeof laneOrder] <= laneOrder[allowedLane as keyof typeof laneOrder];
}
