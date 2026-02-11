/**
 * Sidebar Layout API - GET/PUT endpoints for space sidebar configuration
 *
 * Manages HiveLab-powered sidebar slots for spaces:
 * - GET: Retrieve current sidebar layout (authenticated)
 * - PUT: Update sidebar layout (leaders only)
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { getSystemTemplateForCategory } from '@hive/core';
import { withCache } from '../../../../../lib/cache-headers';

// ============================================================
// Types
// ============================================================

const SidebarSlotSchema = z.object({
  slotId: z.string().min(1),
  toolId: z.string().nullable(),
  deploymentId: z.string(),
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  order: z.number().int().min(0),
  collapsed: z.boolean().default(false),
  config: z.record(z.unknown()).default({}),
});

const UpdateSidebarSchema = z.object({
  slots: z.array(SidebarSlotSchema),
});

// ============================================================
// GET - Retrieve sidebar layout (authenticated)
// ============================================================

const _GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond,
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check read access using centralized permission middleware
  const permCheck = await checkSpacePermission(spaceId, userId, 'guest');
  if (!permCheck.hasPermission) {
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const spaceRef = dbAdmin.collection('spaces').doc(spaceId);
    const spaceDoc = await spaceRef.get();

    if (!spaceDoc.exists) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    const spaceData = spaceDoc.data() || {};
    let sidebarLayout = spaceData.sidebarLayout || [];

    // AUTO-DEPLOY: If sidebar is empty, generate from template based on category
    if (sidebarLayout.length === 0) {
      const spaceCategory = spaceData.category || 'student_org';
      const template = getSystemTemplateForCategory(spaceCategory);

      // Convert template slots to sidebar layout format
      sidebarLayout = template.slots.map((slot) => ({
        slotId: slot.slotId,
        toolId: slot.toolId,
        deploymentId: `auto-${slot.toolId}-${Date.now()}`,
        name: slot.name,
        type: slot.type,
        order: slot.order,
        collapsed: slot.collapsed,
        config: slot.config,
      }));

      // Persist the auto-deployed sidebar (fire-and-forget)
      spaceRef.update({
        sidebarLayout,
        sidebarUpdatedAt: new Date(),
        sidebarAutoDeployed: true,
        sidebarTemplateUsed: template.id,
      }).catch((err) => {
        logger.warn('Failed to persist auto-deployed sidebar', {
          error: err instanceof Error ? err.message : String(err),
          spaceId,
        });
      });

      logger.info('Sidebar auto-deployed from template', {
        spaceId,
        spaceCategory,
        templateId: template.id,
        slotCount: sidebarLayout.length,
      });
    }

    return respond.success({
      slots: sidebarLayout,
      updatedAt: spaceData.sidebarUpdatedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error) {
    logger.error('Failed to fetch sidebar layout', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      endpoint: '/api/spaces/[spaceId]/sidebar',
    });
    return respond.error('Failed to fetch sidebar layout', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

// ============================================================
// PUT - Update sidebar layout (leaders only)
// ============================================================

export const PUT = withAuthValidationAndErrors(
  UpdateSidebarSchema,
  async (
    request,
    { params }: { params: Promise<{ spaceId: string }> },
    body,
    respond,
  ) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const _campusId = getCampusId(request as AuthenticatedRequest);
    const { spaceId } = await params;

    if (!spaceId) {
      return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
    }

    // Require leader permission to update sidebar
    const permCheck = await checkSpacePermission(spaceId, userId, 'admin');
    if (!permCheck.hasPermission) {
      const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
      const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      return respond.error(permCheck.error ?? "Permission denied", code, { status });
    }

    try {
      const spaceRef = dbAdmin.collection('spaces').doc(spaceId);

      // Update space document
      await spaceRef.update({
        sidebarLayout: body.slots,
        sidebarUpdatedAt: new Date(),
      });

      logger.info('Sidebar layout updated', {
        spaceId,
        userId,
        slotCount: body.slots.length,
        endpoint: '/api/spaces/[spaceId]/sidebar',
      });

      return respond.success({
        slots: body.slots,
        message: 'Sidebar layout updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update sidebar layout', {
        error: error instanceof Error ? error.message : String(error),
        spaceId,
        endpoint: '/api/spaces/[spaceId]/sidebar',
      });
      return respond.error('Failed to update sidebar layout', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
);

export const GET = withCache(_GET, 'SHORT');
