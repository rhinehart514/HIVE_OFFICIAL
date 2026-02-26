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
// GET — Get a single campus tool by slug
// ============================================================================

export const GET = withAuthAndErrors(async (
  request,
  { params }: { params: Promise<{ slug: string }> },
  respond,
) => {
  const campusId = getCampusId(request as AuthenticatedRequest);
  if (!campusId) {
    return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
  }

  const { slug } = await params;
  const db = dbAdmin;

  const snapshot = await db
    .collection('campuses')
    .doc(campusId)
    .collection('campus_tools')
    .where('slug', '==', slug)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
  }

  const doc = snapshot.docs[0];
  return respond.success({ tool: { id: doc.id, ...doc.data() } });
});

// ============================================================================
// PATCH — Admin review actions
// ============================================================================

const ReviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'pause', 'promote']),
  badge: z.enum(['official', 'community']).optional(),
});

export const PATCH = withAuthValidationAndErrors(
  ReviewSchema,
  async (
    request,
    { params }: { params: Promise<{ slug: string }> },
    validatedData,
    respond,
  ) => {
    const campusId = getCampusId(request as AuthenticatedRequest);
    if (!campusId) {
      return respond.error('Campus context required', 'INVALID_INPUT', { status: 400 });
    }

    const { slug } = await params;
    const { action, badge } = validatedData;
    const db = dbAdmin;

    // Find the campus tool by slug
    const snapshot = await db
      .collection('campuses')
      .doc(campusId)
      .collection('campus_tools')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return respond.error('Tool not found', 'RESOURCE_NOT_FOUND', { status: 404 });
    }

    const doc = snapshot.docs[0];
    const toolRef = doc.ref;
    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    switch (action) {
      case 'approve':
        updates.status = 'active';
        break;
      case 'reject':
        updates.status = 'rejected';
        updates.isActive = false;
        break;
      case 'pause':
        updates.status = 'paused';
        break;
      case 'promote':
        updates.badge = badge || 'official';
        break;
    }

    await toolRef.update(updates);

    // Notify the tool owner about the review decision
    const toolData = doc.data();
    const ownerId = toolData?.placedBy as string | undefined;
    if (ownerId && (action === 'approve' || action === 'reject')) {
      try {
        const { createNotification } = await import('@/lib/notification-service');
        const toolName = (toolData?.toolName as string) || 'your tool';
        if (action === 'approve') {
          await createNotification({
            userId: ownerId,
            type: 'system',
            category: 'tools',
            title: `${toolName} approved for campus`,
            body: 'Your tool is now live in the campus directory.',
            actionUrl: `/campus/tools/${slug}`,
            metadata: { campusToolApproved: true, slug },
          });
        } else {
          await createNotification({
            userId: ownerId,
            type: 'system',
            category: 'tools',
            title: `${toolName} not approved`,
            body: 'Your campus tool submission was not approved. You can edit and resubmit.',
            actionUrl: `/lab?toolId=${toolData?.toolId}`,
            metadata: { campusToolRejected: true, slug },
          });
        }
      } catch {
        // Non-blocking — don't fail the review action if notification fails
      }
    }

    return respond.success({ slug, action, updated: true });
  }
);
