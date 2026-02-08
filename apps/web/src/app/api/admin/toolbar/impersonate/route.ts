import { z } from 'zod';
import {
  withAdminAuthAndErrors,
  getUserId,
  getCampusId,
  type AuthenticatedRequest,
} from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { logAdminActivity } from '@/lib/admin-activity';

const StartImpersonationSchema = z.object({
  targetUserId: z.string().min(1),
});

const EndImpersonationSchema = z.object({
  sessionId: z.string().min(1),
});

/**
 * POST /api/admin/toolbar/impersonate
 * Start viewing as another user (read-only)
 */
export const POST = withAdminAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const adminId = getUserId(req);
  const campusId = getCampusId(req);

  const body = StartImpersonationSchema.parse(await request.json());
  const { targetUserId } = body;

  // Verify target user exists and is on same campus
  const targetProfile = await dbAdmin.collection('profiles').doc(targetUserId).get();

  if (!targetProfile.exists) {
    return respond.error('User not found', 'NOT_FOUND');
  }

  const targetData = targetProfile.data()!;

  if (targetData.campusId !== campusId) {
    return respond.error('User is not on your campus', 'FORBIDDEN');
  }

  // Create audit record
  const sessionRef = await dbAdmin.collection('adminImpersonationSessions').add({
    adminId,
    targetUserId,
    campusId,
    startedAt: new Date(),
    status: 'active',
  });

  await logAdminActivity({
    adminId,
    action: 'start_impersonation',
    targetType: 'user',
    targetId: targetUserId,
    details: { sessionId: sessionRef.id },
  });

  return respond.success({
    sessionId: sessionRef.id,
    profile: {
      id: targetProfile.id,
      displayName: targetData.displayName || targetData.fullName || null,
      email: targetData.email || null,
      handle: targetData.handle || null,
      avatarUrl: targetData.avatarUrl || null,
      bio: targetData.bio || null,
      major: targetData.major || null,
      graduationYear: targetData.graduationYear || null,
      isBuilder: targetData.isBuilder || false,
      schoolId: targetData.schoolId || null,
      campusId: targetData.campusId || null,
      onboardingCompleted: targetData.onboardingCompleted || false,
      createdAt: targetData.createdAt?.toDate?.()?.toISOString() || null,
    },
  });
});

/**
 * DELETE /api/admin/toolbar/impersonate
 * End impersonation session
 */
export const DELETE = withAdminAuthAndErrors(async (request, context, respond) => {
  const req = request as AuthenticatedRequest;
  const adminId = getUserId(req);

  const body = EndImpersonationSchema.parse(await request.json());
  const { sessionId } = body;

  const sessionRef = dbAdmin.collection('adminImpersonationSessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    return respond.error('Session not found', 'NOT_FOUND');
  }

  const sessionData = sessionDoc.data()!;

  if (sessionData.adminId !== adminId) {
    return respond.error('Not your session', 'FORBIDDEN');
  }

  const endedAt = new Date();
  const startedAt = sessionData.startedAt?.toDate?.() || new Date();
  const durationMs = endedAt.getTime() - startedAt.getTime();

  await sessionRef.update({
    status: 'ended',
    endedAt,
  });

  await logAdminActivity({
    adminId,
    action: 'end_impersonation',
    targetType: 'user',
    targetId: sessionData.targetUserId,
    details: { sessionId, durationMs },
  });

  return respond.success({
    ended: true,
    durationMs,
    durationFormatted: `${Math.round(durationMs / 1000)}s`,
  });
});
