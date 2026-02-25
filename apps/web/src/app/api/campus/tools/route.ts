import { z } from 'zod';
import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  withAuthValidationAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

// ============================================================================
// GET — List active campus tools
// ============================================================================

export const GET = withAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  if (!campusId) {
    return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const sort = url.searchParams.get('sort') as 'popular' | 'recent' | 'rising' | null;

  const db = dbAdmin;
  let query: admin.firestore.Query = db
    .collection('campuses')
    .doc(campusId)
    .collection('campus_tools')
    .where('isActive', '==', true)
    .where('status', '==', 'active');

  if (category) {
    query = query.where('category', '==', category);
  }

  // Apply sort
  if (sort === 'popular') {
    query = query.orderBy('usageStats.totalUses', 'desc');
  } else if (sort === 'recent') {
    query = query.orderBy('createdAt', 'desc');
  } else if (sort === 'rising') {
    query = query.orderBy('usageStats.weeklyUsers', 'desc');
  } else {
    query = query.orderBy('createdAt', 'desc');
  }

  query = query.limit(50);

  const snapshot = await query.get();
  const tools = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return respond.success({ tools });
});

// ============================================================================
// POST — Submit tool for campus review
// ============================================================================

const SubmitToolSchema = z.object({
  toolId: z.string().min(1),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().min(1),
});

export const POST = withAuthValidationAndErrors(
  SubmitToolSchema,
  async (request, _context, validatedData, respond) => {
    const userId = getUserId(request as AuthenticatedRequest);
    const campusId = getCampusId(request as AuthenticatedRequest);

    if (!campusId) {
      return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
    }

    const { toolId, slug, category } = validatedData;
    const db = dbAdmin;

    // Verify tool ownership
    const toolDoc = await db.collection('tools').doc(toolId).get();
    if (!toolDoc.exists) {
      return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }
    const toolData = toolDoc.data();
    const isOwner = toolData?.ownerId === userId || toolData?.createdBy === userId;
    if (!isOwner) {
      return respond.error('You can only submit your own tools', 'FORBIDDEN', { status: 403 });
    }

    // Check slug uniqueness
    const slugCheck = await db
      .collection('campuses')
      .doc(campusId)
      .collection('campus_tools')
      .where('slug', '==', slug)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!slugCheck.empty) {
      return respond.error('A tool with this slug already exists', 'CONFLICT', { status: 409 });
    }

    const deploymentId = `campus_${campusId}_${toolId}`;

    // Create campus tool doc
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
        placedBy: userId,
        placedAt: admin.firestore.FieldValue.serverTimestamp(),
        campusId,
        toolName: toolData?.name || 'Untitled',
        toolDescription: toolData?.description || '',
        usageStats: { weeklyUsers: 0, totalUses: 0 },
        version: toolData?.version || 1,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Create admin notification for review
    await db.collection('notifications').add({
      type: 'campus_tool_submission',
      campusId,
      toolId,
      toolName: toolData?.name || 'Untitled',
      submittedBy: userId,
      slug,
      category,
      status: 'unread',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return respond.created({ deploymentId, slug });
  }
);
