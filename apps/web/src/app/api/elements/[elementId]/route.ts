/**
 * Element Detail API
 *
 * GET /api/elements/[elementId] - Get element specification with full schema details
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getElementById,
  type ElementSpec,
} from '@hive/core';

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// Element Tier Classification
// ============================================================================

const SPACE_ELEMENT_IDS = new Set([
  'member-list',
  'member-selector',
  'space-events',
  'space-feed',
  'space-stats',
  'announcement',
  'availability-heatmap',
]);

const CONNECTED_ELEMENT_IDS = new Set([
  'event-picker',
  'space-picker',
  'connection-list',
]);

function getElementTier(elementId: string): 'universal' | 'connected' | 'space' | 'layout' {
  if (elementId === 'role-gate') return 'layout';
  if (SPACE_ELEMENT_IDS.has(elementId)) return 'space';
  if (CONNECTED_ELEMENT_IDS.has(elementId)) return 'connected';
  return 'universal';
}

// ============================================================================
// Element Detail DTO
// ============================================================================

interface ElementDetailDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'universal' | 'connected' | 'space' | 'layout';
  icon: string;
  actions: string[];
  outputs: string[];
  inputs: string[];
  useCases: string[];
  defaultSize: { width: number; height: number };
  defaultConfig: Record<string, unknown>;
  configSchema: Record<string, unknown>;
  stateful: boolean;
  realtime: boolean;
  requiredCapabilities: string[];
}

function toElementDetailDTO(element: ElementSpec): ElementDetailDTO {
  const tier = getElementTier(element.id);

  // Determine required capabilities based on tier and features
  const requiredCapabilities: string[] = ['read_own_state'];
  if (element.stateful) {
    requiredCapabilities.push('write_own_state');
  }
  if (tier === 'space') {
    requiredCapabilities.push('read_space_members', 'read_space_context');
  }
  if (tier === 'connected') {
    requiredCapabilities.push('read_space_context');
  }

  return {
    id: element.id,
    name: element.name,
    description: element.description,
    category: element.category,
    tier,
    icon: element.icon,
    actions: element.actions,
    outputs: element.outputs,
    inputs: element.inputs,
    useCases: element.useCases,
    defaultSize: element.defaultSize,
    defaultConfig: element.defaultConfig,
    configSchema: element.configSchema,
    stateful: element.stateful,
    realtime: element.realtime,
    requiredCapabilities,
  };
}

// ============================================================================
// GET /api/elements/[elementId]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ elementId: string }> },
) {
  try {
    const { elementId } = await context.params;

    if (!elementId) {
      return errorResponse('Element ID is required', 400);
    }

    const element = getElementById(elementId);

    if (!element) {
      return errorResponse(`Element "${elementId}" not found`, 404);
    }

    const dto = toElementDetailDTO(element);

    return jsonResponse({ element: dto });
  } catch (error) {
    console.error('Error getting element:', error);
    return errorResponse('Failed to get element', 500);
  }
}
