import * as admin from 'firebase-admin';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { logger } from '@/lib/structured-logger';
import { withCache } from '../../../../../lib/cache-headers';

// ============================================================================
// GET — Check promotion eligibility for a tool
// ============================================================================

const PROMOTION_THRESHOLDS = {
  minTotalUses: 50,
  minSpaceDeployments: 3,
};

export interface PromotionStatus {
  eligible: boolean;
  alreadyPromoted: boolean;
  pendingReview: boolean;
  stats: {
    totalUses: number;
    spaceDeployments: number;
    weeklyUsers: number;
  };
  thresholds: typeof PROMOTION_THRESHOLDS;
  campusSlug?: string;
}

const _GET = withAuthAndErrors(async (request, { params }: { params: Promise<{ toolId: string }> }, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const campusId = getCampusId(request as AuthenticatedRequest);
  const { toolId } = await params;
  const db = dbAdmin;

  if (!campusId) {
    return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
  }

  // Verify tool ownership
  const toolDoc = await db.collection('tools').doc(toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }
  const toolData = toolDoc.data();
  const isOwner = toolData?.ownerId === userId || toolData?.createdBy === userId;
  if (!isOwner) {
    return respond.error('Only tool owners can check promotion status', 'FORBIDDEN', { status: 403 });
  }

  // Check if already promoted to campus
  const existingCampus = await db
    .collection('campuses')
    .doc(campusId)
    .collection('campus_tools')
    .where('toolId', '==', toolId)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (!existingCampus.empty) {
    const campusDoc = existingCampus.docs[0].data();
    return respond.success({
      eligible: false,
      alreadyPromoted: true,
      pendingReview: campusDoc.status === 'pending_review',
      stats: { totalUses: 0, spaceDeployments: 0, weeklyUsers: 0 },
      thresholds: PROMOTION_THRESHOLDS,
      campusSlug: campusDoc.slug,
    } satisfies PromotionStatus);
  }

  // Count space deployments
  const deploymentsSnap = await db
    .collection('tool_placements')
    .where('toolId', '==', toolId)
    .where('isActive', '==', true)
    .get();

  const spaceDeployments = deploymentsSnap.size;

  // Aggregate usage stats from all deployments
  let totalUses = 0;
  let weeklyUsers = 0;
  for (const doc of deploymentsSnap.docs) {
    const data = doc.data();
    totalUses += data.usageStats?.totalUses || 0;
    weeklyUsers += data.usageStats?.weeklyUsers || 0;
  }

  // Also check tool-level analytics
  const toolStats = toolData?.stats || toolData?.usageStats || {};
  totalUses = Math.max(totalUses, toolStats.totalUses || 0);
  weeklyUsers = Math.max(weeklyUsers, toolStats.weeklyUsers || 0);

  const eligible =
    totalUses >= PROMOTION_THRESHOLDS.minTotalUses &&
    spaceDeployments >= PROMOTION_THRESHOLDS.minSpaceDeployments;

  return respond.success({
    eligible,
    alreadyPromoted: false,
    pendingReview: false,
    stats: { totalUses, spaceDeployments, weeklyUsers },
    thresholds: PROMOTION_THRESHOLDS,
  } satisfies PromotionStatus);
});

export const GET = withCache(_GET, 'SHORT');

// ============================================================================
// POST — Submit tool for campus promotion
// ============================================================================

const PromoteSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().min(1),
});

export const POST = withAuthValidationAndErrors(
  PromoteSchema,
  async (request, { params }: { params: Promise<{ toolId: string }> }, validatedData, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);
    const { toolId } = await params;
    const db = dbAdmin;

    if (!campusId) {
      return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
    }

    // Verify tool ownership
    const toolDoc = await db.collection('tools').doc(toolId).get();
    if (!toolDoc.exists) {
      return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }
    const toolData = toolDoc.data();
    const isOwner = toolData?.ownerId === userId || toolData?.createdBy === userId;
    if (!isOwner) {
      return respond.error('Only tool owners can promote tools', 'FORBIDDEN', { status: 403 });
    }

    // Check not already on campus
    const existingCampus = await db
      .collection('campuses')
      .doc(campusId)
      .collection('campus_tools')
      .where('toolId', '==', toolId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!existingCampus.empty) {
      return respond.error('Tool is already on campus', 'CONFLICT', { status: 409 });
    }

    // Check slug uniqueness
    const slugCheck = await db
      .collection('campuses')
      .doc(campusId)
      .collection('campus_tools')
      .where('slug', '==', validatedData.slug)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!slugCheck.empty) {
      return respond.error('A campus tool with this slug already exists', 'CONFLICT', { status: 409 });
    }

    // Verify promotion eligibility (usage thresholds)
    const deploymentsSnap = await db
      .collection('tool_placements')
      .where('toolId', '==', toolId)
      .where('isActive', '==', true)
      .get();

    const spaceDeployments = deploymentsSnap.size;
    let totalUses = 0;
    for (const doc of deploymentsSnap.docs) {
      totalUses += doc.data().usageStats?.totalUses || 0;
    }
    const toolStats = toolData?.stats || toolData?.usageStats || {};
    totalUses = Math.max(totalUses, toolStats.totalUses || 0);

    if (totalUses < PROMOTION_THRESHOLDS.minTotalUses || spaceDeployments < PROMOTION_THRESHOLDS.minSpaceDeployments) {
      return respond.error(
        `Tool needs ${PROMOTION_THRESHOLDS.minTotalUses}+ uses and ${PROMOTION_THRESHOLDS.minSpaceDeployments}+ space deployments to promote`,
        'PRECONDITION_FAILED',
        { status: 412 }
      );
    }

    const { slug, category } = validatedData;
    const deploymentId = `campus_${campusId}_${toolId}`;

    // Pin current version — campus tools don't auto-update
    const pinnedVersion = toolData?.version || 1;
    const pinnedElements = toolData?.config?.composition?.elements || toolData?.elements || [];
    const pinnedConnections = toolData?.config?.composition?.connections || toolData?.connections || [];

    // Create campus tool doc with pinned version
    await db
      .collection('campuses')
      .doc(campusId)
      .collection('campus_tools')
      .doc(deploymentId)
      .set({
        toolId,
        slug,
        category,
        badge: 'community',
        status: 'pending_review',
        source: 'promotion', // distinguishes from direct campus deploy
        placedBy: userId,
        placedAt: admin.firestore.FieldValue.serverTimestamp(),
        campusId,
        toolName: toolData?.name || 'Untitled',
        toolDescription: toolData?.description || '',
        usageStats: { weeklyUsers: 0, totalUses: totalUses },
        pinnedVersion,
        pinnedElements,
        pinnedConnections,
        version: pinnedVersion,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Create admin notification
    await db.collection('notifications').add({
      type: 'campus_tool_promotion',
      campusId,
      toolId,
      toolName: toolData?.name || 'Untitled',
      submittedBy: userId,
      slug,
      category,
      source: 'promotion',
      totalUses,
      spaceDeployments,
      status: 'unread',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Tool promoted to campus', {
      toolId,
      slug,
      campusId,
      totalUses,
      spaceDeployments,
      userId,
    });

    // Award builder XP (fire-and-forget)
    import('@/lib/builder-xp').then(({ awardXP }) => {
      awardXP(userId, 30, 'tool_promoted_campus').catch(() => {});
    });

    return respond.created({ deploymentId, slug, status: 'pending_review' });
  }
);
