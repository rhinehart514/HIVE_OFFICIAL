import { dbAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { logger } from '@/lib/structured-logger';
import {
  withAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { addSecureCampusMetadata } from '@/lib/secure-firebase-queries';
import { HttpStatus } from '@/lib/api-response-types';
import { getServerSpaceRepository, type EnhancedSpace } from '@hive/core/server';
import { checkSpacePermission, getSpaceMembership } from '@/lib/space-permission-middleware';

interface MovementRestriction {
  spaceType: 'campus_living' | 'cohort' | 'fraternity_and_sorority';
  cooldownDays: number;
  maxMovements: number;
  lockDuration?: number;
}

const MOVEMENT_RESTRICTIONS: Record<string, MovementRestriction> = {
  campus_living: {
    spaceType: 'campus_living',
    cooldownDays: 30,
    maxMovements: 1,
  },
  cohort: {
    spaceType: 'cohort',
    cooldownDays: 30,
    maxMovements: 1,
    lockDuration: 365,
  },
  fraternity_and_sorority: {
    spaceType: 'fraternity_and_sorority',
    cooldownDays: 0,
    maxMovements: 0,
  },
};

interface SpaceMovementRecord {
  userId: string;
  fromSpaceId: string;
  toSpaceId: string;
  spaceType: string;
  movementType: 'transfer' | 'leave' | 'join';
  timestamp: string;
  campusId: string;
  reason?: string;
  adminOverride?: boolean;
}

interface MovementValidationResult {
  canMove: boolean;
  reason?: string;
  nextAvailableDate?: string;
  currentCooldownDays?: number;
  movementsThisPeriod?: number;
}

interface SpaceInfo {
  id: string;
  data: Record<string, unknown>;
  movementType: string | null;
  space?: EnhancedSpace;
}

export const POST = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  // P0 SECURITY FIX: adminOverride is NO LONGER accepted from client
  // It's derived from authenticated session's admin status
  const body = await request.json();
  const { fromSpaceId, toSpaceId, reason } = body;

  // Derive admin override from session, not from client request
  const authenticatedRequest = request as AuthenticatedRequest;
  const decodedToken = authenticatedRequest.user.decodedToken as { admin?: boolean; role?: string };
  const isSystemAdmin = decodedToken?.admin === true || decodedToken?.role === 'admin';

  if (!fromSpaceId || !toSpaceId) {
    return respond.error('Both fromSpaceId and toSpaceId are required', 'INVALID_INPUT', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  if (fromSpaceId === toSpaceId) {
    return respond.error('Cannot transfer to the same space', 'INVALID_INPUT', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  // Load space info using DDD repository (includes campus validation)
  const fromSpace = await loadSpaceInfo(fromSpaceId, campusId);
  const toSpace = await loadSpaceInfo(toSpaceId, campusId);

  if (!fromSpace || !toSpace) {
    return respond.error('One or both spaces not found', 'RESOURCE_NOT_FOUND', {
      status: HttpStatus.NOT_FOUND,
    });
  }

  if (!fromSpace.movementType || !toSpace.movementType) {
    return respond.error('Transfers are not available for these space types', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  if (fromSpace.movementType !== toSpace.movementType) {
    return respond.error('Cannot transfer between different space types', 'INVALID_INPUT', {
      status: HttpStatus.BAD_REQUEST,
    });
  }

  // Use centralized permission check - require 'admin' level (owner or admin)
  const permissionCheck = await checkSpacePermission(fromSpaceId, userId, 'admin');

  if (!permissionCheck.hasPermission && !isSystemAdmin) {
    logger.warn('Unauthorized transfer attempt', {
      userId,
      fromSpaceId,
      toSpaceId,
      error: permissionCheck.hasPermission ? undefined : permissionCheck.error,
      endpoint: '/api/spaces/transfer',
    });
    return respond.error(
      permissionCheck.hasPermission ? 'Permission denied' : (permissionCheck.error ?? 'Permission denied'),
      'FORBIDDEN',
      { status: HttpStatus.FORBIDDEN }
    );
  }

  // Get membership for later use (role transfer, etc.)
  const sourceMembership = await getSpaceMembership(fromSpaceId, userId);
  if (!sourceMembership || !sourceMembership.isActive) {
    return respond.error('You are not a member of the source space', 'FORBIDDEN', {
      status: HttpStatus.FORBIDDEN,
    });
  }

  // For source membership document updates, we need the doc reference
  const sourceMembershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', fromSpaceId)
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (sourceMembershipSnapshot.empty) {
    return respond.error('Membership record not found', 'RESOURCE_NOT_FOUND', {
      status: HttpStatus.NOT_FOUND,
    });
  }

  const sourceMembershipDoc = sourceMembershipSnapshot.docs[0];
  const sourceMembershipData = sourceMembershipDoc.data();

  const targetMembershipSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', toSpaceId)
    .where('userId', '==', userId)
    .where('campusId', '==', campusId)
    .limit(1)
    .get();

  if (!targetMembershipSnapshot.empty) {
    const targetMembershipData = targetMembershipSnapshot.docs[0].data();
    if (targetMembershipData.isActive) {
      return respond.error('You are already a member of the target space', 'CONFLICT', {
        status: HttpStatus.CONFLICT,
      });
    }
  }

  // Only system admins can bypass movement restrictions
  if (!isSystemAdmin) {
    const validation = await validateMovementRestrictions(
      userId,
      fromSpace.movementType,
      fromSpace,
      toSpace,
      campusId,
    );
    if (!validation.canMove) {
      return respond.error(validation.reason || 'Movement restricted', 'FORBIDDEN', {
        status: HttpStatus.FORBIDDEN,
        details: validation,
      });
    }
  }

  if (fromSpace.movementType === 'fraternity_and_sorority') {
    const activeGreekMemberships = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(10)
      .get();

    let greekCount = 0;
    for (const doc of activeGreekMemberships.docs) {
      const membershipSpace = await loadSpaceInfo(doc.data().spaceId, campusId);
      if (membershipSpace?.movementType === 'fraternity_and_sorority') {
        greekCount += 1;
      }
    }

    if (greekCount > 1) {
      return respond.error(
        'You can only be a member of one Greek organization at a time',
        'FORBIDDEN',
        { status: HttpStatus.FORBIDDEN },
      );
    }
  }

  const batch = dbAdmin.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  batch.update(sourceMembershipDoc.ref, {
    isActive: false,
    leftAt: timestamp,
    transferredTo: toSpaceId,
    transferReason: reason || null,
    updatedAt: timestamp,
  });

  if (!targetMembershipSnapshot.empty) {
    const targetDoc = targetMembershipSnapshot.docs[0];
    batch.update(targetDoc.ref, {
      isActive: true,
      joinedAt: timestamp,
      reactivatedAt: timestamp,
      reactivatedBy: userId,
      role: targetDoc.data().role || sourceMembershipData.role || 'member',
      updatedAt: timestamp,
    });
  } else {
    const membershipRef = dbAdmin.collection('spaceMembers').doc();
    batch.set(
      membershipRef,
      addSecureCampusMetadata({
        spaceId: toSpaceId,
        userId,
        role: sourceMembershipData.role || 'member',
        joinedAt: timestamp,
        isActive: true,
        permissions: sourceMembershipData.permissions || ['post'],
        transferredFrom: fromSpaceId,
        transferReason: reason || null,
      }),
    );
  }

  batch.update(dbAdmin.collection('spaces').doc(fromSpaceId), {
    'metrics.memberCount': admin.firestore.FieldValue.increment(-1),
    'metrics.activeMembers': admin.firestore.FieldValue.increment(-1),
    updatedAt: timestamp,
  });

  batch.update(dbAdmin.collection('spaces').doc(toSpaceId), {
    'metrics.memberCount': admin.firestore.FieldValue.increment(1),
    'metrics.activeMembers': admin.firestore.FieldValue.increment(1),
    updatedAt: timestamp,
  });

  const movementRef = dbAdmin.collection('spaceMovements').doc();
  const movementRecord: SpaceMovementRecord = {
    userId,
    fromSpaceId,
    toSpaceId,
    spaceType: fromSpace.movementType,
    movementType: 'transfer',
    timestamp: new Date().toISOString(),
    campusId: campusId,
    reason,
    adminOverride: isSystemAdmin, // Record whether this was an admin bypass
  };
  batch.set(movementRef, movementRecord);

  await batch.commit();

  logger.info('Space transfer completed', {
    userId,
    fromSpaceId,
    toSpaceId,
    spaceType: fromSpace.movementType,
    adminOverride: isSystemAdmin,
    endpoint: '/api/spaces/transfer',
  });

  return respond.success({
    message: 'Successfully transferred spaces',
    transfer: {
      from: {
        id: fromSpaceId,
        name: fromSpace.data.name,
        type: fromSpace.movementType,
      },
      to: {
        id: toSpaceId,
        name: toSpace.data.name,
        type: toSpace.movementType,
      },
      timestamp: movementRecord.timestamp,
    },
  });
});

export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { searchParams } = new URL(request.url);
  const spaceType = searchParams.get('spaceType');
  const fromSpaceId = searchParams.get('fromSpaceId');
  const toSpaceId = searchParams.get('toSpaceId');

  if (spaceType && fromSpaceId && toSpaceId) {
    const fromSpace = await loadSpaceInfo(fromSpaceId, campusId);
    const toSpace = await loadSpaceInfo(toSpaceId, campusId);

    if (!fromSpace || !toSpace) {
      return respond.error('Space not found', 'RESOURCE_NOT_FOUND', {
        status: HttpStatus.NOT_FOUND,
      });
    }

    const validation = await validateMovementRestrictions(
      userId,
      normalizeMovementType(spaceType),
      fromSpace,
      toSpace,
      campusId,
    );

    return respond.success({
      canMove: validation.canMove,
      restrictions: validation,
      spaceType: normalizeMovementType(spaceType),
      from: { id: fromSpaceId, name: fromSpace.data.name },
      to: { id: toSpaceId, name: toSpace.data.name },
    });
  }

  const movementHistorySnapshot = await dbAdmin
    .collection('spaceMovements')
    .where('userId', '==', userId)
    .where('campusId', '==', campusId)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  const movementHistory = movementHistorySnapshot.docs.map((doc) => doc.data());
  const restrictions: Record<string, MovementValidationResult> = {};

  for (const [key, restriction] of Object.entries(MOVEMENT_RESTRICTIONS)) {
    const activeMembershipSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(5)
      .get();

    for (const doc of activeMembershipSnapshot.docs) {
      const membershipSpace = await loadSpaceInfo(doc.data().spaceId, campusId);
      if (membershipSpace?.movementType === restriction.spaceType) {
        const validation = await validateMovementRestrictions(userId, restriction.spaceType, membershipSpace, null, campusId);
        restrictions[key] = validation;
        break;
      }
    }
  }

  return respond.success({
    movementHistory,
    currentRestrictions: restrictions,
    restrictionRules: MOVEMENT_RESTRICTIONS,
  });
});

function normalizeMovementType(type?: string | null): string {
  return (type || '').toLowerCase();
}

function resolveMovementType(space: Record<string, unknown>): string | null {
  const directType = (space.movementType || space.movementCategory || '').toString().toLowerCase();
  if (directType && MOVEMENT_RESTRICTIONS[directType]) {
    return directType;
  }
  const rawType = (space.category || space.type || '').toString().toLowerCase();
  if (!rawType) return null;
  if (rawType.includes('campus') || rawType.includes('residential')) {
    return 'campus_living';
  }
  if (rawType.includes('cohort')) {
    return 'cohort';
  }
  if (rawType.includes('greek') || rawType.includes('fraternity')) {
    return 'fraternity_and_sorority';
  }
  return rawType;
}

async function loadSpaceInfo(spaceId: string, campusId: string): Promise<SpaceInfo | null> {
  // Use DDD repository for space data
  const spaceRepo = getServerSpaceRepository();
  const result = await spaceRepo.findById(spaceId);

  if (result.isFailure) {
    return null;
  }

  const space = result.getValue();

  // Enforce campus isolation
  if (space.campusId.id !== campusId) {
    return null;
  }

  // Build data object for backward compatibility with existing code
  const data: Record<string, unknown> = {
    name: space.name.value,
    description: space.description.value,
    category: space.category.value,
    type: space.category.value,
    memberCount: space.memberCount,
    isPublic: space.isPublic,
    campusId: space.campusId.id,
  };

  return {
    id: space.spaceId.value,
    data,
    movementType: resolveMovementType(data),
    space,
  };
}

async function validateMovementRestrictions(
  userId: string,
  movementType: string,
  fromSpace: SpaceInfo | null,
  toSpace: SpaceInfo | null,
  campusId: string,
): Promise<MovementValidationResult> {
  const restriction = MOVEMENT_RESTRICTIONS[movementType];
  if (!restriction) {
    return { canMove: true };
  }

  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - restriction.cooldownDays);

  const recentMovementsSnapshot = await dbAdmin
    .collection('spaceMovements')
    .where('userId', '==', userId)
    .where('spaceType', '==', movementType)
    .where('campusId', '==', campusId)
    .where('timestamp', '>=', cooldownDate.toISOString())
    .get();

  const recentMovements = recentMovementsSnapshot.docs.map((doc) => doc.data());

  if (restriction.maxMovements > 0 && recentMovements.length >= restriction.maxMovements) {
    const lastMovement = recentMovements
      .map((movement) => new Date(movement.timestamp))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (lastMovement) {
      const nextAvailable = new Date(lastMovement);
      nextAvailable.setDate(nextAvailable.getDate() + restriction.cooldownDays);

      if (Date.now() < nextAvailable.getTime()) {
        return {
          canMove: false,
          reason: `Movement restricted. You can move again after ${nextAvailable.toLocaleDateString()}`,
          nextAvailableDate: nextAvailable.toISOString(),
          currentCooldownDays: Math.ceil(
            (nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
          movementsThisPeriod: recentMovements.length,
        };
      }
    }
  }

  if (
    movementType === 'cohort' &&
    restriction.lockDuration &&
    fromSpace?.data?.name &&
    toSpace?.data?.name &&
    fromSpace.data.name !== toSpace.data.name
  ) {
    const membershipSnapshot = await dbAdmin
      .collection('spaceMembers')
      .where('userId', '==', userId)
      .where('spaceId', '==', fromSpace.id)
      .where('isActive', '==', true)
      .where('campusId', '==', campusId)
      .limit(1)
      .get();

    if (!membershipSnapshot.empty) {
      const membershipData = membershipSnapshot.docs[0].data();
      const joinedAt = membershipData.joinedAt?.toDate?.() ?? new Date();
      const lockUntil = new Date(joinedAt);
      lockUntil.setDate(lockUntil.getDate() + restriction.lockDuration);

      if (Date.now() < lockUntil.getTime()) {
        return {
          canMove: false,
          reason: `Year-based spaces are locked for 1 year. You can change after ${lockUntil.toLocaleDateString()}`,
          nextAvailableDate: lockUntil.toISOString(),
          currentCooldownDays: Math.ceil(
            (lockUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        };
      }
    }
  }

  return { canMove: true };
}
