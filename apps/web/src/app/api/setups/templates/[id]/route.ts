/**
 * Setup Template Detail API
 *
 * GET /api/setups/templates/[id] - Get template details
 * PUT /api/setups/templates/[id] - Update template (owner only)
 * DELETE /api/setups/templates/[id] - Delete template (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
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
  } catch {
    return errorResponse('Failed to get setup template', 500);
  }
}

// ============================================================================
// Request Validation
// ============================================================================

const UpdateSetupTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  icon: z.string().min(1).optional(),
  category: z.enum(['event', 'campaign', 'workflow', 'engagement', 'governance']).optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
});

// ============================================================================
// Helper: Get authenticated user
// ============================================================================

async function getAuthenticatedUser(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

// ============================================================================
// PUT /api/setups/templates/[id]
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Check authentication
    const session = await getAuthenticatedUser();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const { userId } = session;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // Check authorization - only creator can update
    if (!template.canEdit(userId)) {
      return errorResponse('Not authorized to update this template', 403);
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UpdateSetupTemplateSchema.safeParse(body);

    if (!parseResult.success) {
      return jsonResponse(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        400,
      );
    }

    const updates = parseResult.data;

    // Update template
    template.update({
      name: updates.name,
      description: updates.description,
      icon: updates.icon,
      category: updates.category,
      tags: updates.tags,
      thumbnailUrl: updates.thumbnailUrl ?? undefined,
    });

    // Save changes
    const saveResult = await repo.save(template);

    if (saveResult.isFailure) {
      return errorResponse(saveResult.error ?? 'Failed to save template', 500);
    }

    // Return updated template
    const dto = toSetupTemplateDetailDTO(template);

    return jsonResponse({
      template: dto,
      message: 'Template updated successfully',
    });
  } catch (error) {
    console.error('Error updating setup template:', error);
    return errorResponse('Failed to update setup template', 500);
  }
}

// ============================================================================
// DELETE /api/setups/templates/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Check authentication
    const session = await getAuthenticatedUser();
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const { userId } = session;

    // Get repository
    const repo = getServerSetupTemplateRepository();

    // Find template first to check authorization
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = result.getValue();

    // System templates cannot be deleted
    if (template.isSystem) {
      return errorResponse('System templates cannot be deleted', 403);
    }

    // Only creator can delete
    if (template.creatorId !== userId) {
      return errorResponse('Not authorized to delete this template', 403);
    }

    // Delete template
    const deleteResult = await repo.delete(id);

    if (deleteResult.isFailure) {
      return errorResponse(deleteResult.error ?? 'Failed to delete template', 500);
    }

    return jsonResponse({
      message: `Template "${template.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting setup template:', error);
    return errorResponse('Failed to delete setup template', 500);
  }
}
