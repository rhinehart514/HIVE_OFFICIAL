/**
 * Setup Template Detail API
 *
 * GET /api/setups/templates/[id] - Get template details
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getServerSetupTemplateRepository,
  toSetupTemplateDetailDTO,
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
// GET /api/setups/templates/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // Convert to DTO
    const dto = toSetupTemplateDetailDTO(template);

    return jsonResponse({ template: dto });
  } catch (error) {
    console.error('[API] Error getting setup template:', error);
    return errorResponse('Failed to get setup template', 500);
  }
}
