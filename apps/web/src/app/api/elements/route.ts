/**
 * Elements API
 *
 * GET /api/elements - List all available HiveLab element types with their specs
 *
 * Query params:
 * - category: Filter by element category (input, filter, display, action, layout)
 * - tier: Filter by tier (universal, connected, space, layout)
 * - search: Search by name, description, or use cases
 * - stateful: Filter by stateful elements only (true/false)
 * - realtime: Filter by real-time capable elements (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllElements,
  getElementsByCategory,
  searchElements,
  getStatefulElements,
  getRealtimeElements,
  ELEMENT_COUNT,
  CATEGORY_COUNTS,
  TIER_COUNTS,
  type ElementSpec,
  type ElementCategory,
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
// Element DTO Transformation
// ============================================================================

interface ElementListDTO {
  id: string;
  name: string;
  description: string;
  category: ElementCategory;
  icon: string;
  actions: string[];
  outputs: string[];
  inputs: string[];
  useCases: string[];
  defaultSize: { width: number; height: number };
  stateful: boolean;
  realtime: boolean;
}

function toElementListDTO(element: ElementSpec): ElementListDTO {
  return {
    id: element.id,
    name: element.name,
    description: element.description,
    category: element.category,
    icon: element.icon,
    actions: element.actions,
    outputs: element.outputs,
    inputs: element.inputs,
    useCases: element.useCases,
    defaultSize: element.defaultSize,
    stateful: element.stateful,
    realtime: element.realtime,
  };
}

// ============================================================================
// Element Tier Classification
// ============================================================================

const UNIVERSAL_ELEMENT_IDS = new Set([
  'search-input',
  'date-picker',
  'user-selector',
  'form-builder',
  'filter-selector',
  'result-list',
  'chart-display',
  'poll-element',
  'rsvp-button',
  'countdown-timer',
  'leaderboard',
  'counter',
  'timer',
  'role-gate',
  'tag-cloud',
  'map-view',
  'notification-center',
]);

const CONNECTED_ELEMENT_IDS = new Set([
  'event-picker',
  'space-picker',
  'connection-list',
]);

const SPACE_ELEMENT_IDS = new Set([
  'member-list',
  'member-selector',
  'space-events',
  'space-feed',
  'space-stats',
  'announcement',
  'availability-heatmap',
]);

function getElementTier(elementId: string): 'universal' | 'connected' | 'space' | 'layout' {
  if (elementId === 'role-gate') return 'layout';
  if (SPACE_ELEMENT_IDS.has(elementId)) return 'space';
  if (CONNECTED_ELEMENT_IDS.has(elementId)) return 'connected';
  return 'universal';
}

// ============================================================================
// GET /api/elements
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category') as ElementCategory | null;
    const tier = searchParams.get('tier') as 'universal' | 'connected' | 'space' | 'layout' | null;
    const search = searchParams.get('search');
    const statefulOnly = searchParams.get('stateful') === 'true';
    const realtimeOnly = searchParams.get('realtime') === 'true';

    // Start with base element set based on filters
    let elements: ElementSpec[];

    if (search) {
      elements = searchElements(search);
    } else if (category) {
      elements = getElementsByCategory(category);
    } else if (statefulOnly) {
      elements = getStatefulElements();
    } else if (realtimeOnly) {
      elements = getRealtimeElements();
    } else {
      elements = getAllElements();
    }

    // Apply tier filter if specified
    if (tier) {
      elements = elements.filter(el => getElementTier(el.id) === tier);
    }

    // Apply additional filters if multiple specified
    if (category && search) {
      elements = elements.filter(el => el.category === category);
    }
    if (statefulOnly && !search) {
      elements = elements.filter(el => el.stateful);
    }
    if (realtimeOnly && !search) {
      elements = elements.filter(el => el.realtime);
    }

    // Convert to DTOs
    const elementDTOs = elements.map(toElementListDTO);

    return jsonResponse({
      elements: elementDTOs,
      total: elementDTOs.length,
      meta: {
        totalAvailable: ELEMENT_COUNT,
        categoryCounts: CATEGORY_COUNTS,
        tierCounts: TIER_COUNTS,
      },
    });
  } catch (error) {
    console.error('Error listing elements:', error);
    return errorResponse('Failed to list elements', 500);
  }
}
