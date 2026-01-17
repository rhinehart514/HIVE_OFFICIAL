/**
 * Setup Deployment Detail API
 *
 * GET /api/setups/deployments/[id] - Get deployment details
 * PATCH /api/setups/deployments/[id] - Update deployment config/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupDeploymentRepository,
  toSetupDeploymentDetailDTO,
  type SetupDeploymentStatus,
} from '@hive/core/server';

// ============================================================================
// Request Validation
// ============================================================================

const UpdateDeploymentSchema = z.object({
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  config: z.record(z.unknown()).optional(),
  sharedData: z.record(z.unknown()).optional(),
});

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
// GET /api/setups/deployments/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return errorResponse('Deployment ID is required', 400);
    }

    // Get repository
    const repo = getServerSetupDeploymentRepository();

    // Find deployment
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Deployment not found', 404);
    }

    const deployment = result.getValue();

    // Convert to DTO
    const dto = toSetupDeploymentDetailDTO(deployment);

    return jsonResponse({ deployment: dto });
  } catch (error) {
    console.error('[API] Error getting setup deployment:', error);
    return errorResponse('Failed to get setup deployment', 500);
  }
}

// ============================================================================
// PATCH /api/setups/deployments/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    const { id } = await context.params;

    if (!id) {
      return errorResponse('Deployment ID is required', 400);
    }

    // Parse request body
    const body = await request.json();
    const parseResult = UpdateDeploymentSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0].message, 400);
    }

    const { status, config, sharedData } = parseResult.data;

    // Get repository
    const repo = getServerSetupDeploymentRepository();

    // Find deployment
    const result = await repo.findById(id);

    if (result.isFailure) {
      return errorResponse('Deployment not found', 404);
    }

    const deployment = result.getValue();

    // Update status if provided
    if (status) {
      const statusResult = await repo.updateStatus(id, status as SetupDeploymentStatus);
      if (statusResult.isFailure) {
        return errorResponse(statusResult.error ?? 'Unknown error', 500);
      }
    }

    // Update shared data if provided
    if (sharedData) {
      const sharedDataResult = await repo.updateSharedData(id, sharedData);
      if (sharedDataResult.isFailure) {
        return errorResponse(sharedDataResult.error ?? 'Unknown error', 500);
      }
    }

    // Refetch deployment to get updated state
    const updatedResult = await repo.findById(id);
    if (updatedResult.isFailure) {
      return errorResponse('Failed to fetch updated deployment', 500);
    }

    const updatedDeployment = updatedResult.getValue();
    const dto = toSetupDeploymentDetailDTO(updatedDeployment);

    return jsonResponse({ deployment: dto });
  } catch (error) {
    console.error('[API] Error updating setup deployment:', error);
    return errorResponse('Failed to update setup deployment', 500);
  }
}
