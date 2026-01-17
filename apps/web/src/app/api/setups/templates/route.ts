/**
 * Setup Templates API
 *
 * GET /api/setups/templates - List available setup templates
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getServerSetupTemplateRepository,
  toSetupTemplateListDTO,
  type SetupCategory,
} from '@hive/core/server';

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
// GET /api/setups/templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get('category') as SetupCategory | null;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const featuredOnly = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor') || undefined;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Query templates
    const result = await repo.findMany({
      category: category || undefined,
      tags,
      featuredOnly,
      includeSystemTemplates: true,
      orderBy: 'deploymentCount',
      orderDirection: 'desc',
      limit,
      cursor,
    });

    if (result.isFailure) {
      return errorResponse(result.error ?? 'Unknown error', 500);
    }

    const { items, hasMore, nextCursor } = result.getValue();

    // Convert to DTOs
    const templates = items.map(toSetupTemplateListDTO);

    return jsonResponse({
      templates,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('[API] Error listing setup templates:', error);
    return errorResponse('Failed to list setup templates', 500);
  }
}
