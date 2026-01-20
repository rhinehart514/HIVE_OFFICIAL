/**
 * Space Invite Link API
 *
 * Allows space leaders to generate and manage invite links.
 * - GET: List active invite links
 * - POST: Generate new invite link
 * - DELETE: Revoke an invite link
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { randomUUID } from 'crypto';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { checkSpacePermission } from '@/lib/space-permission-middleware';

interface InviteLink {
  id: string;
  code: string;
  spaceId: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
  isActive: boolean;
}

/**
 * GET /api/spaces/[spaceId]/invite
 * List active invite links for the space (leaders only)
 */
export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
  if (!permCheck.hasPermission) {
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    // Fetch active invite links for this space
    const invitesSnapshot = await dbAdmin
      .collection('spaceInvites')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const invites: InviteLink[] = invitesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        spaceId: data.spaceId,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        expiresAt: data.expiresAt?.toDate?.() || (data.expiresAt ? new Date(data.expiresAt) : undefined),
        maxUses: data.maxUses,
        uses: data.uses || 0,
        isActive: data.isActive,
      };
    });

    // Filter out expired invites
    const now = new Date();
    const activeInvites = invites.filter(inv => {
      if (inv.expiresAt && inv.expiresAt < now) return false;
      if (inv.maxUses && inv.uses >= inv.maxUses) return false;
      return true;
    });

    logger.info('Invite links fetched', {
      spaceId,
      userId,
      count: activeInvites.length,
      endpoint: '/api/spaces/[spaceId]/invite',
    });

    return respond.success({
      invites: activeInvites,
    });
  } catch (error) {
    logger.error('Failed to fetch invite links', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/invite',
    });
    return respond.error('Failed to fetch invite links', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

/**
 * POST /api/spaces/[spaceId]/invite
 * Generate a new invite link (leaders only)
 */
export const POST = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
  if (!permCheck.hasPermission) {
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { expiresInDays, maxUses } = body as { expiresInDays?: number; maxUses?: number };

    // Validate expiry (default: 7 days, max: 30 days)
    const expiryDays = Math.min(expiresInDays || 7, 30);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Validate max uses (optional, max: 100)
    const validMaxUses = maxUses ? Math.min(maxUses, 100) : undefined;

    // Generate UUID code
    const code = randomUUID();

    // Check for existing active invites (limit to 5 per space)
    const existingCount = await dbAdmin
      .collection('spaceInvites')
      .where('spaceId', '==', spaceId)
      .where('campusId', '==', campusId)
      .where('isActive', '==', true)
      .count()
      .get();

    if (existingCount.data().count >= 5) {
      return respond.error(
        'Maximum active invite links reached (5). Please revoke an existing link first.',
        'LIMIT_EXCEEDED',
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Create invite document
    const inviteData = {
      code,
      spaceId,
      campusId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      maxUses: validMaxUses,
      uses: 0,
      isActive: true,
    };

    const inviteRef = await dbAdmin.collection('spaceInvites').add(inviteData);

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'invite_created',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        inviteId: inviteRef.id,
        code,
        expiresAt: expiresAt.toISOString(),
        maxUses: validMaxUses,
      },
    });

    logger.info('Invite link created', {
      spaceId,
      userId,
      inviteId: inviteRef.id,
      expiresAt: expiresAt.toISOString(),
      maxUses: validMaxUses,
      endpoint: '/api/spaces/[spaceId]/invite',
    });

    return respond.success({
      invite: {
        id: inviteRef.id,
        code,
        spaceId,
        createdBy: userId,
        createdAt: new Date(),
        expiresAt,
        maxUses: validMaxUses,
        uses: 0,
        isActive: true,
      },
      link: `https://hive.college/spaces/join/${code}`,
    });
  } catch (error) {
    logger.error('Failed to create invite link', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/invite',
    });
    return respond.error('Failed to create invite link', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});

/**
 * DELETE /api/spaces/[spaceId]/invite
 * Revoke an invite link (leaders only)
 */
export const DELETE = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ spaceId: string }> },
  respond
) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId } = await params;

  if (!spaceId) {
    return respond.error('Space ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
  }

  // Check leader permission
  const permCheck = await checkSpacePermission(spaceId, userId, 'leader');
  if (!permCheck.hasPermission) {
    const code = permCheck.code === 'NOT_FOUND' ? 'RESOURCE_NOT_FOUND' : 'FORBIDDEN';
    const status = permCheck.code === 'NOT_FOUND' ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
    return respond.error(permCheck.error ?? "Permission denied", code, { status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('inviteId');

    if (!inviteId) {
      return respond.error('Invite ID is required', 'INVALID_INPUT', { status: HttpStatus.BAD_REQUEST });
    }

    // Verify invite belongs to this space
    const inviteRef = dbAdmin.collection('spaceInvites').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      return respond.error('Invite not found', 'RESOURCE_NOT_FOUND', { status: HttpStatus.NOT_FOUND });
    }

    const inviteData = inviteDoc.data();
    if (inviteData?.spaceId !== spaceId) {
      return respond.error('Invite does not belong to this space', 'FORBIDDEN', { status: HttpStatus.FORBIDDEN });
    }

    // Deactivate invite
    await inviteRef.update({
      isActive: false,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: userId,
    });

    // Log activity
    await dbAdmin.collection('spaces').doc(spaceId).collection('activity').add({
      type: 'invite_revoked',
      performedBy: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: {
        inviteId,
        code: inviteData?.code,
      },
    });

    logger.info('Invite link revoked', {
      spaceId,
      userId,
      inviteId,
      endpoint: '/api/spaces/[spaceId]/invite',
    });

    return respond.success({
      message: 'Invite link revoked successfully',
    });
  } catch (error) {
    logger.error('Failed to revoke invite link', {
      error: error instanceof Error ? error.message : String(error),
      spaceId,
      userId,
      endpoint: '/api/spaces/[spaceId]/invite',
    });
    return respond.error('Failed to revoke invite link', 'INTERNAL_ERROR', { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
});
